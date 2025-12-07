// scripts/process-conflicts-simple.js
// Simple conflict processing WITHOUT AI - just RSS data
import fs from 'fs';
import path from 'path';

function ensureDataDir(rootDir) {
  const dataDir = path.join(rootDir, 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function estimateTension(article) {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  
  // Simple tension scoring based on keywords
  let score = 3; // Base: Low tension
  
  if (text.match(/war|attack|killed|bombing|strike|invasion|military operation/i)) score += 5;
  if (text.match(/critical|escalat|crisis|urgent|emergency|threat/i)) score += 3;
  if (text.match(/peace|negotiation|talk|agreement|ceasefire|diplomacy/i)) score -= 2;
  if (text.match(/nuclear|chemical|biological/i)) score += 4;
  if (text.match(/civilian casualties|humanitarian|refugee/i)) score += 2;
  
  return Math.min(10, Math.max(1, score)); // Clamp 1-10
}

function detectRegion(article) {
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  
  if (text.match(/ukraine|russia|moscow|kyiv|donbas|crimea/i)) {
    return { name: 'Eastern Europe', lat: 48.38, lon: 31.17, country: 'Ukraine' };
  }
  if (text.match(/gaza|israel|palestine|hamas|west bank/i)) {
    return { name: 'Middle East', lat: 31.50, lon: 34.47, country: 'Israel/Palestine' };
  }
  if (text.match(/syria|damascus|aleppo|idlib/i)) {
    return { name: 'Middle East', lat: 34.80, lon: 38.99, country: 'Syria' };
  }
  if (text.match(/yemen|houthi|sana'a/i)) {
    return { name: 'Middle East', lat: 15.55, lon: 48.52, country: 'Yemen' };
  }
  if (text.match(/taiwan|china|south china sea/i)) {
    return { name: 'East Asia', lat: 25.03, lon: 121.56, country: 'Taiwan/China' };
  }
  if (text.match(/north korea|south korea|dmz/i)) {
    return { name: 'East Asia', lat: 37.57, lon: 126.98, country: 'Korea' };
  }
  if (text.match(/afghanistan|kabul|taliban/i)) {
    return { name: 'Central Asia', lat: 34.53, lon: 69.17, country: 'Afghanistan' };
  }
  if (text.match(/sudan|khartoum|darfur/i)) {
    return { name: 'Africa', lat: 15.50, lon: 32.56, country: 'Sudan' };
  }
  if (text.match(/ethiopia|tigray|addis ababa/i)) {
    return { name: 'Africa', lat: 9.03, lon: 38.74, country: 'Ethiopia' };
  }
  if (text.match(/myanmar|burma|rohingya/i)) {
    return { name: 'Southeast Asia', lat: 16.87, lon: 96.20, country: 'Myanmar' };
  }
  
  return { name: 'Global', lat: 0, lon: 0, country: 'Multiple' };
}

function processConflicts() {
  const rootDir = process.cwd();
  const dataDir = ensureDataDir(rootDir);
  const rawPath = path.join(dataDir, 'conflicts-raw.json');
  
  if (!fs.existsSync(rawPath)) {
    console.error('❌ conflicts-raw.json not found. Run fetch-conflicts.js first.');
    process.exit(1);
  }
  
  const conflicts = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  console.log(`\n⚔️  Processing ${conflicts.length} conflict articles (WITHOUT AI)...\n`);
  
  // Process enriched conflicts
  const enriched = conflicts.map((article, idx) => {
    const region = detectRegion(article);
    const tension = estimateTension(article);
    
    if ((idx + 1) % 10 === 0) {
      console.log(`   ⚙️  Processed ${idx + 1}/${conflicts.length} conflicts...`);
    }
    
    return {
      ...article,
      region: region.name,
      location: {
        lat: region.lat,
        lon: region.lon,
        name: region.country,
      },
      tension: tension,
      summary: article.description || article.title,
      aiEnriched: false,
      processedAt: new Date().toISOString(),
    };
  });
  
  // Group by region for summary
  const byRegion = enriched.reduce((acc, conflict) => {
    const region = conflict.region;
    if (!acc[region]) {
      acc[region] = {
        region,
        conflicts: [],
        avgTension: 0,
        articleCount: 0,
      };
    }
    acc[region].conflicts.push(conflict);
    acc[region].articleCount++;
    return acc;
  }, {});
  
  // Calculate average tension per region
  const summary = Object.values(byRegion).map(regionData => {
    const tensions = regionData.conflicts.map(c => c.tension);
    const avgTension = tensions.reduce((sum, t) => sum + t, 0) / tensions.length;
    
    // Get most recent article for each region
    const latest = regionData.conflicts.sort((a, b) => 
      new Date(b.publishedAt) - new Date(a.publishedAt)
    )[0];
    
    return {
      region: regionData.region,
      tension: Math.round(avgTension * 10) / 10,
      articleCount: regionData.articleCount,
      latestUpdate: latest.publishedAt,
      location: latest.location,
      headline: latest.title,
      description: latest.summary,
    };
  }).sort((a, b) => b.tension - a.tension); // Highest tension first
  
  // Save files
  const enrichedPath = path.join(dataDir, 'conflicts-enriched.json');
  const summaryPath = path.join(dataDir, 'conflicts-summary.json');
  
  fs.writeFileSync(enrichedPath, JSON.stringify(enriched, null, 2));
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log(`\n✅ Processed conflicts saved:`);
  console.log(`   📄 ${enrichedPath}`);
  console.log(`   📄 ${summaryPath}`);
  
  // Stats
  console.log(`\n📊 Conflict Statistics:`);
  console.log(`   Total articles: ${enriched.length}`);
  console.log(`   Regions: ${summary.length}`);
  
  console.log('\n🌍 By Region:');
  summary.forEach(r => {
    const emoji = r.tension >= 8 ? '🔴' : r.tension >= 6 ? '🟠' : r.tension >= 4 ? '🟡' : '🟢';
    console.log(`   ${emoji} ${r.region}: ${r.articleCount} articles, tension ${r.tension}/10`);
  });
  
  console.log('\n✨ Processing complete (NO AI USED)!');
  console.log('   ⚡ Fast: <1 second');
  console.log('   💰 Free: No API costs');
  console.log('   🔒 Private: No external API calls\n');
}

processConflicts();
