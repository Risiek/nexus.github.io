import { NexusMap } from './map';
import './map/map.css';
import { ArticlesService } from './services/articles';
import type { Article } from './services/articles';

export class NexusDashboard {
  private container: HTMLElement
  private map: NexusMap | null = null
  private articlesService: ArticlesService
  private articles: Article[] = []

  constructor(container: HTMLElement) {
    this.container = container
    this.articlesService = ArticlesService.getInstance()
  }

  async render(): Promise<void> {
    // Load articles first
    this.articles = await this.articlesService.loadArticles()
    
    this.container.innerHTML = this.getTemplate()
    this.setupEventListeners()
    this.initMap()
    await this.populateArticles()
  }

  private initMap(): void {
    const mapContainer = this.container.querySelector('#map-container') as HTMLElement
    if (mapContainer) {
      this.map = new NexusMap(mapContainer)
      
      // Listen for node selection events
      mapContainer.addEventListener('nodeSelected', ((e: CustomEvent) => {
        console.log('News node selected:', e.detail)
        this.showNewsPanel(e.detail)
      }) as EventListener)
    }
  }

  private showNewsPanel(node: any): void {
    // You can implement a news panel here
    console.log('Showing news:', node.title)
  }

  public getMap(): NexusMap | null {
    return this.map
  }

