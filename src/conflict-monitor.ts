/**
 * Conflict Monitor Widget
 * Displays global conflict data with tension levels and trends
 */

interface ConflictRegion {
  region: string;
  conflict_name: string;
  tension_level: string;
  tension_score: number;
  trend: string;
  article_count: number;
  latest_headline: string;
  latest_time: string;
  color: string;
}

interface ConflictSummary {
  generated_at: string;
  total_articles: number;
  total_regions: number;
  top_conflicts: ConflictRegion[];
}

class ConflictMonitor {
  constructor() {
    // Monitor initialized
  }

  /**
   * Load conflict summary from JSON file
   */
  async loadConflictData(): Promise<ConflictSummary | null> {
    try {
      const response = await fetch('/data/conflicts-summary.json');
      if (response.ok) {
        return await response.json();
      }
      console.warn('Conflicts summary not found');
      return null;
    } catch (error) {
      console.error('Failed to load conflict data:', error);
      return null;
    }
  }

  /**
   * Get tension level emoji and color coding
   */
  getTensionIcon(score: number): string {
    if (score >= 9) return '🔴'; // Critical
    if (score >= 7) return '🟠'; // High
    if (score >= 5) return '🟡'; // Medium
    if (score >= 3) return '🔵'; // Low
    return '⚪'; // Minimal
  }

  /**
   * Format time ago (e.g., "2 hours ago")
   */
  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  /**
   * Render conflict cards HTML
   */
  renderConflictCards(conflicts: ConflictRegion[]): string {
    if (conflicts.length === 0) {
      return `
        <div class="col-span-full flex flex-col items-center justify-center py-12">
          <p class="text-gray-500 text-sm">No active conflicts in dataset</p>
        </div>
      `;
    }

    return conflicts
      .map(
        (conflict) => `
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer" data-conflict-region="${conflict.region}">
        <!-- Header with region and tension -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="font-bold text-gray-900 dark:text-white">${conflict.region}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${conflict.conflict_name}</p>
          </div>
          <span class="text-xl" title="${conflict.tension_level} (${conflict.tension_score}/10)">
            ${this.getTensionIcon(conflict.tension_score)}
          </span>
        </div>

        <!-- Tension bar -->
        <div class="mb-3">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Tension Level</span>
            <span class="text-xs font-bold" style="color: ${conflict.color}">
              ${conflict.tension_score}/10
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              style="width: ${conflict.tension_score * 10}%; background-color: ${conflict.color};"
            ></div>
          </div>
        </div>

        <!-- Trend indicator -->
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
            ${conflict.trend === 'escalating' ? '📈 Escalating' : conflict.trend === 'de-escalating' ? '📉 De-escalating' : '→ Stable'}
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-500">${conflict.article_count} articles</span>
        </div>

        <!-- Latest headline -->
        <div class="mb-3 bg-gray-50 dark:bg-gray-700 rounded p-2">
          <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            ${conflict.latest_headline}
          </p>
        </div>

        <!-- Footer with timestamp -->
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            ${this.formatTimeAgo(conflict.latest_time)}
          </span>
          <span class="text-xs text-blue-600 dark:text-blue-400 hover:underline">View →</span>
        </div>
      </div>
    `,
      )
      .join('');
  }

  /**
   * Populate conflict monitor section
   */
  async populate(): Promise<void> {
    const container = document.getElementById('conflict-monitor');
    if (!container) {
      console.warn('Conflict monitor container not found');
      return;
    }

    try {
      // Load conflict data
      const data = await this.loadConflictData();

      if (!data || !data.top_conflicts || data.top_conflicts.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8">
            <p class="text-gray-500 text-sm">Conflict data not available</p>
            <p class="text-xs text-gray-400 mt-2">Run: npm run build:conflicts</p>
          </div>
        `;
        return;
      }

      // Render header with stats
      const header = `
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Monitor Konfliktów</h2>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              ${data.total_regions} regions • ${data.total_articles} articles
            </span>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400">
            Last updated: ${this.formatTimeAgo(data.generated_at)}
          </p>
        </div>
      `;

      // Render conflict cards grid
      const cardsHtml = this.renderConflictCards(data.top_conflicts);
      const cards = `
        <div class="grid grid-cols-1 gap-3">
          ${cardsHtml}
        </div>
      `;

      container.innerHTML = header + cards;

      // Add click handlers
      this.attachEventHandlers();
    } catch (error) {
      console.error('Failed to populate conflict monitor:', error);
      container.innerHTML = `
        <div class="text-red-600 dark:text-red-400 text-sm p-4">
          Error loading conflict data: ${error instanceof Error ? error.message : 'Unknown error'}
        </div>
      `;
    }
  }

  /**
   * Attach event handlers to conflict cards
   */
  private attachEventHandlers(): void {
    const cards = document.querySelectorAll('[data-conflict-region]');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const region = card.getAttribute('data-conflict-region');
        this.showConflictDetails(region);
      });
    });
  }

  /**
   * Show detailed view of conflict region
   */
  private async showConflictDetails(region: string | null): Promise<void> {
    if (!region) return;

    try {
      const response = await fetch('/data/conflicts-enriched.json');
      if (!response.ok) return;

      const conflicts = await response.json();
      const regionConflicts = conflicts.filter((a: any) => a.conflict_region === region);

      if (regionConflicts.length === 0) {
        alert(`No articles found for region: ${region}`);
        return;
      }

      // Create modal or sidebar with conflict details
      console.log(`Showing ${regionConflicts.length} conflicts for ${region}`);

      // For now, log the data
      // TODO: Implement detailed modal view
      regionConflicts.forEach((conflict: any, index: number) => {
        console.log(`${index + 1}. [${conflict.event_type}] ${conflict.title}`);
        console.log(`   Actors: ${conflict.actors}`);
        console.log(`   Tension: ${conflict.tension_score}/10`);
      });
    } catch (error) {
      console.error('Failed to load conflict details:', error);
    }
  }
}

export default ConflictMonitor;
