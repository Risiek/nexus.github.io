// scripts/fetch-rss.js
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';

const parser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'thumbnail'],
      ['media:content', 'mediaContent'],
      ['geo:lat', 'geoLat'],
      ['geo:long', 'geoLong']
    ]
  }
});

// RSS Feeds do śledzenia
const RSS_FEEDS = [
  { url: 'https://wiadomosci.onet.pl/.feed', name: 'Onet', category: 'News' },
  { url: 'https://tvn24.pl/najnowsze.xml', name: 'TVN24', category: 'News' },
  { url: 'https://www.chip.pl/feed', name: 'Chip', category: 'Tech' },
  { url: 'https://gs24.pl/rss', name: 'GS24', category: 'Local' },
  { url: 'https://niebezpiecznik.pl/feed/', name: 'Niebezpiecznik', category: 'Security' },
];

async function fetchAllFeeds() {
  const allArticles = [];
  
  console.log(`📰 Fetching ${RSS_FEEDS.length} RSS feeds...\n`);
  
  for (const feed of RSS_FEEDS) {
    try {
      console.log(`⏳ Fetching ${feed.name}...`);
      
      const data = await parser.parseURL(feed.url);
      
      const articles = data.items.map(item => ({
        guid: item.guid || item.link,
        title: item.title?.trim() || 'No title',
        description: (item.contentSnippet || item.summary || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 300),
        url: item.link,
        publishedAt: new Date(item.pubDate || item.isoDate || Date.now()).toISOString(),
        source: feed.name,
        sourceCategory: feed.category,
        thumbnail: item.thumbnail?.url || item.enclosure?.url || null,
        categories: item.categories || []
      }));
      
      allArticles.push(...articles);
      console.log(`   ✓ ${articles.length} articles from ${feed.name}`);
      
      // Be nice to servers
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error) {
      console.error(`   ✗ Error fetching ${feed.name}:`, error.message);
    }
  }
  
  // Remove duplicates by guid
  const uniqueArticles = Array.from(
    new Map(allArticles.map(a => [a.guid, a])).values()
  );
  
  console.log(`\n📊 Statistics:`);
  console.log(`   Total fetched: ${allArticles.length}`);
  console.log(`   Unique: ${uniqueArticles.length}`);
  console.log(`   Duplicates removed: ${allArticles.length - uniqueArticles.length}`);
  
  // Ensure public/data directory exists
  const dataDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Save to JSON (canonical file for build step)
  const outputPath = path.join(dataDir, 'articles.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueArticles, null, 2));
  
  console.log(`\n✅ Saved ${uniqueArticles.length} articles to ${outputPath}`);
  
  return uniqueArticles;
}

// Run
fetchAllFeeds()
  .then(() => {
    console.log('\n🎉 RSS fetch completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });