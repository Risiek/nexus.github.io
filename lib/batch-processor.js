/**
 * Batch AI Processor
 * - Process multiple items in optimized batches
 * - Deduplicate requests
 * - Parallel safe operations
 */

class BatchProcessor {
  constructor(geminiService, aiQueue) {
    this.gemini = geminiService;
    this.queue = aiQueue;
  }

  /**
   * Chunk array into batches
   */
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Deduplicate by custom key
   */
  dedupBy(array, keyFn) {
    const seen = new Set();
    return array.filter((item) => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Batch categorize articles
   * Input: articles array
   * Output: articles with category field
   */
  async categorizeArticles(articles, options = {}) {
    const { batchSize = 3, priority = 2 } = options;

    console.log(`\n🏷️  CATEGORIZING ${articles.length} articles...`);

    // Deduplicate by title
    const unique = this.dedupBy(articles, (a) => a.title);
    const batches = this.chunk(unique, batchSize);

    const results = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPrompt = this.createCategoryBatchPrompt(batch);
      const promptHash = this.gemini.hashPrompt(batchPrompt);

      try {
        const result = await this.queue.add({
          promptHash,
          prompt: batchPrompt,
          priority,
          metadata: {
            type: 'categorize_batch',
            batchIndex: i,
            batchSize: batch.length,
            execute: async (prompt) => {
              const response = await this.gemini.call(prompt, { maxTokens: 500 });
              return this.parseCategoryBatchResponse(response.text, batch);
            },
          },
          estimatedTokens: this.estimateBatchTokens(batchPrompt),
        });

        results.push(...result);
        console.log(`   ✅ Batch ${i + 1}/${batches.length}: ${batch.length} articles categorized`);
      } catch (error) {
        console.error(`   ❌ Batch ${i + 1} failed:`, error.message);
        // Fallback: assign default category
        results.push(
          ...batch.map((a) => ({
            ...a,
            category: 'Inne',
            subcategory: 'Nieznane',
            categoryConfidence: 0,
          }))
        );
      }
    }

    return results;
  }

  /**
   * Batch extract locations
   */
  async extractLocations(articles, options = {}) {
    const { batchSize = 3, priority = 2 } = options;

    console.log(`\n📍 EXTRACTING locations from ${articles.length} articles...`);

    const unique = this.dedupBy(articles, (a) => a.guid);
    const batches = this.chunk(unique, batchSize);

    const results = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPrompt = this.createLocationBatchPrompt(batch);
      const promptHash = this.gemini.hashPrompt(batchPrompt);

      try {
        const result = await this.queue.add({
          promptHash,
          prompt: batchPrompt,
          priority,
          metadata: {
            type: 'extract_locations_batch',
            batchIndex: i,
            batchSize: batch.length,
            execute: async (prompt) => {
              const response = await this.gemini.call(prompt, { maxTokens: 800 });
              return this.parseLocationBatchResponse(response.text, batch);
            },
          },
          estimatedTokens: this.estimateBatchTokens(batchPrompt),
        });

        results.push(...result);
        console.log(`   ✅ Batch ${i + 1}/${batches.length}: ${batch.length} articles geolocated`);
      } catch (error) {
        console.error(`   ❌ Batch ${i + 1} failed:`, error.message);
        results.push(...batch.map((a) => ({ ...a, location: null })));
      }
    }

    return results;
  }

  /**
   * Batch summarize articles
   */
  async summarizeArticles(articles, options = {}) {
    const { batchSize = 2, priority = 2 } = options;

    console.log(`\n📝 SUMMARIZING ${articles.length} articles...`);

    const batches = this.chunk(articles, batchSize);
    const results = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPrompt = this.createSummaryBatchPrompt(batch);
      const promptHash = this.gemini.hashPrompt(batchPrompt);

      try {
        const result = await this.queue.add({
          promptHash,
          prompt: batchPrompt,
          priority,
          metadata: {
            type: 'summarize_batch',
            batchIndex: i,
            batchSize: batch.length,
            execute: async (prompt) => {
              const response = await this.gemini.call(prompt, { maxTokens: 600 });
              return this.parseSummaryBatchResponse(response.text, batch);
            },
          },
          estimatedTokens: this.estimateBatchTokens(batchPrompt),
        });

        results.push(...result);
        console.log(`   ✅ Batch ${i + 1}/${batches.length}: ${batch.length} articles summarized`);
      } catch (error) {
        console.error(`   ❌ Batch ${i + 1} failed:`, error.message);
        results.push(...batch.map((a) => ({ ...a, summary: a.description })));
      }
    }

