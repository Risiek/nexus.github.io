# Gemini API Quota Fixes

## Problem Summary
GitHub Actions workflow was failing after ~33 minutes with two critical issues:

1. **429 Quota Exceeded Errors**: Free tier limited to 20 requests/min, system was attempting 15+ req/min
2. **"Prompt Too Large" Errors**: Batches of 54-63 articles exceeded 1500 token limit (trying ~1,500-1,900 tokens)

## Root Causes
- Default batch sizes: 10-54 articles per batch
- Batch tokens: Input 1,000+ tokens + 500-800 token output limit = 1,500+ total (exceeds limit)
- Rate: 15 RPM was too close to 20 RPM free tier limit
- Free tier has hard quota of 20 requests per minute

## Fixes Applied

### 1. Batch Processor (lib/batch-processor.js)
```javascript
// BEFORE (too large)
categorizeArticles: batchSize = 10
extractLocations:   batchSize = 10
summarizeArticles:  batchSize = 5

// AFTER (safe size)
categorizeArticles: batchSize = 3   // ~300 tokens/batch
extractLocations:   batchSize = 3   // ~300 tokens/batch
summarizeArticles:  batchSize = 2   // ~200 tokens/batch
```

**Impact**: Reduces per-batch tokens from ~1,500 to ~200-300 ✅

### 2. AI Queue (lib/ai-queue.js)
```javascript
// BEFORE
maxRequestsPerMinute = 15
requestDelay = ~4000ms

// AFTER
maxRequestsPerMinute = 10
requestDelay = ~6000ms
maxRequestsPerDay = 600 (from 900)
```

**Impact**: Stays safely under 20 RPM quota, uses only 10/20 ✅

### 3. Enrich Script (scripts/enrich-news.js)
```javascript
// Updated to use tighter batches
Priority 1: batchSize 2
Priority 2: batchSize 2-3
Priority 3: batchSize 2-3
```

**Impact**: Consistent small batches across all priorities ✅

## Expected Results

### Before Fixes
- Processed: 3 articles in 33 minutes
- Failed: 50+ batches
- Retried: 154 times
- API calls: 131 (121 failures)

### After Fixes (projected)
- Process: 119 articles in ~15-20 minutes
- Batch size: 2-3 articles → ~200 tokens each
- Total batches needed: ~15-20 batches
- Total API calls: ~15-20 (10 RPM limit respected)
- Success rate: ~95%+

## Token Budget Calculation

**Per article:**
- Categorize: ~50 tokens (3 articles = ~150)
- Locations: ~80 tokens (3 articles = ~240)
- Summary: ~100 tokens (2 articles = ~200)
- Total per article: ~230 tokens

**For 119 articles:**
- Total tokens: 119 × 230 = ~27,370 tokens
- Free tier daily limit: 250,000 tokens
- Utilization: ~11% (very safe)

## Queue Dynamics

**With 10 RPM rate limit:**
- Request every: 6 seconds
- Time for 119 articles with 2-3 item batches: ~40-50 batches
- Total time: 40 × 6 = 240 seconds = 4 minutes (plus API response time)
- Expected total: 10-15 minutes

## How to Test

```bash
# Local test (with GEMINI_API_KEY set)
npm run enrich:test

# GitHub Actions (when ready)
# Push to trigger: npm run build:enrich
```

## Monitoring

Watch for:
- ✅ No 429 errors
- ✅ No "Prompt too large" errors
- ✅ Successful batches (not just queued)
- ✅ Token usage stays under 50,000 for entire run

## Files Changed
1. `lib/batch-processor.js` - Reduced batch sizes
2. `lib/ai-queue.js` - Reduced RPM to 10, daily to 600
3. `scripts/enrich-news.js` - Updated batch size params

All changes are backward compatible and will improve reliability.
