# 📊 NEXUS PIPELINE - PEŁNA INTEGRACJA

## Overview

NEXUS to zaawansowany system agregacji i wzbogacania wiadomości z globalnych źródeł. System składa się z 3 głównych pipeline'ów, które pracują niezależnie ale mogą być uruchamiane razem.

## Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     NEXUS FULL PIPELINE                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─ NEWS PIPELINE (General News)                                │
│  │  1. fetch:rss          → articles.json (RSS feeds)           │
│  │  2. enrich:news        → articles-enriched.json (AI)         │
│  │  3. build:database     → news.db (SQLite)                    │
│  │                                                               │
│  ├─ CONFLICT PIPELINE (Military Conflicts)                      │
│  │  1. fetch:conflicts    → conflicts-raw.json (8 feeds)        │
│  │  2. enrich:conflicts   → conflicts-enriched.json + summary   │
│  │                                                               │
│  ├─ MARKET PIPELINE (Financial Data)                            │
│  │  1. fetch:market       → market.json (API)                   │
│  │                                                               │
│  └─ MONITORING                                                   │
│     1. ai:monitor        → Usage stats & cost tracking          │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Pipeline Commands

### News Pipeline

**Fetch RSS feeds:**
```bash
npm run fetch:rss
# Inputs: RSS feed URLs from RSS sources
# Outputs: public/data/articles.json (~100-150 articles)
# Time: ~2-3 minutes
# Cost: $0 (no API)
```

**Enrich with AI:**
```bash
npm run enrich:news
# Inputs: articles.json (raw)
# Process:
#   - Deduplication (121 → 121 unique)
#   - Categorization (polityka, gospodarka, etc)
#   - Location extraction (Poland, Europe, Global)
#   - Summarization (2-3 sentence summaries)
# Outputs: articles-enriched.json
# Time: ~15-30 minutes (depends on volume)
# Cost: ~$0.10 for 121 articles (batched)
# API calls: ~13 (vs 242 without batching)
```

**Build database:**
```bash
npm run build:database
# Runs both fetch:rss and enrich:news, then builds SQLite
# Outputs:
#   - public/data/news.db (binary SQLite database)
#   - articles-enriched.json (JSON backup)
# Time: ~20-40 minutes total
# Cost: ~$0.10
```

### Conflict Pipeline

**Fetch conflict articles:**
```bash
npm run fetch:conflicts
# Inputs: 8 conflict-specialized RSS feeds
# Filtering: 40+ keywords (war, conflict, airstrike, etc)
# Outputs: public/data/conflicts-raw.json (50-100 articles)
# Time: ~1-2 minutes
# Cost: $0
```

**Enrich conflicts with AI:**
```bash
npm run enrich:conflicts
# Inputs: conflicts-raw.json
# Process:
#   - AI analysis (Gemini 2.5 Flash-Lite)
#   - Region extraction (Eastern Europe, Middle East, etc)
#   - Tension scoring (1-10)
#   - Trend calculation (escalating/stable/de-escalating)
# Outputs:
#   - conflicts-enriched.json (full data)
#   - conflicts-summary.json (top 5 conflicts)
# Time: ~5-10 minutes
# Cost: ~$0.02
# API calls: ~15 (batched)
```

**Full conflict pipeline:**
```bash
npm run build:conflicts
# Runs: fetch:conflicts → enrich:conflicts
# Time: ~10-15 minutes
# Cost: ~$0.02
```

### Market Pipeline

**Fetch market data:**
```bash
npm run fetch:market
# Inputs: Financial APIs (forex, stocks, crypto)
# Outputs: public/data/market.json (real-time data)
# Time: ~30 seconds
# Cost: $0 (free tier APIs)
# Update frequency: Every 4 hours
```

### Monitoring

**Check AI usage:**
```bash
npm run ai:monitor
# Shows:
#   - Total enriched articles
#   - API calls used
#   - Tokens consumed
#   - Cost estimates
#   - Daily limits & remaining budget
# Example output:
#   Articles enriched: 121
#   API calls: ~13
#   Tokens used: ~14,000
#   Cost: $0.10
#   Daily remaining: 236,000 tokens ($0.24)
```

## Data Flow

### Article Lifecycle

