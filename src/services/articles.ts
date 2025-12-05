// src/services/articles.ts
export interface Article {
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
  private articles: Article[] = [];
  private loaded = false;

  private constructor() {}

  public static getInstance(): ArticlesService {
    if (!ArticlesService.instance) {
      ArticlesService.instance = new ArticlesService();
    }
    return ArticlesService.instance;
  }

  public async loadArticles(): Promise<Article[]> {
    if (this.loaded) {
      return this.articles;
    }

    try {
      // Try enriched articles first, fallback to regular articles
      let response = await fetch('/data/articles-enriched.json');
      if (!response.ok) {
        response = await fetch('/data/articles.json');
      }

      if (response.ok) {
        this.articles = await response.json();
        this.loaded = true;
        console.log(`📰 Loaded ${this.articles.length} articles`);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    }

    return this.articles;
  }

  public getArticles(): Article[] {
    return this.articles;
  }

  public getArticlesByCategory(category: string): Article[] {
    return this.articles.filter(
      (a) => (a.category || a.sourceCategory || 'inne').toLowerCase() === category.toLowerCase()
    );
  }

  public getArticlesBySource(source: string): Article[] {
    return this.articles.filter((a) => a.source === source);
  }

  public getTopArticles(limit: number = 10): Article[] {
    return this.articles
      .sort((a, b) => {
        // Sort by priority (if available), then by date
        const priorityDiff = (b.priority || 3) - (a.priority || 3);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      })
      .slice(0, limit);
  }

  public searchArticles(query: string): Article[] {
    const q = query.toLowerCase();
    return this.articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }

  public getArticleByGuid(guid: string): Article | undefined {
    return this.articles.find((a) => a.guid === guid);
  }
}
