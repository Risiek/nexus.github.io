/**
 * AI Request Queue Manager
 * - Rate limiting (15 RPM max)
 * - Priority queue (1-3, higher = first)
 * - Daily token budget tracking
 * - Exponential backoff on errors
 * - Request deduplication
 */

class AIQueue {
  constructor(options = {}) {
    // Rate limiting (free tier: 20 req/min hard limit)
    // Using 10 RPM to stay safely under quota
    this.maxRequestsPerMinute = options.maxRPM || 10;
    this.maxRequestsPerDay = options.maxRPD || 600;
    this.requestDelay = (60 * 1000) / this.maxRequestsPerMinute; // ~6000ms for 10 RPM

    // Token budget
    this.maxTokensPerDay = options.maxTokensPerDay || 250000;
    this.maxTokensPerRequest = options.maxTokensPerRequest || 1500;

    // Queue state
    this.queue = [];
    this.processing = false;
    this.requestCount = 0;
    this.tokenUsage = 0;
    this.lastRequestTime = 0;

    // Daily reset (at midnight UTC)
    this.dailyResetTime = this.getNextMidnight();
    this.scheduleReset();

    // Stats
    this.stats = {
      processed: 0,
      failed: 0,
      retried: 0,
      totalTokens: 0,
      byPriority: { 1: 0, 2: 0, 3: 0 },
    };

    // Request dedup cache (5 min TTL)
    this.dedupCache = new Map();
    this.setInterval(() => this.dedupCache.clear(), 5 * 60 * 1000);
  }

  /**
   * Add request to queue
   * @param {Object} request - { promptHash, prompt, priority, onSuccess, onError, metadata }
   * @returns {Promise} Result of the request
   */
  async add(request) {
    const {
      promptHash,
      prompt,
      priority = 2,
      onSuccess,
      onError,
      metadata = {},
      estimatedTokens = 500,
    } = request;

    // Validate priority
    if (priority < 1 || priority > 3) {
      throw new Error('Priority must be 1-3');
    }

    // Check daily limits BEFORE adding
    if (this.requestCount >= this.maxRequestsPerDay) {
      const err = new Error('Daily request limit reached (900)');
      if (onError) onError(err);
      throw err;
    }

    if (this.tokenUsage + estimatedTokens > this.maxTokensPerDay) {
      const err = new Error(
        `Token budget exceeded. Used: ${this.tokenUsage}, Need: ${estimatedTokens}, Max: ${this.maxTokensPerDay}`
      );
      if (onError) onError(err);
      throw err;
    }

    // Check dedup cache (same prompt = don't queue again)
    if (promptHash && this.dedupCache.has(promptHash)) {
      console.log(`   ⚡ Cache hit: ${promptHash}`);
      const cached = this.dedupCache.get(promptHash);
      if (onSuccess) onSuccess(cached);
      return cached;
    }

    // Create queue item
    const item = {
      id: `${Date.now()}_${Math.random()}`,
      promptHash,
      prompt,
      priority,
      onSuccess,
      onError,
      metadata,
      estimatedTokens,
      retries: 0,
      maxRetries: 3,
      backoffMs: 1000,
    };

    // Insert by priority (higher = lower index)
    const insertIndex = this.queue.findIndex((q) => q.priority < priority);
    if (insertIndex === -1) {
      this.queue.push(item);
    } else {
      this.queue.splice(insertIndex, 0, item);
    }

    console.log(
      `   📋 Queued [P${priority}]: ${metadata.type || 'request'} (${this.queue.length} in queue)`
    );

    // Start processing if not already
    if (!this.processing) {
      this.processNext();
    }

    // Return promise that resolves when item is processed
    return new Promise((resolve, reject) => {
      item.resolve = resolve;
      item.reject = reject;
    });
  }

  /**
   * Process next item in queue
   */
  async processNext() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const item = this.queue.shift();