```
RAW ARTICLE (RSS)
├─ guid: "rss-guid-123"
├─ title: "Breaking news..."
├─ description: "..."
├─ url: "https://..."
├─ source: "Reuters"
└─ publishedAt: "2024-12-20T10:00:00Z"
  ↓
ENRICHMENT (AI)
├─ category: "polityka" | "gospodarka" | "nauka" | "inne"
├─ categoryConfidence: 0.95
├─ location: "Poland"
├─ summary: "2-3 sentence summary..."
├─ priority: 1 (breaking) | 2 (urgent) | 3 (normal)
└─ enriched_at: "2024-12-20T10:15:00Z"
  ↓
DATABASE (SQLite)
├─ Stored in articles table
├─ Indexed by: guid, publishedAt, category, priority
├─ Queryable via SQL: SELECT * FROM articles WHERE category='polityka'
└─ Available for frontend via HTTP Range requests
```

### Conflict Lifecycle

```
RAW CONFLICT ARTICLE (RSS)
├─ guid: "conflict-123"
├─ title: "Military clash in Kharkiv..."
├─ source: "Kyiv Independent"
└─ publishedAt: "2024-12-20T10:00:00Z"
  ↓
AI ENRICHMENT
├─ conflict_region: "Eastern Europe"
├─ conflict_name: "Russia-Ukraine Conflict"
├─ event_type: "military_engagement" | "ceasefire" | "diplomacy"
├─ actors: "Russian Armed Forces, Ukrainian Armed Forces"
├─ tension_score: 1-10
├─ severity: 1-10
├─ trend: "escalating" | "stable" | "de-escalating"
└─ summary: "Detailed AI summary..."
  ↓
CONFLICT SUMMARY (Top 5)
├─ region: "Eastern Europe"
├─ tension_level: "Critical"
├─ article_count: 23
├─ latest_headline: "..."
├─ color: "#dc2626" (red)
└─ trend: "📈 Escalating"
  ↓
DASHBOARD WIDGET
├─ Regional cards (sorted by tension)
├─ Tension bars + icons
├─ Latest stories
└─ Click for full timeline
```

## File Structure

```
public/data/
├─ articles.json              # Raw articles from RSS feeds
├─ articles-enriched.json     # Enriched articles (AI processed)
├─ news.db                    # SQLite database (binary)
├─ conflicts-raw.json         # Raw conflict articles (8 feeds)
├─ conflicts-enriched.json    # AI-enriched conflicts
├─ conflicts-summary.json     # Top 5 conflicts (for widget)
├─ market.json                # Real-time market data
├─ last-update.json           # Timestamp of last update
└─ articles-enriched.db       # [Future] Backup in DB format

scripts/
├─ fetch-rss.js               # RSS feed aggregation
├─ enrich-news.js             # AI enrichment for news
├─ fetch-market.js            # Market data API calls
├─ build-database.js          # SQLite database builder
├─ fetch-conflicts.js         # Conflict RSS aggregation
├─ enrich-conflicts.js        # AI enrichment for conflicts
└─ ai-monitor.js              # Usage tracking

lib/
├─ ai-queue.js                # Rate limiter + request queue
├─ gemini-service.js          # Gemini API wrapper
├─ batch-processor.js         # Batch AI operations
└─ conflict-analyzer.js       # Conflict intelligence extractor

src/
├─ dashboard.ts               # Main dashboard component
├─ article-detail.ts          # Article detail view
├─ conflict-monitor.ts        # Conflict widget component
├─ services/articles.ts       # SQLite data service
└─ globe/                      # 3D globe visualization
```

## Typical Workflow

### Daily Update (Recommended)

```bash
# Morning run: Complete refresh
npm run build:database    # ~20-40 min
npm run build:conflicts   # ~10-15 min
npm run ai:monitor        # Check usage

# Output:
# ✅ news.db updated (121 articles)
# ✅ conflicts-summary.json updated (5 conflicts)
# ✅ ~$0.12 spent
# ✅ ~28,000 tokens used
# ✅ Budget remaining: 222,000 tokens
```

### Hourly Updates (Optional)

```bash
# Just get latest without AI enrichment
npm run fetch:rss        # Get new articles (~2 min)
npm run fetch:conflicts  # Get new conflicts (~1 min)
npm run fetch:market     # Update market data (~30 sec)

# Optional: If volume > 50 new articles
npm run enrich:news      # AI process new ones
```

### Emergency Conflict Alert

```bash
# Fast update for breaking conflict news
npm run fetch:conflicts   # Get latest conflict data
npm run enrich:conflicts  # Immediate AI analysis
# Widget updates within 5 minutes
```

## Cost Optimization

### Current Setup

