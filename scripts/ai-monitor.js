#!/usr/bin/env node

/**
 * AI Usage Monitor
 * Tracks token usage, API costs, and queue performance
 * Run: node scripts/ai-monitor.js
 */

import fs from 'fs';
import path from 'path';

const GEMINI_PRICING = {
  input: 0.00001, // $ per 1000 tokens
  output: 0.00004, // $ per 1000 tokens
};

function loadLogFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function getEstimatedCosts(tokenLog) {
  if (!tokenLog || !Array.isArray(tokenLog)) return null;

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const entry of tokenLog) {
    if (entry.success) {
      totalInputTokens += entry.tokenInfo?.input || 0;
      totalOutputTokens += entry.tokenInfo?.output || 0;
    }
  }

  const inputCost = (totalInputTokens / 1000) * GEMINI_PRICING.input;
  const outputCost = (totalOutputTokens / 1000) * GEMINI_PRICING.output;

  return {
    totalInputTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

function formatCurrency(amount) {
  return `$${amount.toFixed(4)}`;
}

function printStatus() {
  const rootDir = process.cwd();
  const dataDir = path.join(rootDir, 'public', 'data');

  console.log('\n' + '═'.repeat(60));
  console.log('  🤖 AI USAGE MONITOR - NEXUS');
  console.log('═'.repeat(60));

  // Check enriched articles
  const enrichedPath = path.join(dataDir, 'articles-enriched.json');
  if (fs.existsSync(enrichedPath)) {
    const enriched = JSON.parse(fs.readFileSync(enrichedPath, 'utf-8'));
    console.log(`\n📊 ENRICHED ARTICLES: ${enriched.length}`);

    // Category breakdown
    const categories = {};
    enriched.forEach((a) => {
      categories[a.category] = (categories[a.category] || 0) + 1;
    });

    console.log('\n   📑 Categories:');
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([cat, count]) => {
        console.log(`      ${cat}: ${count}`);
      });
  }

  // Queue limits
  console.log('\n💾 DAILY LIMITS:');
  console.log(`   Requests: 900/day (15 RPM)`);
  console.log(`   Tokens: 250,000/day`);
  console.log(`   Cost: ~$2.50/day (estimated)`);

  // Gemini Flash-Lite pricing
  console.log('\n💰 GEMINI 2.5 FLASH-LITE PRICING:');
  console.log(`   Input: ${formatCurrency(GEMINI_PRICING.input)} / 1000 tokens`);
  console.log(`   Output: ${formatCurrency(GEMINI_PRICING.output)} / 1000 tokens`);
  console.log(`   Free tier: 1500 requests/day (10,500/week)`);

  // Quick calculation
  console.log('\n📈 QUICK COST ESTIMATES:');
  const scenarios = [
    { name: '100 articles (2 AI calls each)', requests: 100, tokensPerRequest: 1000 },
    { name: '300 articles (batch)', requests: 30, tokensPerRequest: 1500 },
    { name: '1000 articles (batch)', requests: 100, tokensPerRequest: 1500 },
  ];

  scenarios.forEach(({ name, requests, tokensPerRequest }) => {
    const inputCost = (requests * tokensPerRequest * GEMINI_PRICING.input) / 1000;
    const outputCost = (requests * tokensPerRequest * GEMINI_PRICING.output) / 1000;
    const total = inputCost + outputCost;
    console.log(`   ${name}: ${formatCurrency(total)}`);
  });

  console.log('\n' + '═'.repeat(60));
  console.log('  💡 Pro Tips:');
  console.log('  • Use batch processing to reduce API calls');
  console.log('  • Deduplicate before enrichment');
  console.log('  • Set GEMINI_API_KEY in .env.local');
  console.log('═'.repeat(60) + '\n');
}

printStatus();
