# GitHub Actions Schedule Configuration

## Timeline (UTC)

```
02:00 → Update News & Market Data starts
        ├─ Fetch RSS feeds (~2 min)
        ├─ Enrich with AI (~10-15 min, with new 10 RPM limits)
        ├─ Fetch market data (~3 min)
        ├─ Build database (~2 min)
        ├─ Fetch conflicts (~2 min)
        └─ Enrich conflicts (~5 min)
        
02:15 → Deploy to GitHub Pages starts
        ├─ Checkout & setup (~2 min)
        ├─ Build Vite (~3 min)
        └─ Deploy (~1 min)
        
02:25 → Both complete, dashboard live with fresh data ✅

---

08:00 → Repeat (4x daily schedule)
14:00 → Repeat
20:00 → Repeat
```

## Why This Schedule?

### 4x Daily (6-hour intervals)
- **Frequency**: Updates 4 times per day (02:00, 08:00, 14:00, 20:00 UTC)
- **Coverage**: Different timezones get fresh data during their working hours
- **Free Tier Safe**: 4 runs/day × 1-2 min API usage = safe under quota
- **Spacing**: 6 hours between runs prevents API quota conflicts

### 15-Minute Delay for Deploy
- **Reason**: Data update pipeline takes ~15-25 minutes
- **Timing**: Deploy starts at T+15 min when data update is complete
- **Ensures**: Fresh data committed before deployment
- **Prevents**: Building with stale data

### Manual Override
- All workflows support `workflow_dispatch`
- Can trigger anytime from GitHub UI:
  - https://github.com/Risiek/nexus.github.io/actions

## Workflow Details

### 1. Update News & Market Data (`update-data.yml`)
```yaml
on:
  schedule:
    - cron: '0 2,8,14,20 * * *'  # Every 6 hours
  workflow_dispatch:               # Manual trigger

Jobs:
  - Fetch RSS feeds (news sources)
  - Enrich articles with Gemini AI (10 RPM rate limit)
  - Fetch market data (stocks, crypto)
  - Build SQLite database
  - Fetch conflict data
  - Enrich conflicts with AI
  - Commit & push changes
  - Upload artifacts
```

**Duration**: 15-25 minutes (with new batch size fixes)

### 2. Deploy to GitHub Pages (`deploy.yml`)
```yaml
on:
  schedule:
    - cron: '15 2,8,14,20 * * *'  # T+15 min after data update
  push:
    branches:
      - main                        # Auto-deploy on any push
  workflow_dispatch:                # Manual trigger

Jobs:
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Build Vite bundle
  - Upload to GitHub Pages
```

**Duration**: 5-8 minutes
**Triggers**: 
- 4x daily scheduled
- Anytime main branch is updated
- Manual via GitHub Actions UI

## API Quota Safety

### Gemini API (Free Tier)
```
Hard Limits:
  - 20 requests/minute
  - 250,000 tokens/day

Our Usage (per update-data run):
  - API calls: ~50 requests/run
  - Rate: 10 RPM (50% safety margin)
  - Tokens: ~27,600 tokens
  
4x Daily:
  - Max tokens: 27,600 × 4 = 110,400/day (44% of quota) ✅
  - Spread out: 6-hour intervals prevent quota spikes
```

### Deploy Workflow
```
No API calls needed - just builds & deploys ✅
```

## Rollback Plan

If something breaks:

1. **Disable all schedules**:
   ```yaml
   on:
     workflow_dispatch:  # Only manual
   ```

2. **Manual trigger** from https://github.com/Risiek/nexus.github.io/actions

3. **Keep push auto-deploy** for production fixes

## Monitor These Times

```
Schedule Window (UTC) → Expected Status
─────────────────────────────────────
02:00-02:25 → Data update + deploy
08:00-08:25 → Data update + deploy
14:00-14:25 → Data update + deploy
20:00-20:25 → Data update + deploy

Outside these windows → Idle (no automatic runs)
                      Manual trigger anytime
```

## Testing the Schedule

```bash
# Manual trigger (immediately)
# Visit: https://github.com/Risiek/nexus.github.io/actions
# Select "Update News & Market Data" or "Deploy"
# Click "Run workflow"

# Or via curl (if using GitHub CLI)
gh workflow run update-data.yml
gh workflow run deploy.yml
```

## Future Optimizations

1. **Conditional Deploy**: Only deploy if data changed
2. **Notification**: Slack/email alerts on failure
3. **Rollback**: Auto-rollback if deploy fails
4. **Metrics**: Track workflow duration trends

---

**Last Updated**: Commit `dc73f63`
**Status**: ✅ Active and scheduled
**Next Run**: 02:00 UTC today
