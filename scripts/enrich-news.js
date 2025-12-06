// scripts/enrich-news.js
// AI-powered news enrichment using Gemini 2.5 Flash-Lite + Intelligent Queue System
import fs from 'fs';
import path from 'path';
import AIQueue from '../lib/ai-queue.js';
import GeminiService from '../lib/gemini-service.js';
import BatchProcessor from '../lib/batch-processor.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function ensureDataDir(rootDir) {
  const dataDir = path.join(rootDir, 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function deduplicateArticles(articles) {
  // Simple deduplication: group by normalized title
  const seen = new Map();
  const deduped = [];

  for (const article of articles) {
    const key = `${article.title.toLowerCase()}|${article.source}`;
    if (!seen.has(key)) {
      seen.set(key, article);
      deduped.push(article);
    }
  }

  return deduped;
}

function assignPriority(article) {
  // Rule-based priority assignment (before AI)
  const now = Date.now();
  const pubTime = new Date(article.publishedAt).getTime();
  const hoursOld = (now - pubTime) / (1000 * 60 * 60);

  if (hoursOld < 0.17) {
    // <10 min = Priority 1 (breaking)
    return 1;
  } else if (hoursOld < 24) {
    // <24h = Priority 2
    return 2;
  } else {
    // >24h = Priority 3
    return 3;
  }
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not set. Set it in environment variables.');
    process.exit(1);
  }

  const rootDir = process.cwd();
  const dataDir = ensureDataDir(rootDir);
  const articlesPath = path.join(dataDir, 'articles.json');
  const enrichedPath = path.join(dataDir, 'articles-enriched.json');

  if (!fs.existsSync(articlesPath)) {
    console.error(`❌ Articles file not found: ${articlesPath}`);
    process.exit(1);
  }

  // Load articles
  const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
  console.log(`\n📰 Enriching ${articles.length} articles with AI Queue System...\n`);

  // Deduplicate
  const deduped = deduplicateArticles(articles);
  console.log(`   🗑️  Deduped: ${articles.length} → ${deduped.length} articles\n`);

  // Initialize AI systems
  const aiQueue = new AIQueue({
    maxRPM: 15,
    maxRPD: 900,
    maxTokensPerDay: 250000,
  });

  const geminiService = new GeminiService(GEMINI_API_KEY);
  const batchProcessor = new BatchProcessor(geminiService, aiQueue);

  // Sort by priority (breaking news first)
  const byPriority = {
    1: deduped.filter((a) => assignPriority(a) === 1),
    2: deduped.filter((a) => assignPriority(a) === 2),
    3: deduped.filter((a) => assignPriority(a) === 3),
  };

  console.log(`   📊 By priority: P1=${byPriority[1].length}, P2=${byPriority[2].length}, P3=${byPriority[3].length}\n`);

  const enriched = [];

  // Process by priority (breaking news first)
  for (const priority of [1, 2, 3]) {
    const articlesToProcess = byPriority[priority];
    if (articlesToProcess.length === 0) continue;

    console.log(`\n🚀 PRIORITY ${priority} (${articlesToProcess.length} articles):\n`);

    // Step 1: Categorize
    const categorized = await batchProcessor.categorizeArticles(articlesToProcess, {
      batchSize: priority === 1 ? 5 : 10, // Smaller batches for breaking news
      priority,
    });

    // Step 2: Extract locations
    const withLocations = await batchProcessor.extractLocations(categorized, {
      batchSize: priority === 1 ? 5 : 10,
      priority,
    });

    // Step 3: Summarize
    const withSummaries = await batchProcessor.summarizeArticles(withLocations, {
      batchSize: priority === 1 ? 3 : 5,
      priority,
    });

    // Add enrichment metadata
    const enrichedBatch = withSummaries.map((article) => ({
      ...article,
      priority: priority * 2, // Convert to 2-6 scale for importance
      enriched_at: new Date().toISOString(),
    }));

    enriched.push(...enrichedBatch);
  }

  // Save enriched articles
  fs.writeFileSync(enrichedPath, JSON.stringify(enriched, null, 2));
  console.log(`\n✅ Enriched articles saved to ${enrichedPath}`);

  // Print statistics
  console.log('\n' + '='.repeat(50));
  aiQueue.printStatus();
  console.log('\n' + '='.repeat(50));
  geminiService.printStats();
  console.log('\n' + '='.repeat(50));

  // Category distribution
  const categoryCounts = enriched.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Category Distribution:');
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const percentage = ((count / enriched.length) * 100).toFixed(1);
      console.log(`   ${cat}: ${count} (${percentage}%)`);
    });

  console.log('\n✨ Enrichment complete!');
}

main().catch((err) => {
  console.error('\n❌ Enrichment failed:', err.message);
  console.error(err);
  process.exit(1);
});
