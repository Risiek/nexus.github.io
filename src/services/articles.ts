// src/services/articles.ts
import { createDbWorker } from 'sql.js-httpvfs';

export interface Article {
  id?: number;
  guid: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  sourceCategory?: string;
  category?: string;
  thumbnail?: string;
  priority?: number;
  keywords?: string[];
  location?: any;
  enriched_at?: string;
}

export class ArticlesService {
  private static instance: ArticlesService;
  private db: any = null;
  private loaded = false;

  private constructor() {}

  public static getInstance(): ArticlesService {
    if (!ArticlesService.instance) {
      ArticlesService.instance = new ArticlesService();
    }
    return ArticlesService.instance;
  }

  public async loadArticles(): Promise<Article[]> {
    if (this.loaded && this.db) {
      return this.queryArticles('SELECT * FROM articles ORDER BY published_at DESC LIMIT 1000');
    }

    try {
      // Setup HTTP VFS for streaming database
      const workerUrl = new URL(
        'sql.js-httpvfs/dist/sqlite.worker.js',
        import.meta.url,
      );
      const wasmUrl = new URL(
        'sql.js-httpvfs/dist/sql-wasm.wasm',
        import.meta.url,
      );

      const config = {
        from: 'inline' as const,
        config: {
          serverMode: 'full' as const,
          requestChunkSize: 1024,
          url: '/data/news.db',
        },
      };

      this.db = await createDbWorker(
        [config],
        workerUrl.toString(),
        wasmUrl.toString(),
      );

      this.loaded = true;

      const result = await this.db.query('SELECT COUNT(*) as count FROM articles');
      const count = result?.[0]?.count || 0;
      console.log(`📰 Loaded database with ${count} articles`);

      return this.queryArticles('SELECT * FROM articles ORDER BY published_at DESC LIMIT 1000');
    } catch (error) {
      console.error('Error loading articles from database:', error);
      // Fallback to JSON if database fails
      return this.loadArticlesFromJSON();
    }
  }

  private async loadArticlesFromJSON(): Promise<Article[]> {
    try {
      let response = await fetch('/data/articles-enriched.json');
      if (!response.ok) {
        response = await fetch('/data/articles.json');
      }

      if (response.ok) {
        const articles = await response.json();
        console.log(`📰 Fallback: Loaded ${articles.length} articles from JSON`);
        return articles;
      }
    } catch (error) {
      console.error('Error loading articles from JSON:', error);
    }
    return [];
  }

  private async queryArticles(sql: string): Promise<Article[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.query(sql);
      
      return results.map((row: any) => {
        // Parse JSON fields
        let keywords = row.keywords;
        let location = row.location;

        if (typeof keywords === 'string') {
          try {
            keywords = JSON.parse(keywords);
          } catch {}
        }
        if (typeof location === 'string') {
          try {
            location = JSON.parse(location);
          } catch {}
        }

        // Map database fields to interface
        return {
          id: row.id,
          guid: row.guid,
          title: row.title,
          description: row.description,
          url: row.url,
          publishedAt: row.published_at,
          source: row.source,
          sourceCategory: row.source_category,
          category: row.category,
          thumbnail: row.thumbnail,
          priority: row.priority,
          keywords,
          location,
          enriched_at: row.enriched_at,
        } as Article;
      });
    } catch (error) {
      console.error('SQL query error:', error);
      return [];
    }
  }

  public async getArticles(): Promise<Article[]> {
    return this.queryArticles('SELECT * FROM articles ORDER BY published_at DESC LIMIT 1000');
  }

  public async getArticlesByCategory(category: string): Promise<Article[]> {
    const sql = `
      SELECT * FROM articles 
      WHERE LOWER(category) = LOWER(?) 
      ORDER BY published_at DESC
    `;
    return this.queryArticlesWithParams(sql, [category]);
  }

  public async getArticlesBySource(source: string): Promise<Article[]> {
    const sql = `
      SELECT * FROM articles 
      WHERE source = ? 
      ORDER BY published_at DESC
    `;
    return this.queryArticlesWithParams(sql, [source]);
  }

  public async getTopArticles(limit: number = 10): Promise<Article[]> {
    const sql = `
      SELECT * FROM articles 
      ORDER BY priority ASC, published_at DESC 
      LIMIT ?
    `;
    return this.queryArticlesWithParams(sql, [limit]);
  }

  public async searchArticles(query: string): Promise<Article[]> {
    if (!this.db) return [];

    try {
      // Use FTS5 search if available
      const sql = `
        SELECT a.* FROM articles a
        JOIN articles_fts fts ON a.id = fts.rowid
        WHERE articles_fts MATCH ?
        ORDER BY a.published_at DESC
        LIMIT 100
      `;
      return this.queryArticlesWithParams(sql, [query]);
    } catch {
      // Fallback to LIKE search
      const q = `%${query}%`;
      const sql = `
        SELECT * FROM articles 
        WHERE title LIKE ? OR description LIKE ? OR keywords LIKE ?
        ORDER BY published_at DESC
        LIMIT 100
      `;
      return this.queryArticlesWithParams(sql, [q, q, q]);
    }
  }

  public async getArticleByGuid(guid: string): Promise<Article | undefined> {
    const articles = await this.queryArticlesWithParams(
      'SELECT * FROM articles WHERE guid = ? LIMIT 1',
      [guid]
    );
    return articles[0];
  }

  private async queryArticlesWithParams(sql: string, params: any[]): Promise<Article[]> {
    if (!this.db) return [];

    try {
      const results = await this.db.query(sql, params);

      return results.map((row: any) => {
        // Parse JSON fields
        let keywords = row.keywords;
        let location = row.location;

        if (typeof keywords === 'string') {
          try {
            keywords = JSON.parse(keywords);
          } catch {}
        }
        if (typeof location === 'string') {
          try {
            location = JSON.parse(location);
          } catch {}
        }

        return {
          id: row.id,
          guid: row.guid,
          title: row.title,
          description: row.description,
          url: row.url,
          publishedAt: row.published_at,
          source: row.source,
          sourceCategory: row.source_category,
          category: row.category,
          thumbnail: row.thumbnail,
          priority: row.priority,
          keywords,
          location,
          enriched_at: row.enriched_at,
        } as Article;
      });
    } catch (error) {
      console.error('SQL query error:', error, 'SQL:', sql);
      return [];
    }
  }
}
