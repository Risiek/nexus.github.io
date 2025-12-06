/**
 * Conflict Analyzer
 * Uses AI to extract conflict data:
 * - Region & conflict name
 * - Event type (airstrike, talks, etc)
 * - Actors involved
 * - Tension score (1-10)
 * - Severity assessment
 */

class ConflictAnalyzer {
  constructor(geminiService, aiQueue, batchProcessor) {
    this.gemini = geminiService;
    this.queue = aiQueue;
    this.batch = batchProcessor;
  }

  /**
   * Analyze conflicts in batch
   */
  async analyzeConflicts(articles, options = {}) {
    const { batchSize = 5, priority = 1 } = options;

    console.log(`\n🔍 ANALYZING ${articles.length} conflict articles...\n`);

    const batches = this.chunk(articles, batchSize);
    const results = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPrompt = this.createAnalysisBatchPrompt(batch);
      const promptHash = this.gemini.hashPrompt(batchPrompt);

      try {
        const result = await this.queue.add({
          promptHash,
          prompt: batchPrompt,
          priority,
          metadata: {
            type: 'conflict_analysis_batch',
            batchIndex: i,
            batchSize: batch.length,
            execute: async (prompt) => {
              const response = await this.gemini.call(prompt, { maxTokens: 800 });
              return this.parseAnalysisBatchResponse(response.text, batch);
            },
          },
          estimatedTokens: this.batch.estimateBatchTokens(batchPrompt),
        });

        results.push(...result);
        console.log(`   ✅ Batch ${i + 1}/${batches.length}: ${batch.length} articles analyzed`);
      } catch (error) {
        console.error(`   ❌ Batch ${i + 1} failed:`, error.message);
        // Fallback: assign default conflict data
        results.push(
          ...batch.map((a) => ({
            ...a,
            conflict_region: 'Unknown',
            conflict_name: 'Unknown Conflict',
            event_type: 'news',
            actors: [],
            tension_score: 5,
            severity: 5,
            analysis_confidence: 0,
          }))
        );
      }
    }

    return results;
  }

  /**
   * Create batch analysis prompt
   */
  createAnalysisBatchPrompt(articles) {
    const list = articles
      .map(
        (a, idx) =>
          `${idx + 1}. TITLE: "${a.title}"\n   SOURCE: ${a.source}\n   TEXT: ${a.description?.slice(0, 300) || ''}`
      )
      .join('\n\n');

    return `Analyze these conflict-related news articles. For each, extract:
1. conflict_region: "Eastern Europe", "Middle East", "Asia-Pacific", etc
2. conflict_name: "Russia-Ukraine War", "Israel-Hamas", "Taiwan Strait", etc
3. event_type: "airstrike", "talks", "ceasefire", "sanctions", "military_movement", "diplomatic", "humanitarian"
4. actors: array of countries/groups involved
5. tension_score: 1-10 (1=peace talks, 10=major escalation)
6. severity: 1-10 (damage, casualties, strategic impact)

${list}

Respond ONLY with valid JSON array like:
[
  {"index": 1, "conflict_region": "Eastern Europe", "conflict_name": "Russia-Ukraine War", "event_type": "airstrike", "actors": ["Russia", "Ukraine"], "tension_score": 8, "severity": 7},
  {"index": 2, "conflict_region": "Middle East", "conflict_name": "Israel-Hamas", "event_type": "diplomatic", "actors": ["Israel", "Hamas", "Egypt"], "tension_score": 6, "severity": 6}
]`;
  }

  /**
   * Parse batch analysis response
   */
  parseAnalysisBatchResponse(text, articles) {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]);

      return articles.map((article, idx) => {
        const analysis = parsed.find((r) => r.index === idx + 1);
        return {
          ...article,
          conflict_region: analysis?.conflict_region || 'Unknown',
          conflict_name: analysis?.conflict_name || 'Unknown Conflict',
          event_type: analysis?.event_type || 'news',
          actors: analysis?.actors || [],
          tension_score: Math.max(1, Math.min(10, analysis?.tension_score || 5)),
          severity: Math.max(1, Math.min(10, analysis?.severity || 5)),
          analysis_confidence: 0.85,
        };
      });
    } catch (error) {
      console.error('   ⚠️  Failed to parse conflict analysis:', error.message);
      return articles.map((a) => ({
        ...a,
        conflict_region: 'Unknown',
        conflict_name: 'Unknown Conflict',
        event_type: 'news',
        actors: [],
        tension_score: 5,
        severity: 5,
        analysis_confidence: 0,
      }));
    }
  }

  /**
   * Calculate trend for region
   */
  calculateTrend(conflictArticles) {
    if (conflictArticles.length === 0) return 'stable';

    // Look at tension scores over time
    const recentScores = conflictArticles.slice(0, 10).map((a) => a.tension_score || 5);
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    const olderScores = conflictArticles.slice(10, 20).map((a) => a.tension_score || 5);
    const avgOlder = olderScores.length > 0 ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length : avgRecent;

    const diff = avgRecent - avgOlder;
    if (Math.abs(diff) < 0.5) return 'stable';
    return diff > 0 ? 'escalating' : 'de-escalating';
  }

  /**
   * Group articles by conflict region
   */
  groupByRegion(articles) {
    const grouped = {};

    for (const article of articles) {
      const region = article.conflict_region || 'Unknown';
      if (!grouped[region]) {
        grouped[region] = [];
      }
      grouped[region].push(article);
    }

    return grouped;
  }

  /**
   * Get top conflicts by tension
   */
  getTopConflicts(articles, limit = 5) {
    const byRegion = this.groupByRegion(articles);
    const conflicts = [];

    for (const [region, regionArticles] of Object.entries(byRegion)) {
      const avgTension = regionArticles.reduce((sum, a) => sum + (a.tension_score || 5), 0) / regionArticles.length;
      const latestArticle = regionArticles[0];
      const trend = this.calculateTrend(regionArticles);

      conflicts.push({
        region,
        conflict_name: latestArticle?.conflict_name || 'Unknown',
        tension_level: this.getTensionLevel(avgTension),
        tension_score: Math.round(avgTension),
        trend,
        article_count: regionArticles.length,
        latest_headline: latestArticle?.title,
        latest_time: latestArticle?.publishedAt,
        articles: regionArticles,
      });
    }

    // Sort by tension score DESC
    return conflicts.sort((a, b) => b.tension_score - a.tension_score).slice(0, limit);
  }

  /**
   * Convert score to level
   */
  getTensionLevel(score) {
    if (score <= 3) return 'Low';
    if (score <= 5) return 'Medium';
    if (score <= 7) return 'High';
    return 'Critical';
  }

  /**
   * Get tension color for UI
   */
  getTensionColor(score) {
    if (score <= 3) return '#10b981'; // Green
    if (score <= 5) return '#f59e0b'; // Yellow
    if (score <= 7) return '#f97316'; // Orange
    return '#dc2626'; // Red
  }

  /**
   * Utility: chunk array
   */
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export default ConflictAnalyzer;
