/**
 * Unified Gemini API Service
 * - Request wrapper with error handling
 * - Token counting (estimation)
 * - Request logging
 * - Caching support
 */

import crypto from 'crypto';

class GeminiService {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';
    this.model = options.model || 'gemini-2.5-flash-lite';
    
    // Token estimation (rough)
    this.avgTokensPerWord = 1.3;
    this.avgTokensPerChar = 0.25;
    
    // Request logging
    this.requestLog = [];
    this.logMaxSize = options.logMaxSize || 1000;
  }

  /**
   * Generate hash of prompt for deduplication
   */
  hashPrompt(prompt) {
    return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
  }

  /**
   * Estimate tokens in text
   * (Rough estimation: 1 token ≈ 4 chars or 1 word)
   */
  estimateTokens(text) {
    const words = text.split(/\s+/).length;
    const chars = text.length;
    // Use whichever gives higher estimate (safer)
    return Math.max(Math.ceil(words * this.avgTokensPerWord), Math.ceil(chars * this.avgTokensPerChar));
  }

  /**
   * Call Gemini API
   */
  async call(prompt, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = 500,
      timeout = 30000,
    } = options;

    const estimatedInputTokens = this.estimateTokens(prompt);
    const estimatedTotalTokens = estimatedInputTokens + maxTokens;

    if (estimatedTotalTokens > 1500) {
      throw new Error(
        `Prompt too large: ${estimatedTotalTokens} tokens (max 1500). Input: ${estimatedInputTokens}, Max output: ${maxTokens}`
      );
    }

    const requestPayload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Gemini API error ${response.status}: ${errorData.error?.message || 'Unknown error'}`
        );
      }

      const data = await response.json();

      // Extract response text
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }

      // Estimate output tokens
      const estimatedOutputTokens = this.estimateTokens(responseText);

      // Log request
      this.logRequest({
        prompt: prompt.slice(0, 100),
        promptTokens: estimatedInputTokens,
        responseTokens: estimatedOutputTokens,
        totalTokens: estimatedInputTokens + estimatedOutputTokens,
        success: true,
        timestamp: new Date().toISOString(),
      });

      return {
        text: responseText,
        tokens: {
          input: estimatedInputTokens,
          output: estimatedOutputTokens,
          total: estimatedInputTokens + estimatedOutputTokens,
        },
      };
    } catch (error) {
      // Log failure
      this.logRequest({
        prompt: prompt.slice(0, 100),
        error: error.message,
        success: false,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Call with retry logic (external use via queue)
   */
  async callWithRetry(prompt, options = {}) {
    const maxRetries = options.maxRetries || 3;
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.call(prompt, options);
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          const backoff = Math.pow(2, i) * 1000;
          console.log(
            `   🔄 Gemini retry ${i + 1}/${maxRetries} after ${backoff}ms: ${error.message}`
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    throw lastError;
  }

  /**
   * Log request for monitoring
   */
  logRequest(entry) {
    this.requestLog.push(entry);
    
    // Keep log size manageable
    if (this.requestLog.length > this.logMaxSize) {
      this.requestLog = this.requestLog.slice(-this.logMaxSize);
    }
  }

  /**
   * Get request log
   */
  getLog() {
    return this.requestLog;
  }

  /**
   * Get token usage stats from log
   */
  getStats() {
    const stats = {
      totalRequests: this.requestLog.length,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      avgTokensPerRequest: 0,
    };

    for (const entry of this.requestLog) {
      if (entry.success) {
        stats.successfulRequests++;
        stats.totalTokens += entry.totalTokens || 0;
      } else {
        stats.failedRequests++;
      }
    }

    stats.avgTokensPerRequest = stats.totalTokens / (stats.successfulRequests || 1);

    return stats;
  }

  /**
   * Print stats
   */
  printStats() {
    const stats = this.getStats();
    console.log('\n📈 GEMINI API STATS:');
    console.log(`   Requests: ${stats.totalRequests} (✅ ${stats.successfulRequests} | ❌ ${stats.failedRequests})`);
    console.log(`   Tokens: ${stats.totalTokens} total (avg: ${Math.round(stats.avgTokensPerRequest)}/req)`);
  }
}

export default GeminiService;
