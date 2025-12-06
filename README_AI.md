# 🤖 AI Integration Guide - NEXUS Project

## Overview

NEXUS integrates **Gemini 2.5 Flash-Lite** API for intelligent news processing:

- **Categorization** - Classify articles into 10+ categories
- **Geolocation** - Extract locations from text for map visualization
- **Summarization** - Generate 2-3 sentence summaries
- **Smart Queuing** - Rate-limited, priority-based processing
- **Cost Optimization** - Batch processing reduces API calls by 80%

## Architecture

```
lib/
├── ai-queue.js           ← Rate limiter + priority queue (15 RPM max)
├── gemini-service.js     ← Unified Gemini API wrapper
├── batch-processor.js    ← Batch operations (10 items per request)
└── token-counter.js      ← Token usage tracking

scripts/
├── enrich-news.js        ← Main enrichment script (uses queue system)
├── fetch-market.js       ← Market data + sentiment analysis
└── ai-monitor.js         ← Usage monitoring & cost tracking
```

## Setup

### 1. Get API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create new API key
3. Set in environment:

```bash
export GEMINI_API_KEY="your-key-here"
```

Or create `.env.local`:
```
GEMINI_API_KEY=your-key-here
```

### 2. Install Dependencies

All dependencies are already in `package.json`:
```bash
npm install
```

## Usage

### Enrich News with AI

```bash
# Full enrichment with queue system
GEMINI_API_KEY="your-key" npm run build:database

# Or directly:
GEMINI_API_KEY="your-key" node scripts/enrich-news.js
```

**What it does:**
1. Loads raw articles from `public/data/articles.json`
2. Deduplicates (removes duplicates)
3. Prioritizes by age (breaking news first)
4. Processes in batches via AI Queue:
   - Priority 1: Last 10 min (smaller batches, max 4 AI calls)
   - Priority 2: Last 24h (medium batches, max 2 AI calls)
   - Priority 3: Archive (larger batches, max 1 AI call)
5. Saves to `public/data/articles-enriched.json`

### Monitor AI Usage

```bash
node scripts/ai-monitor.js
```

Shows:
- Enriched articles count
- Category breakdown
- Daily limits & costs
- Pricing estimates

## Limits & Pricing

### Daily Budget

| Metric | Limit | Cost |
|--------|-------|------|
| Requests | 900/day (15 RPM) | ~$0.23 |
| Tokens | 250,000/day | ~$2.50 |
| Cost | - | **~$2.73/day** |

**Free Tier:** 1500 requests/day (enough for 750 articles × 2 calls)

### Rate Limiting

- **Max:** 15 requests/minute (~4 seconds between requests)
- **Retry:** Exponential backoff (1s, 2s, 4s, 8s...)
- **Max retries:** 3 times before failing

### Token Estimation

- **Input token:** ~0.25 per character (rough)
- **Output token:** ~0.3 per word (rough)
- **Max per request:** 1500 tokens (strict limit)

## Data Schema

### Enriched Article

```json
{
  "guid": "unique-id",
  "title": "Article Title",
  "description": "Full article text...",
  "url": "https://...",
  "publishedAt": "2024-12-06T10:00:00Z",
  "source": "Onet",
  "category": "polityka",
  "categoryConfidence": 0.92,
  "summary": "2-3 sentence summary",
  "location": [
    {
      "city": "Warsaw",
      "country": "Poland",
      "lat": 52.23,
      "lng": 21.01
    }
  ],
  "priority": 4,
  "enriched_at": "2024-12-06T11:00:00Z"
}
```

## Advanced Usage

### Custom Batch Size

```javascript
// Large batches (30 items) - fewer requests
await batchProcessor.categorizeArticles(articles, { batchSize: 30 });

// Small batches (5 items) - more accurate for breaking news
await batchProcessor.categorizeArticles(articles, { batchSize: 5 });
```

### Priority Levels

```javascript
// Breaking news (priority 1) - processed first
await queue.add({ ..., priority: 1 });

// Regular news (priority 2) - processed next
await queue.add({ ..., priority: 2 });

// Archive (priority 3) - processed last
await queue.add({ ..., priority: 3 });
```

### Token Budget Tracking

```javascript
const status = aiQueue.getStatus();
console.log(`Used: ${status.tokensUsed}/${status.maxTokensPerDay}`);
console.log(`Remaining: ${status.tokensRemaining}`);
```

## Troubleshooting

### "API key not valid"

Check:
```bash
echo $GEMINI_API_KEY
```

Should print your key, not be empty.

### "Daily request limit reached"

You've processed 900 articles today. Queue resets at midnight UTC.

### "Token budget exceeded"

Your articles are too large. The system checks:
- Input + output tokens ≤ 1500 per request
- Total daily ≤ 250,000

### Empty categories?

Network error or API failed. Check:
- Internet connection
- API key is valid
- Not rate-limited (wait 60 seconds)

## GitHub Actions Integration

The CI pipeline automatically:

1. Every 3 hours: Fetch fresh RSS feeds
2. Dedup & enrich with AI
3. Build SQLite database
4. Deploy to GitHub Pages

See `.github/workflows/update-data.yml`

## Cost Optimization Tips

### 1. Batch Processing ✅ (reduces calls by 80%)

Instead of:
```javascript
for (const article of articles) {
  await gemini.call(categoryPrompt);  // 121 calls
}
```

Do:
```javascript
await batchProcessor.categorizeArticles(articles, { batchSize: 10 });  // 13 calls
```

**Saving:** 121 → 13 API calls = **89% reduction**

### 2. Deduplication ✅

Remove duplicate articles before enrichment:
```javascript
const unique = articles.filter(...);  // Remove duplicates
const enriched = await enrich(unique);
```

### 3. Priority-Based Processing ✅

Process breaking news first (smaller batches):
- Priority 1 (0-10 min): 4 AI calls/article
- Priority 2 (10m-24h): 2 AI calls/article  
- Priority 3 (>24h): 1 AI call/article

### 4. Caching ✅

Same article title? Use cached result:
```javascript
const cached = dedupCache.get(promptHash);
if (cached) return cached;  // Skip API call
```

## Phase 2 Roadmap

- [ ] Sentiment analysis (positive/negative/neutral)
- [ ] Trend detection (rising topics)
- [ ] Duplicate clustering (group similar news)
- [ ] Fact-checking integration
- [ ] Real-time alerts for breaking news
- [ ] User recommendations based on interests

## Support

Check logs:
```bash
# View request queue status
GEMINI_API_KEY="..." node scripts/enrich-news.js 2>&1 | grep "Queue\|Status"

# Monitor API usage
node scripts/ai-monitor.js

# Check enriched data
head -20 public/data/articles-enriched.json
```

---

**Last Updated:** December 6, 2024  
**API:** Gemini 2.5 Flash-Lite  
**Rate Limit:** 15 requests/minute  
**Free Tier:** ✅ Sufficient for most use cases