    return results;
  }

  /**
   * PROMPT BUILDERS
   */

  createCategoryBatchPrompt(articles) {
    const list = articles
      .map(
        (a, idx) =>
          `${idx + 1}. "${a.title}"\n   ${a.description || ''}`
      )
      .join('\n\n');

    return `Classify these news articles into ONE category each. Categories: polityka, война/konflikt, gospodarka, nauka, zdrowie, technologia, inne.

${list}

Respond ONLY with JSON array like:
[
  {"index": 1, "category": "polityka", "confidence": 0.95},
  {"index": 2, "category": "technologia", "confidence": 0.87}
]`;
  }

  createLocationBatchPrompt(articles) {
    const list = articles
      .map(
        (a, idx) =>
          `${idx + 1}. "${a.title}"\n   ${a.description || ''}`
      )
      .join('\n\n');

    return `Extract locations from these news articles. For each, return city, region, country, latitude, longitude.

${list}

Respond ONLY with JSON array like:
[
  {"index": 1, "locations": [{"city": "Warsaw", "country": "Poland", "lat": 52.23, "lng": 21.01}]},
  {"index": 2, "locations": []}
]`;
  }

  createSummaryBatchPrompt(articles) {
    const list = articles
      .map(
        (a, idx) =>
          `${idx + 1}. TITLE: "${a.title}"\n   BODY: ${a.description || ''}`
      )
      .join('\n\n');

    return `Summarize these news articles into 2-3 sentences max (300 chars each).

${list}

Respond ONLY with JSON array like:
[
  {"index": 1, "summary": "Short summary here..."},
  {"index": 2, "summary": "Another summary..."}
]`;
  }

  /**
   * RESPONSE PARSERS
   */

  parseCategoryBatchResponse(text, articles) {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]);

      return articles.map((article, idx) => {
        const result = parsed.find((r) => r.index === idx + 1);
        return {
          ...article,
          category: result?.category || 'Inne',
          subcategory: result?.subcategory || 'Nieznane',
          categoryConfidence: result?.confidence || 0,
        };
      });
    } catch (error) {
      console.error('   ⚠️  Failed to parse category response:', error.message);
      return articles.map((a) => ({
        ...a,
        category: 'Inne',
        categoryConfidence: 0,
      }));
    }
  }

  parseLocationBatchResponse(text, articles) {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON found');

      const parsed = JSON.parse(jsonMatch[0]);

      return articles.map((article, idx) => {
        const result = parsed.find((r) => r.index === idx + 1);
        return {
          ...article,
          location: result?.locations || null,
        };
      });
    } catch (error) {
      console.error('   ⚠️  Failed to parse location response:', error.message);
      return articles.map((a) => ({ ...a, location: null }));
    }
  }

  parseSummaryBatchResponse(text, articles) {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON found');

      const parsed = JSON.parse(jsonMatch[0]);

      return articles.map((article, idx) => {
        const result = parsed.find((r) => r.index === idx + 1);
        return {
          ...article,
          summary: result?.summary || article.description,
        };
      });
    } catch (error) {
      console.error('   ⚠️  Failed to parse summary response:', error.message);
      return articles.map((a) => ({ ...a, summary: a.description }));
    }
  }

  /**
   * Token estimation for batch
   */
  estimateBatchTokens(prompt) {
    return Math.ceil(this.gemini.estimateTokens(prompt) * 1.3); // +30% safety margin
  }
}

export default BatchProcessor;
