import './style.css'
import { NexusDashboard } from './dashboard.ts'
import { ArticleDetail } from './article-detail.ts'
import ConflictMonitor from './conflict-monitor.ts'
import { ArticlesService } from './services/articles'

const app = document.querySelector<HTMLDivElement>('#app')

async function initializeApp() {
  if (!app) return;

  // Initialize articles service
  const articlesService = ArticlesService.getInstance();
  await articlesService.loadArticles();

  // Check if we're viewing an article detail page
  const hash = window.location.hash;
  const articleMatch = hash.match(/#article\/(.+)/);

  if (articleMatch) {
    // Show article detail
    const guid = decodeURIComponent(articleMatch[1]);
    const articleDetail = new ArticleDetail(app);
    await articleDetail.render(guid);
  } else {
    // Show dashboard
    const dashboard = new NexusDashboard(app);
    await dashboard.render();

    // Initialize conflict monitor
    const conflictMonitor = new ConflictMonitor();
    await conflictMonitor.populate();
  }
}

// Handle hash changes for navigation
window.addEventListener('hashchange', () => {
  initializeApp();
});

// Initial load
initializeApp();
