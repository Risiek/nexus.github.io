// scripts/enrich-news.js
// AI-powered news enrichment using Gemini 2.5 Flash-Lite
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const CATEGORIES = [
  'polityka',
  'wojna / konflikty',
  'kryzysy',
  'nauka',
  'gospodarka',
  'zdrowie',
  'globalne incydenty',
  'bezpieczeństwo cyfrowe',
  'katastrofy naturalne',
  'inne'
];

function ensureDataDir(rootDir) {
  const dataDir = path.join(rootDir, 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    return null;
  }

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!resp.ok) {
      console.error(`Gemini API error: ${resp.status}`);
      return null;
    }

    const json = await resp.json();
    if (json.candidates && json.candidates[0]) {
      return json.candidates[0].content.parts[0].text;
    }
  } catch (err) {
    console.error('Gemini request failed:', err.message);
  }
  return null;
}

async function enrichArticle(article) {
  const { title, description } = article;
  const text = `${title}. ${description || ''}`.slice(0, 500);

  // 1. Kategoria
  const categoryPrompt = `Classify this news into ONE category only. Categories: ${CATEGORIES.join(', ')}. News: "${text}". Answer ONLY with category name, nothing else.`;
  const category = await callGemini(categoryPrompt);

  // 2. Geokodowanie (miasto, region, kraj)
  const geoPrompt = `Extract location from this news. Return JSON with: {city, region, country, lat, lon}. If no specific location, return empty. News: "${text}". Answer ONLY with valid JSON, nothing else.`;
  const geoRaw = await callGemini(geoPrompt);
  let location = null;
  if (geoRaw) {
    try {
      location = JSON.parse(geoRaw);
    } catch {
      location = null;
    }
  }

  // 3. Priority (1-5, where 5 is most important)
  const priorityPrompt = `Rate importance of this news on scale 1-5 (1=local, 5=critical global event). Consider: tone, keywords, topic. News: "${text}". Answer ONLY with number 1-5.`;
  const priorityRaw = await callGemini(priorityPrompt);
  const priority = priorityRaw ? parseInt(priorityRaw, 10) : 3;

  // 4. Keywords
  const keywordsPrompt = `Extract 3-5 key words from this news as JSON array. News: "${text}". Answer ONLY with JSON array like ["word1", "word2"], nothing else.`;
  const keywordsRaw = await callGemini(keywordsPrompt);
  let keywords = [];
  if (keywordsRaw) {
    try {
      keywords = JSON.parse(keywordsRaw);
    } catch {
      keywords = [];
    }
  }

  return {
    ...article,
    category: (category || 'inne').trim(),
    location,
    priority: Math.max(1, Math.min(5, priority)),
    keywords: Array.isArray(keywords) ? keywords : [],
    enriched_at: new Date().toISOString(),
  };
}

async function deduplicateArticles(articles) {
  // Simple deduplication: group by normalized title + source
  const seen = new Map();
  const deduped = [];

  for (const article of articles) {
    const key = `${article.title.toLowerCase().slice(0, 50)}|${article.source}`;
    if (!seen.has(key)) {
      seen.set(key, article);
      deduped.push(article);
    }
  }

  return deduped;
}

async function main() {
  const rootDir = process.cwd();
  const dataDir = ensureDataDir(rootDir);
  const articlesPath = path.join(dataDir, 'articles.json');
  const enrichedPath = path.join(dataDir, 'articles-enriched.json');

  if (!fs.existsSync(articlesPath)) {
    console.error(`Articles file not found: ${articlesPath}`);
    process.exit(1);
  }

  const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
  console.log(`📰 Enriching ${articles.length} articles with AI...\n`);

  // Deduplicate first
  const deduped = await deduplicateArticles(articles);
  if (deduped.length < articles.length) {
    console.log(`   🗑️  Removed ${articles.length - deduped.length} duplicates`);
  }

  // Enrich each article
  const enriched = [];
  for (let i = 0; i < deduped.length; i++) {
    const article = deduped[i];
    const enriched_article = await enrichArticle(article);
    enriched.push(enriched_article);

    if ((i + 1) % 5 === 0) {
      console.log(`   ✓ Enriched ${i + 1}/${deduped.length}`);
    }
  }

  // Save enriched articles
  fs.writeFileSync(enrichedPath, JSON.stringify(enriched, null, 2));
  console.log(`\n✅ Enriched articles saved to ${enrichedPath}`);

  // Statistics
  const categoryCounts = enriched.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Category distribution:');
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });

  const avgPriority = (enriched.reduce((sum, a) => sum + a.priority, 0) / enriched.length).toFixed(1);
  console.log(`\n📈 Average priority: ${avgPriority}`);
}

main().catch((err) => {
  console.error('❌ Enrichment failed:', err.message);
  process.exit(1);
});
