// scripts/build-database.js
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

function loadArticles(dataDir) {
  // Try enriched articles first (from enrich-news.js), fallback to raw
  const enrichedPath = path.join(dataDir, 'articles-enriched.json');
  const primaryPath = path.join(dataDir, 'articles.json');
  const fallbackPath = path.join(dataDir, 'articles-raw.json');
  
  let filePath = primaryPath;
  if (fs.existsSync(enrichedPath)) {
    filePath = enrichedPath;
    console.log('   📊 Using enriched articles');
  } else if (!fs.existsSync(filePath)) {
    filePath = fallbackPath;
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Articles file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const articles = JSON.parse(raw);

  if (!Array.isArray(articles) || articles.length === 0) {
    throw new Error('Articles list is empty.');
  }

  return articles;
}

function ensureDataDir(rootDir) {
  const dataDir = path.join(rootDir, 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function deriveCategory(article) {
  return (
    article.category ||
    article.sourceCategory ||
    (Array.isArray(article.categories) && article.categories[0]) ||
    'Uncategorized'
  );
}

function buildDatabase(articles, dbPath) {
  const db = new Database(dbPath);

  // Pragmas for smaller file + concurrency
  db.pragma('page_size = 1024');
  db.pragma('journal_mode = WAL');

  db.exec(`
    DROP TABLE IF EXISTS articles;
    DROP TABLE IF EXISTS market_data;
    DROP TABLE IF EXISTS articles_fts;

    CREATE TABLE articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guid TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      published_at DATETIME NOT NULL,
      source TEXT NOT NULL,
      source_category TEXT,
      category TEXT,
      thumbnail TEXT,
      priority INTEGER DEFAULT 3,
      keywords TEXT,
      location TEXT,
      enriched_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_articles_published ON articles(published_at DESC);
    CREATE INDEX idx_articles_source ON articles(source);
    CREATE INDEX idx_articles_category ON articles(category);
    CREATE INDEX idx_articles_priority ON articles(priority DESC);

    CREATE VIRTUAL TABLE articles_fts USING fts5(
      title,
      description,
      keywords,
      content='articles',
      content_rowid='id'
    );

    CREATE TABLE market_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      symbol TEXT NOT NULL,
      name TEXT,
      price REAL,
      change_percent REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, symbol)
    );
  `);

  const insertArticle = db.prepare(`
    INSERT OR IGNORE INTO articles
    (guid, title, description, url, published_at, source, source_category, category, thumbnail, priority, keywords, location, enriched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const article of items) {
      const publishedAt = article.publishedAt || article.published_at;
      if (!publishedAt) continue;

      insertArticle.run(
        article.guid,
        article.title || 'No title',
        article.description || '',
        article.url,
        publishedAt,
        article.source,
        article.sourceCategory || null,
        deriveCategory(article),
        article.thumbnail || null,
        article.priority || 3,
        Array.isArray(article.keywords) ? JSON.stringify(article.keywords) : null,
        article.location ? JSON.stringify(article.location) : null,
        article.enriched_at || null
      );
    }
  });

  insertMany(articles);

  db.exec(`
    INSERT INTO articles_fts(rowid, title, description, keywords)
    SELECT id, title, description, keywords FROM articles;
  `);

  db.pragma('optimize');
  db.exec('VACUUM');

  const stats = db.prepare('SELECT COUNT(*) AS count FROM articles').get();
  db.close();
  return stats.count;
}

function writeMetadata(dataDir, count) {
  const metaPath = path.join(dataDir, 'last-update.json');
  fs.writeFileSync(metaPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    articlesCount: count
  }));
}

async function main() {
  const rootDir = process.cwd();
  const dataDir = ensureDataDir(rootDir);
  const articles = loadArticles(dataDir);
  const dbPath = path.join(dataDir, 'news.db');

  const count = buildDatabase(articles, dbPath);
  writeMetadata(dataDir, count);

  console.log(`✅ Database built at ${dbPath} with ${count} articles`);
}

main().catch((err) => {
  console.error('❌ Fatal error building database:', err.message);
  process.exit(1);
});
