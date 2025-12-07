// scripts/process-news-simple.js
// Simple news processing WITHOUT AI - just RSS data + basic categorization
import fs from 'fs';
import path from 'path';

function ensureDataDir(rootDir) {
  const dataDir = path.join(rootDir, 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function simpleCategory(article) {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  
  // Simple keyword matching
  if (text.match(/trump|biden|election|congress|senate|politics|president|government|minister|parliament/i)) {
    return { category: 'polityka', subcategory: 'Międzynarodowe', confidence: 0.7 };
  }
  if (text.match(/war|military|conflict|ukraine|russia|gaza|israel|syria/i)) {
    return { category: 'wojna/konflikt', subcategory: 'Konflikty zbrojne', confidence: 0.8 };
  }
  if (text.match(/economy|market|stock|trade|gdp|inflation|business|finance/i)) {
    return { category: 'gospodarka', subcategory: 'Rynki', confidence: 0.7 };
  }
  if (text.match(/science|research|study|discovery|technology|ai|computer/i)) {
    return { category: 'nauka', subcategory: 'Badania', confidence: 0.6 };
  }
  if (text.match(/health|medical|doctor|hospital|covid|disease|vaccine/i)) {
    return { category: 'zdrowie', subcategory: 'Medycyna', confidence: 0.7 };
  }
  if (text.match(/tech|software|hardware|app|digital|cyber|internet/i)) {
    return { category: 'technologia', subcategory: 'IT', confidence: 0.6 };
  }
  
  return { category: 'Inne', subcategory: 'Ogólne', confidence: 0.5 };
}

function extractSimpleLocation(article) {
  const text = `${article.title} ${article.description || ''}`;
  
  // Extract common locations
  const locations = [];
  const patterns = [
    { name: 'USA', lat: 37.09, lon: -95.71, pattern: /\b(USA|United States|America|Washington|New York)\b/i },
    { name: 'Ukraine', lat: 48.38, lon: 31.17, pattern: /\b(Ukraine|Kyiv|Kiev)\b/i },
    { name: 'Russia', lat: 55.75, lon: 37.62, pattern: /\b(Russia|Moscow|Putin)\b/i },
    { name: 'China', lat: 35.86, lon: 104.19, pattern: /\b(China|Beijing|Chinese)\b/i },
    { name: 'Israel', lat: 31.77, lon: 35.21, pattern: /\b(Israel|Jerusalem|Gaza)\b/i },
    { name: 'UK', lat: 51.51, lon: -0.13, pattern: /\b(UK|Britain|London|British)\b/i },
    { name: 'Germany', lat: 52.52, lon: 13.40, pattern: /\b(Germany|Berlin|German)\b/i },
    { name: 'France', lat: 48.86, lon: 2.35, pattern: /\b(France|Paris|French)\b/i },
    { name: 'Poland', lat: 52.23, lon: 21.01, pattern: /\b(Poland|Warsaw|Polish|Polska)\b/i },
  ];
  
  for (const loc of patterns) {
    if (loc.pattern.test(text)) {
      locations.push({ name: loc.name, lat: loc.lat, lon: loc.lon });
    }
  }
  
  return locations.length > 0 ? locations[0] : null;
}

function processArticles() {
  const rootDir = process.cwd();
  const dataDir = ensureDataDir(rootDir);
  const articlesPath = path.join(dataDir, 'articles.json');
  
  if (!fs.existsSync(articlesPath)) {
    console.error('❌ articles.json not found. Run fetch-rss.js first.');
    process.exit(1);
  }
  
  const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
  console.log(`\n📰 Processing ${articles.length} articles (WITHOUT AI)...\n`);
  
  const processed = articles.map((article, idx) => {
    const cat = simpleCategory(article);
    const loc = extractSimpleLocation(article);
    
    if ((idx + 1) % 20 === 0) {
      console.log(`   ⚙️  Processed ${idx + 1}/${articles.length} articles...`);
    }
    
    return {
      ...article,
      category: cat.category,
      subcategory: cat.subcategory,
      categoryConfidence: cat.confidence,
      location: loc,
      summary: article.description || article.title, // Use RSS description as summary
      aiEnriched: false, // Flag to indicate no AI used
      processedAt: new Date().toISOString(),
    };
  });
  
  // Save processed articles
  const outputPath = path.join(dataDir, 'articles-enriched.json');
  fs.writeFileSync(outputPath, JSON.stringify(processed, null, 2));
  console.log(`\n✅ Processed ${processed.length} articles saved to ${outputPath}`);
  
  // Stats
  const byCategory = processed.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📊 Category Distribution:');
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / processed.length) * 100).toFixed(1);
      console.log(`   ${cat}: ${count} (${pct}%)`);
    });
  
  const withLocation = processed.filter(a => a.location).length;
  console.log(`\n📍 Articles with location: ${withLocation}/${processed.length} (${((withLocation/processed.length)*100).toFixed(1)}%)`);
  
  console.log('\n✨ Processing complete (NO AI USED)!');
  console.log('   ⚡ Fast: <1 second');
  console.log('   💰 Free: No API costs');
  console.log('   🔒 Private: No external API calls\n');
}

processArticles();
