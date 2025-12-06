/**
 * Enrich Conflict Articles with AI Analysis
 * Uses Gemini 2.5 Flash-Lite to extract:
 * - Conflict regions
 * - Event types
 * - Actors involved
 * - Tension scores
 */

import fs from 'fs';
import path from 'path';
import AIQueue from '../lib/ai-queue.js';
import GeminiService from '../lib/gemini-service.js';
import BatchProcessor from '../lib/batch-processor.js';
import ConflictAnalyzer from '../lib/conflict-analyzer.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function ensureDataDir(rootDir) {
  const dataDir = path.join(rootDir, 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not set');
    process.exit(1);
  }

  const rootDir = process.cwd();
  const dataDir = ensureDataDir(rootDir);
  const conflictRawPath = path.join(dataDir, 'conflicts-raw.json');
  const conflictEnrichedPath = path.join(dataDir, 'conflicts-enriched.json');
  const conflictSummaryPath = path.join(dataDir, 'conflicts-summary.json');

  if (!fs.existsSync(conflictRawPath)) {
    console.error(`❌ Conflicts file not found: ${conflictRawPath}`);
    console.log('   Run: npm run fetch:conflicts');
    process.exit(1);
  }

  // Load raw conflict articles
  const rawConflicts = JSON.parse(fs.readFileSync(conflictRawPath, 'utf-8'));
  console.log(`\n📰 Enriching ${rawConflicts.length} conflict articles with AI...\n`);

  // Initialize AI systems
  const aiQueue = new AIQueue({
    maxRPM: 15,
    maxRPD: 900,
    maxTokensPerDay: 250000,
  });

  const geminiService = new GeminiService(GEMINI_API_KEY);
  const batchProcessor = new BatchProcessor(geminiService, aiQueue);
  const conflictAnalyzer = new ConflictAnalyzer(geminiService, aiQueue, batchProcessor);

  try {
    // Analyze conflicts with AI
    console.log('🔍 ANALYZING CONFLICTS WITH AI...\n');
    const enrichedConflicts = await conflictAnalyzer.analyzeConflicts(rawConflicts, {
      batchSize: 5,
      priority: 1, // Conflicts are high priority
    });

    // Save enriched articles
    fs.writeFileSync(conflictEnrichedPath, JSON.stringify(enrichedConflicts, null, 2));
    console.log(`\n✅ Enriched articles saved to ${conflictEnrichedPath}`);

    // Generate summary
    console.log('\n📊 GENERATING CONFLICT SUMMARY...\n');
    const topConflicts = conflictAnalyzer.getTopConflicts(enrichedConflicts, 5);

    const summary = {
      generated_at: new Date().toISOString(),
      total_articles: enrichedConflicts.length,
      total_regions: new Set(enrichedConflicts.map((a) => a.conflict_region)).size,
      top_conflicts: topConflicts.map((conflict) => ({
        region: conflict.region,
        conflict_name: conflict.conflict_name,
        tension_level: conflict.tension_level,
        tension_score: conflict.tension_score,
        trend: conflict.trend,
        article_count: conflict.article_count,
        latest_headline: conflict.latest_headline,
        latest_time: conflict.latest_time,
        color: conflictAnalyzer.getTensionColor(conflict.tension_score),
      })),
    };

    fs.writeFileSync(conflictSummaryPath, JSON.stringify(summary, null, 2));
    console.log(`✅ Summary saved to ${conflictSummaryPath}`);

    // Print results
    console.log('\n' + '='.repeat(60));
    console.log('📋 CONFLICT MONITOR SUMMARY');
    console.log('='.repeat(60));

    summary.top_conflicts.forEach((conflict, i) => {
      const trendIcon = conflict.trend === 'escalating' ? '📈' : conflict.trend === 'de-escalating' ? '📉' : '→';
      console.log(`\n${i + 1}. ${conflict.region}`);
      console.log(`   Conflict: ${conflict.conflict_name}`);
      console.log(`   Tension: ${conflict.tension_level} (${conflict.tension_score}/10) ${trendIcon}`);
      console.log(`   Articles: ${conflict.article_count}`);
      console.log(`   Latest: ${conflict.latest_headline?.slice(0, 70)}...`);
    });

    console.log('\n' + '='.repeat(60));
    aiQueue.printStatus();
    console.log('\n' + '='.repeat(60));
    geminiService.printStats();
    console.log('\n✨ Conflict enrichment complete!');
  } catch (error) {
    console.error('\n❌ Enrichment failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