    try {
      // Rate limiting: wait until enough time has passed
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.requestDelay) {
        const delayNeeded = this.requestDelay - timeSinceLastRequest;
        console.log(`   ⏳ Rate limit: waiting ${Math.round(delayNeeded)}ms...`);
        await this.sleep(delayNeeded);
      }

      this.lastRequestTime = Date.now();

      // Execute the actual request (via provided function)
      const result = await item.metadata.execute(item.prompt);

      // Track usage
      this.requestCount++;
      this.tokenUsage += item.estimatedTokens;
      this.stats.processed++;
      this.stats.byPriority[item.priority]++;

      // Cache result if hash provided
      if (item.promptHash) {
        this.dedupCache.set(item.promptHash, result);
      }

      // Callback
      if (item.onSuccess) {
        item.onSuccess(result);
      }
      if (item.resolve) {
        item.resolve(result);
      }

      console.log(
        `   ✅ Processed [P${item.priority}]: ${item.metadata.type} | Tokens: ${this.tokenUsage}/${this.maxTokensPerDay}`
      );
    } catch (error) {
      // Retry logic with exponential backoff
      if (item.retries < item.maxRetries) {
        item.retries++;
        const backoff = item.backoffMs * Math.pow(2, item.retries - 1);
        console.log(
          `   🔄 Retry ${item.retries}/${item.maxRetries} after ${backoff}ms: ${error.message}`
        );

        this.stats.retried++;

        // Re-queue with delay
        await this.sleep(backoff);
        this.queue.unshift(item);
      } else {
        // Max retries exceeded
        this.stats.failed++;
        console.error(`   ❌ FAILED after ${item.maxRetries} retries: ${error.message}`);

        if (item.onError) {
          item.onError(error);
        }
        if (item.reject) {
          item.reject(error);
        }
      }
    }

    // Process next
    setImmediate(() => this.processNext());
  }

  /**
   * Batch add multiple requests
   */
  async addBatch(requests) {
    const promises = requests.map((req) => this.add(req));
    return Promise.all(promises);
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      requestsToday: this.requestCount,
      tokensUsed: this.tokenUsage,
      tokensRemaining: this.maxTokensPerDay - this.tokenUsage,
      requestsRemaining: this.maxRequestsPerDay - this.requestCount,
      dailyResetIn: this.getTimeUntilReset(),
      stats: this.stats,
    };
  }

  /**
   * Print status to console
   */
  printStatus() {
    const status = this.getStatus();
    console.log('\n📊 AI QUEUE STATUS:');
    console.log(`   Queue: ${status.queueLength} items`);
    console.log(
      `   Requests: ${status.requestsToday}/${this.maxRequestsPerDay} (${status.requestsRemaining} left)`
    );
    console.log(
      `   Tokens: ${status.tokensUsed}/${this.maxTokensPerDay} (${status.tokensRemaining} left)`
    );
    console.log(`   Reset: ${status.dailyResetIn}`);
    console.log(`   Stats: ${JSON.stringify(status.stats, null, 2)}`);
  }

  /**
   * Reset daily counters
   */
  reset() {
    this.requestCount = 0;
    this.tokenUsage = 0;
    this.dailyResetTime = this.getNextMidnight();
    this.scheduleReset();
    console.log('🔄 Daily AI queue counters reset');
  }

  /**
   * Utility: Sleep helper
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Utility: Get next midnight UTC
   */
  getNextMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Utility: Get time until next reset
   */
  getTimeUntilReset() {
    const diff = this.dailyResetTime - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  }

  /**
   * Schedule daily reset
   */
  scheduleReset() {
    const now = Date.now();
    const resetTime = this.dailyResetTime.getTime();
    const delay = resetTime - now;

    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }

    this.resetTimeout = setTimeout(() => {
      this.reset();
    }, delay);
  }

  /**
   * Set interval (polyfill for Node.js)
   */
  setInterval(fn, ms) {
    const intervalId = setInterval(fn, ms);
    return intervalId;
  }
}

export default AIQueue;
