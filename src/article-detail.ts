// src/article-detail.ts
import type { Article } from './services/articles';
import { ArticlesService } from './services/articles';

export class ArticleDetail {
  private container: HTMLElement;
  private service: ArticlesService;
  private article: Article | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.service = ArticlesService.getInstance();
  }

  public async render(guid: string): Promise<void> {
    this.article = this.service.getArticleByGuid(guid) || null;

    if (!this.article) {
      this.container.innerHTML = '<div class="p-8 text-center text-neutral-400">Artykuł nie znaleziony.</div>';
      return;
    }

    this.container.innerHTML = this.getTemplate();
    this.setupEventListeners();
  }

  private getTemplate(): string {
    const article = this.article!;
    const pubDate = new Date(article.publishedAt).toLocaleString('pl-PL');
    const category = article.category || article.sourceCategory || 'Inne';

    return `
      <div class="min-h-screen bg-neutral-950 text-neutral-400 flex flex-col">
        <!-- Header -->
        <header class="sticky flex bg-neutral-950/80 h-14 z-50 border-neutral-800 border-b pr-6 pl-6 top-0 backdrop-blur-md items-center justify-between">
          <div class="flex items-center gap-4">
            <button id="back-btn" class="text-neutral-400 hover:text-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18l-6-6 6-6"/></svg>
            </button>
            <div class="flex items-center gap-2 text-neutral-100">
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="20" height="20" viewBox="0 0 24 24" data-icon="lucide:aperture" data-width="20" data-stroke-width="1.5"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="m14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path></g></svg>
              <span class="text-sm font-semibold tracking-tighter uppercase">NEXUS<span class="font-light ml-1 text-neutral-600">PL</span></span>
            </div>
          </div>
        </header>

        <!-- Content -->
        <main class="flex-1 overflow-y-auto">
          <article class="max-w-3xl mx-auto px-4 md:px-8 py-8">
            <!-- Metadata -->
            <div class="mb-6">
              <div class="flex items-center gap-2 mb-4">
                <span class="bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider text-indigo-400">${category}</span>
                <span class="text-[10px] text-neutral-500 font-medium">${article.source}</span>
              </div>
              <h1 class="text-3xl md:text-4xl font-semibold leading-tight mb-3 text-neutral-100">${article.title}</h1>
              <div class="flex items-center gap-4 text-sm text-neutral-500">
                <span>${pubDate}</span>
                <span>•</span>
                <span>${article.source}</span>
              </div>
            </div>

            <!-- Thumbnail -->
            ${
              article.thumbnail
                ? `<div class="mb-8 rounded-lg overflow-hidden border border-neutral-800"><img src="${article.thumbnail}" alt="${article.title}" class="w-full h-auto" onerror="this.style.display='none'"></div>`
                : ''
            }

            <!-- Description -->
            <div class="prose prose-invert max-w-none mb-8">
              <p class="text-lg text-neutral-300 leading-relaxed">${article.description || 'Brak opisu.'}</p>
            </div>

            <!-- Keywords -->
            ${
              article.keywords && article.keywords.length > 0
                ? `
              <div class="mb-8 p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                <h3 class="text-sm font-semibold text-neutral-200 mb-3">Słowa kluczowe</h3>
                <div class="flex flex-wrap gap-2">
                  ${article.keywords.map((k) => `<span class="px-3 py-1 bg-neutral-800 text-neutral-300 rounded text-xs">${k}</span>`).join('')}
                </div>
              </div>
            `
                : ''
            }

            <!-- Location -->
            ${
              article.location
                ? `
              <div class="mb-8 p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                <h3 class="text-sm font-semibold text-neutral-200 mb-2">Lokalizacja</h3>
                <p class="text-sm text-neutral-300">${article.location.city || ''} ${article.location.region ? ', ' + article.location.region : ''} ${article.location.country ? ', ' + article.location.country : ''}</p>
              </div>
            `
                : ''
            }

            <!-- Source Link -->
            <div class="border-t border-neutral-800 pt-6">
              <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition">
                Czytaj pełny artykuł →
              </a>
            </div>
          </article>
        </main>
      </div>
    `;
  }

  private setupEventListeners(): void {
    const backBtn = this.container.querySelector('#back-btn') as HTMLButtonElement;
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }
  }
}