| Pipeline | Articles | API Calls | Tokens | Cost |
|----------|----------|-----------|--------|------|
| News | 121 | ~13 | ~14,000 | $0.10 |
| Conflicts | 75 | ~15 | ~12,000 | $0.02 |
| **Total** | **196** | **~28** | **~26,000** | **$0.12** |

**Free Tier Limits (Daily):**
- Max tokens: 250,000
- Max requests: 900 (15 RPM)
- Max cost: ~$0.24/day

**Current utilization: 10% of daily budget**

### Optimization Tips

1. **Batch size tuning** (current: 5-10 items)
   - Larger batches = fewer API calls but longer processing
   - Smaller batches = faster response but more API calls

2. **Reduce feed frequency**
   - Run news pipeline every 4-6 hours (vs hourly)
   - Saves ~50% API costs while keeping data fresh

3. **Filter by importance**
   - Only enrich high-priority articles (breaking news)
   - Skip local/minor stories

4. **Cache summaries**
   - Don't re-enrich articles > 24 hours old
   - Use existing summaries from database

## Integration Points

### Frontend Integration

```typescript
// In dashboard.ts
import ConflictMonitor from './conflict-monitor'

// After dashboard renders:
const monitor = new ConflictMonitor()
await monitor.populate()  // Loads conflicts-summary.json

// In services/articles.ts
const articles = await articlesService.getTopArticles(5)
// Queries news.db via HTTP Range requests
```

### Backend Integration

```javascript
// enrich-news.js uses:
const aiQueue = new AIQueue()              // Rate limiter
const gemini = new GeminiService(key)      // API wrapper
const batch = new BatchProcessor(gemini)   // Batch operations

// Process 121 articles:
// - Batch 1-5: Categorize (5 items → 1 request)
// - Batch 6-10: Locate (5 items → 1 request)
// - Batch 11-15: Summarize (3 items → 1 request)
// = ~13 total API requests vs 121 sequential
```

## Monitoring & Alerts

### What to Monitor

```bash
# Daily checks
npm run ai:monitor

# Look for:
✅ Articles enriched increasing
✅ API calls within limits (<900/day)
✅ Tokens < 250,000/day
✅ No error spikes
✅ Processing time < 40 min
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| High API calls | Bad batching | Review batch sizes in enrich scripts |
| Slow processing | Large volume | Reduce feed frequency or filter |
| High costs | Too many enrichments | Use priority-based processing |
| Empty results | API key invalid | Check GEMINI_API_KEY env var |
| Duplicate articles | Bad dedup logic | Check guid matching in fetch scripts |

## Version History

### v1.0 (Current - MVP)

✅ **Completed**
- News RSS aggregation (8+ feeds)
- AI enrichment (Gemini 2.5 Flash-Lite)
- SQLite database (HTTP Range streaming)
- Conflict monitoring (5 regions)
- Rate limiting (15 RPM, 250k tokens/day)
- Dashboard widget integration
- Cost tracking

### v2.0 (Planned)

🔄 **In Development**
- ACLED API integration
- Tension historical graphs
- Map visualization with hotspots
- Advanced filtering UI
- Conflict notifications
- Comparative analysis

### v3.0 (Future)

📅 **Planned**
- GDELT integration
- Social media monitoring
- Predictive tension modeling
- Real-time alerting system
- Mobile app integration

## Getting Started

### Prerequisites

```bash
# Node.js 18+
node --version

# Install dependencies
npm install

# Set environment variable
export GEMINI_API_KEY="your-key-here"
```

### First Run

```bash
# 1. Build everything
npm run build:database
npm run build:conflicts

# 2. Check AI usage
npm run ai:monitor

# 3. Start dev server
npm run dev

# 4. Open browser
# http://localhost:5173
```

### What You'll See

1. **Dashboard** - Featured story + Politics section (4 articles)
2. **Conflict Monitor** - Regional cards (top 5 conflicts)
3. **Live Ticker** - Updates with latest breaking news
4. **Market Data** - Real-time currency & index data

## Support & Documentation

- **News Pipeline**: See `README_AI.md`
- **Conflict System**: See `README_CONFLICTS.md`
- **Architecture Decisions**: Check code comments in `lib/` scripts
- **API Integration**: Review `DEPLOYMENT.md`

## License

© 2024 NEXUS PL. All rights reserved.

---

**Last Updated**: 2024-12-20
**Status**: ✅ Production Ready (MVP Phase)
**Maintainer**: NEXUS AI Team