  private getTemplate(): string {
    return `
      <!-- Top Navigation / Header -->
      <header class="sticky flex bg-neutral-950/80 h-14 z-50 border-neutral-800 border-b pr-6 pl-6 top-0 backdrop-blur-md items-center justify-between" style="transition: outline 0.1s ease-in-out">
        <div class="flex items-center gap-8">
          <!-- Logo -->
          <div class="flex items-center gap-2 text-neutral-100">
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="20" height="20" viewBox="0 0 24 24" data-icon="lucide:aperture" data-width="20" data-stroke-width="1.5"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="m14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path></g></svg>
            <span class="text-sm font-semibold tracking-tighter uppercase">NEXUS<span class="font-light ml-1 text-neutral-600">PL</span></span>
          </div>
          
          <!-- Desktop Nav -->
          <nav class="hidden md:flex items-center gap-6 text-xs font-medium tracking-wide">
            <a href="#" class="transition-colors text-neutral-100">Pulpit nawigacyjny</a>
            <a href="#" class="transition-colors hover:text-neutral-200">Aktualności</a>
            <a href="#" class="transition-colors hover:text-neutral-200">Nauka i technika</a>
            <a href="#" class="transition-colors hover:text-neutral-200">Rynki</a>
          </nav>
        </div>

        <div class="flex items-center gap-4">
          <div class="hidden md:flex items-center gap-2 border rounded px-3 py-1.5 group focus-within:border-neutral-600 transition-colors bg-neutral-900 border-neutral-800">
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="14" height="14" viewBox="0 0 24 24" data-icon="lucide:search" data-width="14" data-stroke-width="1.5"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m21 21l-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></g></svg>
                <input type="text" placeholder="Szukaj zdarzeń, podmiotów..." class="bg-transparent border-none outline-none text-xs w-48 placeholder:text-neutral-600 text-neutral-300">
            <span class="text-[10px] border rounded px-1 text-neutral-600 border-neutral-700">⌘K</span>
          </div>
          <button class="relative transition text-neutral-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="18" height="18" viewBox="0 0 24 24" data-icon="lucide:bell" data-width="18" data-stroke-width="1.5"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.268 21a2 2 0 0 0 3.464 0m-10.47-5.674A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path></svg>
            <span class="absolute top-0 right-0 w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
          </button>
          <div class="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-medium cursor-pointer transition bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
            JS
          </div>
        </div>
      </header>

      <!-- Live Ticker -->
      <div class="h-8 border-b flex items-center relative overflow-hidden text-[10px] tracking-wide uppercase font-medium bg-neutral-900 border-neutral-800 text-neutral-400">
        <div class="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r to-transparent z-10 from-neutral-900"></div>
        <div class="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l to-transparent z-10 from-neutral-900"></div>
        <div class="flex items-center px-4 gap-2 z-20 h-full border-r bg-neutral-900 border-neutral-800 text-indigo-400">
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 24 24" data-icon="lucide:activity" data-width="12" data-stroke-width="1.5"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path></svg>
          BIEŻĄCE
        </div>
        <div class="ticker-wrap w-full">
          <div class="ticker">
            <span class="mx-6"><span class="text-neutral-200">WARSZAWA:</span> Sejm aprobuje nową ustawę o infrastrukturze energetycznej +2,4%</span>
            <span class="mx-6 text-neutral-700">|</span>
            <span class="mx-6"><span class="text-neutral-200">GLOBALNE:</span> Ceny ropy stabilizują się po szczycie OPEC</span>
            <span class="mx-6 text-neutral-700">|</span>
            <span class="mx-6"><span class="text-red-400">ALERT:</span> Wstrząsy sejsmiczne wykryte w Pacyfiku Południowym</span>
            <span class="mx-6 text-neutral-700">|</span>
            <span class="mx-6"><span class="text-neutral-200">TECH:</span> Sektor AI Polski odnotowuje rekordowe inwestycje w Q3</span>
            <span class="mx-6 text-neutral-700">|</span>
            <span class="mx-6"><span class="text-neutral-200">KIJÓW:</span> Aktualizacje linii frontu pokazują przesunięcia na wschodzie</span>
            <span class="mx-6 text-neutral-700">|</span>
            <span class="mx-6"><span class="text-neutral-200">RYNKI:</span> WIG20 zamyka się na 2450 punktach</span>
            <!-- Duplicate for seamless loop -->
            <span class="mx-6"><span class="text-neutral-200">WARSZAWA:</span> Sejm aprobuje nową ustawę o infrastrukturze energetycznej +2,4%</span>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex flex-1 overflow-hidden">
        
        <!-- Sidebar Filters -->
        <aside class="w-16 lg:w-64 flex-shrink-0 border-r hidden md:flex flex-col justify-between py-4 sm:py-6 px-2 sm:px-0 border-neutral-800 bg-neutral-950">
          <div class="px-2 lg:px-4 space-y-1">
                <div class="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-4 px-2 hidden lg:block">Kanały</div>            <a href="#" class="flex items-center gap-3 px-2 py-2 rounded border text-neutral-200 bg-neutral-900 border-neutral-800/50">
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="16" height="16" viewBox="0 0 24 24" data-icon="lucide:layout-grid" data-width="16" data-stroke-width="1.5"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></g></svg>
              <span class="hidden lg:block text-sm">Przegląd</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-2 py-2 rounded transition-all text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="16" height="16" viewBox="0 0 24 24" data-icon="lucide:globe" data-width="16" data-stroke-width="1.5"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20a14.5 14.5 0 0 0 0-20M2 12h20"></path></g></svg>
              <span class="hidden lg:block text-sm">Geopolityka</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-2 py-2 rounded transition-all text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="16" height="16" viewBox="0 0 24 24" data-icon="lucide:trending-up" data-width="16" data-stroke-width="1.5"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M16 7h6v6"></path><path d="m22 7l-8.5 8.5l-5-5L2 17"></path></g></svg>
              <span class="hidden lg:block text-sm">Gospodarka</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-2 py-2 rounded transition-all text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="16" height="16" viewBox="0 0 24 24" data-icon="lucide:shield-alert" data-width="16" data-stroke-width="1.5"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zm-8-5v4m0 4h.01"></path></svg>
              <span class="hidden lg:block text-sm">Konflikt</span>
              <span class="hidden lg:flex ml-auto w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            </a>
            <a href="#" class="flex items-center gap-3 px-2 py-2 rounded transition-all text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="16" height="16" viewBox="0 0 24 24" data-icon="lucide:microscope" data-width="16" data-stroke-width="1.5"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18h8M3 22h18m-7 0a7 7 0 1 0 0-14h-1m-4 6h2m-2-2a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Zm3-6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"></path></svg>
              <span class="hidden lg:block text-sm">Nauka</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-2 py-2 rounded transition-all text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="16" height="16" viewBox="0 0 24 24" data-icon="lucide:users" data-width="16" data-stroke-width="1.5"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.128a4 4 0 0 1 0 7.744M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></g></svg>
              <span class="hidden lg:block text-sm">Społeczeństwo</span>
            </a>
          </div>

          <div class="px-2 lg:px-6 space-y-6">
            <div class="hidden lg:block">
                    <div class="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest mb-3">Filtr regionów</div>
              <div class="space-y-2">
                <label class="flex items-center gap-3 cursor-pointer group">
                  <div class="w-4 h-4 rounded border flex items-center justify-center group-hover:border-neutral-500 transition border-neutral-700 bg-neutral-900">
                    <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="10" height="10" viewBox="0 0 24 24" data-icon="lucide:check" data-width="10" data-stroke-width="2"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"></path></svg>
                  </div>
                  <span class="text-sm text-neutral-300">Polska (Rdzeń)</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer group">
                  <div class="w-4 h-4 rounded border flex items-center justify-center group-hover:border-neutral-500 transition border-neutral-700 bg-neutral-900">
                    <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="10" height="10" viewBox="0 0 24 24" data-icon="lucide:check" data-width="10" data-stroke-width="2"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"></path></svg>
                  </div>
                  <span class="text-sm text-neutral-300">Unia Europejska</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer group">
                  <div class="w-4 h-4 rounded border flex items-center justify-center group-hover:border-neutral-500 transition border-neutral-700 bg-neutral-900"></div>
                  <span class="text-sm group-hover:text-neutral-300 text-neutral-400">Ameryka Północna</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer group">
                  <div class="w-4 h-4 rounded border flex items-center justify-center group-hover:border-neutral-500 transition border-neutral-700 bg-neutral-900"></div>
                  <span class="text-sm group-hover:text-neutral-300 text-neutral-400">Azja i Pacyfik</span>
                </label>
              </div>
            </div>
            <div class="hidden lg:block border-t pt-4 border-neutral-800">
              <div class="flex items-center justify-between text-xs text-neutral-500 mb-2">
                <span>Wynik istotności</span>
                <span>85+</span>
              </div>
              <div class="h-1 rounded-full overflow-hidden bg-neutral-800">
                <div class="h-full w-[85%] rounded-full bg-neutral-600"></div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Dashboard Content - FULL WIDTH -->
        <main class="flex-1 overflow-y-auto p-4 md:p-8 bg-neutral-950">
            
            <div class="max-w-7xl mx-auto space-y-6">
                
                <!-- Hero Section -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <!-- 2D Map -->
                    <div id="map-container" class="lg:col-span-2 relative bg-neutral-925 border rounded-lg overflow-hidden group border-neutral-800" style="height: 450px;">
                        <div class="map-activity">
                            <span class="map-activity-dot"></span>
                            <span class="map-activity-text">Global Activity Monitor</span>
                        </div>
                        <div class="map-legend">
                            <div class="legend-item"><span class="legend-dot breaking"></span><span class="legend-label">Breaking</span></div>
                            <div class="legend-item"><span class="legend-dot major"></span><span class="legend-label">Major</span></div>
                            <div class="legend-item"><span class="legend-dot regular"></span><span class="legend-label">Regular</span></div>
                            <div class="legend-item"><span class="legend-dot market"></span><span class="legend-label">Market</span></div>
                        </div>
                    </div>

                    <!-- Featured Story -->
                    <div class="border rounded-lg p-6 flex flex-col justify-between transition duration-300 bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 featured-story">
                        <div>
                            <div class="flex items-center gap-2 mb-4">
                                <span class="bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider text-indigo-400">Analiza</span>
                                <span class="text-[10px] text-neutral-500 font-medium">14 min temu</span>
                            </div>
                            <h2 class="text-xl font-medium leading-snug tracking-tight mb-3 text-neutral-100">Ładowanie artykułów...</h2>
                            <p class="text-sm leading-relaxed text-neutral-400">Pobieranie danych...</p>
                        </div>
                        <div class="mt-6 pt-6 border-t flex items-center justify-between border-neutral-800">
                            <div class="flex -space-x-2">
                                <div class="w-6 h-6 rounded-full border flex items-center justify-center text-[8px] bg-neutral-800 border-neutral-900 text-neutral-300">--</div>
                            </div>
                            <button class="text-xs flex items-center gap-1 transition-colors text-neutral-300 hover:text-white">Czytaj →</button>
                        </div>
                    </div>
                </div>

                <!-- Sub-grids -->
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    <!-- Politics & Society -->
                    <div class="lg:col-span-2 space-y-4">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-sm font-medium flex items-center gap-2 text-neutral-200">🏛 Polityka i społeczeństwo</h3>
                            <button class="text-[10px] uppercase tracking-wider text-neutral-500 hover:text-neutral-300">Wyświetl wszystko</button>
                        </div>

                        <div id="politics-articles" class="space-y-4">
                            <div class="bg-neutral-925 border rounded-lg p-5 transition group border-neutral-800">
                                <div class="text-xs text-neutral-500">Ładowanie...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Conflict Monitor -->
                    <div id="conflict-monitor" class="space-y-4">
                        <h3 class="text-sm font-medium flex items-center gap-2 text-neutral-200 mb-2">⚠️ Monitor konfliktów</h3>
                        <div class="bg-neutral-925/50 border rounded-lg p-4 text-center border-neutral-800">
                            <p class="text-xs text-neutral-500">Ładowanie danych...</p>
                        </div>
                    </div>

                    <!-- Market Data -->
                    <div class="space-y-4">
                        <h3 class="text-sm font-medium flex items-center gap-2 text-neutral-200 mb-2">📊 Dane rynkowe</h3>

                        <div class="bg-neutral-925 border rounded-lg p-4 border-neutral-800">
                            <div class="flex items-center justify-between mb-3 border-b pb-2 border-neutral-800">
                                <span class="text-xs text-neutral-400">USD / PLN</span>
                                <span class="text-xs font-medium text-green-400">3,94 ↘</span>
                            </div>
                            <div class="flex items-center justify-between mb-3 border-b pb-2 border-neutral-800">
                                <span class="text-xs text-neutral-400">EUR / PLN</span>
                                <span class="text-xs font-medium text-neutral-200">4,28 —</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-neutral-400">WIG 20</span>
                                <span class="text-xs font-medium text-green-400">2450 ↗</span>
                            </div>
                        </div>

                        <div class="bg-neutral-925 border rounded-lg p-4 h-40 flex flex-col justify-between border-neutral-800">
                            <div class="flex justify-between items-start">
                                <span class="text-[10px] text-neutral-500 uppercase tracking-wider">Produkcja energii (GW)</span>
                                <span class="text-neutral-500">⚡</span>
                            </div>
                            <div class="flex items-end gap-2 h-20 mt-2 px-1">
                                <div class="flex-1 rounded-t h-[40%] bg-neutral-800 hover:bg-neutral-700"></div>
                                <div class="flex-1 rounded-t h-[60%] bg-neutral-800 hover:bg-neutral-700"></div>
                                <div class="flex-1 rounded-t h-[55%] bg-neutral-800 hover:bg-neutral-700"></div>
                                <div class="flex-1 rounded-t h-[75%] bg-neutral-800 hover:bg-neutral-700"></div>
                                <div class="flex-1 bg-indigo-500/80 rounded-t h-[90%] shadow-[0_0_10px_rgba(99,102,241,0.3)]"></div>
                            </div>
                            <div class="flex justify-between text-[9px] mt-1 text-neutral-600">
                                <span>Pon</span>
                                <span>Wto</span>
                                <span>Śro</span>
                                <span>Czw</span>
                                <span>Dziś</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            
            <footer class="mt-12 border-t pt-8 pb-4 text-center border-neutral-900">
                <p class="text-[10px] text-neutral-600">© 2024 NEXUS PL. Agregowana inteligencja ze zweryfikowanych źródeł. Dane opóźnione o 15 minut.</p>
            </footer>
        </main>
      </div>
    `
  }

