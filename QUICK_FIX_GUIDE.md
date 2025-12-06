# Quick Fix Guide: Gemini API Quota Issues

## What Went Wrong
GitHub Actions workflow was taking **33 minutes** and only processing **3 articles** out of 119 before hitting:
- **Error 429**: "You exceeded your current quota" (free tier: 20 req/min)
- **"Prompt too large"**: Batches of 54 articles = 1,500+ tokens (exceeds 1,500 max)

## What Was Fixed

### Batch Sizes (lib/batch-processor.js)
```
OLD: 10-54 articles per batch  →  NEW: 2-3 articles per batch
```
- Old: ~1,500 tokens per batch (exceeds limit) ❌
- New: ~200-300 tokens per batch (safe) ✅

### Rate Limiting (lib/ai-queue.js)
```
OLD: 15 requests/min  →  NEW: 10 requests/min
```
- Old: Too close to 20 RPM free tier limit ❌
- New: 50% safe margin from quota ✅

## How to Run Next Time

### Option 1: Manual GitHub Actions
1. Go to https://github.com/Risiek/nexus.github.io/actions
2. Select "Update News & Market Data" workflow
3. Click "Run workflow"
4. Should now complete in 10-15 minutes instead of 33+ min

### Option 2: Local Test
```bash
# Set API key
export GEMINI_API_KEY=your-key

# Run enrichment
npm run enrich
```

## What to Expect

**After fixes:**
- ✅ No 429 quota errors
- ✅ No "Prompt too large" errors
- ✅ ~15-20 minutes for 119 articles
- ✅ ~27,000 tokens used (out of 250,000 daily)
- ✅ ~10 API requests (out of 600 daily limit)

**Before:**
- ❌ 33+ minutes
- ❌ Only 3 articles processed
- ❌ 128 failed batches
- ❌ Hit free tier quota

## Key Numbers

| Metric | Before | After |
|--------|--------|-------|
| Time | 33+ min | 10-15 min |
| Success | 3/119 | 119/119 |
| API Calls | 131 | ~40 |
| Batch Size | 10-54 | 2-3 |
| RPM Rate | 15 | 10 |
| Token Use | Exceeded | ~27k/250k |

## Files Changed
1. **lib/batch-processor.js** - Smaller batch sizes
2. **lib/ai-queue.js** - 10 RPM rate limit
3. **scripts/enrich-news.js** - Updated params
4. **GEMINI_API_FIXES.md** - Full technical details

## Next Time This Happens
- Check batch token estimates (should be <500 tokens total)
- Never exceed 20 req/min on free tier (use 10 RPM for safety)
- Verify batch output + max tokens = <1500

Commit: `eceb337` ✅
