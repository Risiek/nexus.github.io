/**
 * Fetch Conflict-Specific News
 * Aggregates from multiple sources focused on military conflicts
 * Runs as part of GitHub Actions pipeline
 */

import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

const parser = new Parser();

// Specialized conflict RSS feeds
const CONFLICT_FEEDS = [
  // General conflict coverage
  { name: 'Reuters World', url: 'https://www.reutersagency.com/rssFeed/worldNews' },
  { name: 'BBC World', url: 'https://feeds.bbc.co.uk/news/world/rss.xml' },
  { name: 'AP News World', url: 'https://apnews.com/apf-services/v2/rss/feeds/WorldNews.rss' },
  
  // Eastern Europe/Ukraine focused
  { name: 'Kyiv Independent', url: 'https://kyivindependent.com/feed' },
  { name: 'Radio Free Europe', url: 'https://www.rferl.org/zone/ukraine/feed' },
  
  // Middle East
  { name: 'Al Jazeera English', url: 'https://www.aljazeera.com/xml/feeds/latest/stream.xml' },
  
  // Defense/Military
  { name: 'Defense News', url: 'https://www.defensenews.com/feed/' },
  { name: 'War on the Rocks', url: 'https://warontherocks.com/feed/' },
];

// Conflict keywords to filter on
const CONFLICT_KEYWORDS = [
  'war', 'conflict', 'military', 'airstrike', 'attack', 'bombing',
  'ceasefire', 'peace talks', 'diplomacy', 'sanctions',
  'ukraine', 'russia', 'gaza', 'israel', 'hamas', 'hezbollah',
  'taiwan', 'china', 'korea', 'yemen', 'syria', 'afghanistan',
  'nato', 'missile', 'drone', 'artillery', 'battlefield',
  'casualties', 'wounded', 'refugee', 'humanitarian crisis',
  'territorial', 'occupation', 'invasion', 'defense'
];

function ensureDataDir(rootDir) {
  const dataDir = path.join(rootDir, 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function isConflictRelated(title, description) {
  const text = `${title} ${description || ''}`.toLowerCase();
  return CONFLICT_KEYWORDS.some(keyword => text.includes(keyword));
}

function normalizeArticle(feedArticle, source) {
  return {
    guid: feedArticle.guid || feedArticle.link || `${source}-${feedArticle.pubDate}`,
    title: feedArticle.title || 'Untitled',
    description: feedArticle.content || feedArticle.description || '',
    url: feedArticle.link || '',
    publishedAt: feedArticle.pubDate || new Date().toISOString(),
    source: source,
    sourceCategory: 'Konflikt',  // Pre-labeled as conflict
    category: 'konflikt',
    contentSnippet: feedArticle.contentSnippet || '',
  };
}

async function fetchConflictNews() {
  console.log('\n🔴 FETCHING CONFLICT-SPECIFIC NEWS...\n');

  const allArticles = [];
  const fetchErrors = [];

  for (const feed of CONFLICT_FEEDS) {
    try {
      console.log(`   📡 Fetching: ${feed.name}`);
      const feedData = await parser.parseURL(feed.url);
      
      let conflictCount = 0;
      for (const item of feedData.items) {
        if (isConflictRelated(item.title, item.description)) {
          const normalized = normalizeArticle(item, feed.name);
          allArticles.push(normalized);
          conflictCount++;
        }
      }
      
      console.log(`      ✅ Found ${conflictCount} conflict articles`);
    } catch (error) {
      console.error(`      ❌ Error: ${error.message}`);
      fetchErrors.push({ feed: feed.name, error: error.message });
    }
  }

  // Deduplicate by title
  const seen = new Map();
  const deduped = [];
  
  for (const article of allArticles) {
    const key = article.title.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, true);
      deduped.push(article);
    }
  }

  console.log(`\n   📊 Total: ${allArticles.length} articles → ${deduped.length} unique`);
  
  if (fetchErrors.length > 0) {
    console.log(`\n   ⚠️  ${fetchErrors.length} feed(s) failed to load`);
  }

  return deduped;
}

async function main() {
  const rootDir = process.cwd();
  const dataDir = ensureDataDir(rootDir);
  const conflictPath = path.join(dataDir, 'conflicts-raw.json');

  try {
    const conflictArticles = await fetchConflictNews();

    // Save raw conflict articles
    fs.writeFileSync(conflictPath, JSON.stringify(conflictArticles, null, 2));
    console.log(`\n✅ Conflict articles saved to ${conflictPath}`);
    
    // Statistics
    const regionCounts = {};
    conflictArticles.forEach(a => {
      // Extract region from source or title
      let region = 'Unknown';
      if (a.source.includes('Ukraine') || a.source.includes('Kyiv')) region = 'Eastern Europe';
      else if (a.source.includes('Al Jazeera') || a.source.includes('Middle East')) region = 'Middle East';
      else region = 'Global';
      
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    console.log('\n📍 By Region:');
    Object.entries(regionCounts).forEach(([region, count]) => {
      console.log(`   ${region}: ${count}`);
    });

    console.log(`\n✨ Latest ${Math.min(5, conflictArticles.length)} articles:`);
    conflictArticles.slice(0, 5).forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.title.slice(0, 60)}... (${a.source})`);
    });
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