  private setupEventListeners(): void {
    // Add interactive elements here
    const navLinks = this.container.querySelectorAll('a[href="#"]')
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        console.log('Navigation clicked:', link.textContent)
      })
    })

    // Article click handlers
    this.container.querySelectorAll('.article-card').forEach((card) => {
      card.addEventListener('click', () => {
        const guid = (card as HTMLElement).dataset.guid;
        if (guid) {
          this.navigateToArticle(guid);
        }
      });
    });
  }

  private navigateToArticle(guid: string): void {
    // Store article GUID in sessionStorage and navigate
    sessionStorage.setItem('selectedArticleGuid', guid);
    window.location.hash = '#article/' + guid;
  }

  private async populateArticles(): Promise<void> {
    if (this.articles.length === 0) {
      console.warn('No articles loaded');
      return;
    }

    // Get top articles sorted by priority/date
    const topArticles = await this.articlesService.getTopArticles(1);  // Best article for featured
    
    // Get last 4 political/social articles
    const politicsArticles = await this.articlesService.getArticlesByCategory('polityka');
    const politicsSliced = politicsArticles.slice(0, 4);

    // Populate featured story (first top article)
    if (topArticles.length > 0) {
      this.populateFeaturedStory(topArticles[0]);
    }

    // Populate politics section
    this.populateSectionArticles('politics-articles', politicsSliced);

    // Update ticker with top 5
    const ticker = await this.articlesService.getTopArticles(5);
    this.updateTicker(ticker);
  }

  private populateFeaturedStory(article: Article): void {
    const featuredContainer = this.container.querySelector('.featured-story');
    if (!featuredContainer) return;

    const timeAgo = this.getTimeAgo(article.publishedAt);
    const category = article.category || article.sourceCategory || 'Wiadomość';

    featuredContainer.innerHTML = `
      <div class="article-card cursor-pointer transition" data-guid="${article.guid}">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <span class="bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider text-indigo-400">${category}</span>
            <span class="text-[10px] text-neutral-500 font-medium">${timeAgo}</span>
          </div>
          <h2 class="text-xl font-medium leading-snug tracking-tight mb-3 text-neutral-100">${article.title}</h2>
          <p class="text-sm leading-relaxed text-neutral-400">${article.description?.slice(0, 200) || 'Brak opisu'}...</p>
        </div>
        <div class="mt-6 pt-6 border-t flex items-center justify-between border-neutral-800">
          <div class="flex -space-x-2">
            <div class="w-6 h-6 rounded-full border flex items-center justify-center text-[8px] bg-neutral-800 border-neutral-900 text-neutral-300">${article.source.slice(0, 2).toUpperCase()}</div>
          </div>
          <button class="text-xs flex items-center gap-1 transition-colors text-neutral-300 hover:text-white">Czytaj →</button>
        </div>
      </div>
    `;
  }

  private populateSectionArticles(containerId: string, articles: Article[]): void {
    const container = this.container.querySelector('#' + containerId);
    if (!container) return;

    if (articles.length === 0) {
      container.innerHTML = '<div class="bg-neutral-925 border rounded-lg p-5 text-xs text-neutral-500 border-neutral-800">Brak artykułów w tej kategorii</div>';
      return;
    }

    container.innerHTML = articles.map((article) => {
      const category = article.category || article.sourceCategory || 'Inne';
      const categoryColor = this.getCategoryColor(category);
      const timeAgo = this.getTimeAgo(article.publishedAt);

      return `
        <div class="article-card bg-neutral-925 border rounded-lg p-5 transition group cursor-pointer border-neutral-800 hover:bg-neutral-900" data-guid="${article.guid}">
          <div class="flex justify-between items-start mb-2">
            <span class="text-[10px] font-semibold uppercase tracking-widest ${categoryColor}">${category}</span>
            <span class="text-[10px] text-neutral-500">${timeAgo}</span>
          </div>
          <h4 class="text-base font-medium tracking-tight mb-2 group-hover:text-indigo-300 transition-colors text-neutral-200">${article.title}</h4>
          <p class="text-xs text-neutral-500 line-clamp-2">${article.description || 'Brak opisu'}</p>
          <div class="mt-3 pt-3 border-t border-neutral-800/50">
            <span class="text-[10px] text-neutral-600">📰 ${article.source}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  private updateTicker(articles: Article[]): void {
    const tickerContent = this.container.querySelector('.ticker');
    if (!tickerContent) return;

    const tickerItems = articles.slice(0, 5).map((article) => {
      const category = article.category || article.sourceCategory || 'Inne';
      const priority = article.priority || 3;
      const priorityColor = priority >= 4 ? 'text-red-400' : 'text-neutral-200';

      return `<span class="mx-6"><span class="${priorityColor}">${category.toUpperCase()}:</span> ${article.title}</span>`;
    }).join('<span class="mx-6 text-neutral-700">|</span>');

    // Duplicate for seamless loop
    tickerContent.innerHTML = tickerItems + '<span class="mx-6 text-neutral-700">|</span>' + tickerItems;
  }

  private getCategoryColor(category: string): string {
    const catLower = category.toLowerCase();
    if (catLower.includes('gospodarka')) return 'text-green-400';
    if (catLower.includes('nauka')) return 'text-blue-400';
    if (catLower.includes('konflikt') || catLower.includes('wojna')) return 'text-red-400';
    if (catLower.includes('polityka')) return 'text-yellow-400';
    return 'text-neutral-400';
  }

  private getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'teraz';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min temu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h temu`;
    const days = Math.floor(hours / 24);
    return `${days}d temu`;
  }
}
