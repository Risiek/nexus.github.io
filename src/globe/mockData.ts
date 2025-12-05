import type { NewsNode, Connection, RegionStats } from './types';

// Generate mock news data for the globe
export const MOCK_NEWS_NODES: NewsNode[] = [
  // Breaking news - high priority
  {
    id: 'n1',
    lat: 50.4501,
    lon: 30.5234,
    title: 'Zwiększona aktywność na froncie wschodnim',
    source: 'Reuters',
    category: 'Conflict',
    importance: 0.95,
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    connections: ['n2', 'n3'],
    type: 'breaking'
  },
  {
    id: 'n2',
    lat: 52.2297,
    lon: 21.0122,
    title: 'Polska wzmacnia wschodnią granicę NATO',
    source: 'PAP',
    category: 'Politics',
    importance: 0.88,
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    connections: ['n1', 'n4'],
    type: 'major'
  },
  {
    id: 'n3',
    lat: 50.0755,
    lon: 14.4378,
    title: 'Czechy wysyłają dodatkową pomoc humanitarną',
    source: 'ČTK',
    category: 'Society',
    importance: 0.72,
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    connections: ['n1'],
    type: 'regular'
  },
  // Major stories
  {
    id: 'n4',
    lat: 52.5200,
    lon: 13.4050,
    title: 'Szczyt UE w sprawie bezpieczeństwa energetycznego',
    source: 'DPA',
    category: 'Politics',
    importance: 0.85,
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    connections: ['n2', 'n5'],
    type: 'major'
  },
  {
    id: 'n5',
    lat: 48.8566,
    lon: 2.3522,
    title: 'Francja ogłasza nowe inicjatywy klimatyczne',
    source: 'AFP',
    category: 'Politics',
    importance: 0.78,
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    connections: ['n4'],
    type: 'major'
  },
  // Market news
  {
    id: 'n6',
    lat: 40.7128,
    lon: -74.0060,
    title: 'Wall Street zamyka sesję na rekordowych poziomach',
    source: 'Bloomberg',
    category: 'Market',
    importance: 0.82,
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    connections: ['n7', 'n8'],
    type: 'market'
  },
  {
    id: 'n7',
    lat: 51.5074,
    lon: -0.1278,
    title: 'Bank of England utrzymuje stopy procentowe',
    source: 'Financial Times',
    category: 'Market',
    importance: 0.75,
    timestamp: new Date(Date.now() - 150 * 60000).toISOString(),
    connections: ['n6'],
    type: 'market'
  },
  {
    id: 'n8',
    lat: 35.6762,
    lon: 139.6503,
    title: 'Nikkei osiąga najwyższy poziom od 30 lat',
    source: 'Nikkei',
    category: 'Market',
    importance: 0.80,
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
    connections: ['n6'],
    type: 'market'
  },
  // Tech & Science
  {
    id: 'n9',
    lat: 37.7749,
    lon: -122.4194,
    title: 'Silicon Valley przedstawia nowy chip AI',
    source: 'TechCrunch',
    category: 'Technology',
    importance: 0.88,
    timestamp: new Date(Date.now() - 200 * 60000).toISOString(),
    connections: ['n10'],
    type: 'major'
  },
  {
    id: 'n10',
    lat: 22.3193,
    lon: 114.1694,
    title: 'Chiny odpowiadają własnymi innowacjami półprzewodników',
    source: 'SCMP',
    category: 'Technology',
    importance: 0.84,
    timestamp: new Date(Date.now() - 220 * 60000).toISOString(),
    connections: ['n9'],
    type: 'major'
  },
  // Middle East
  {
    id: 'n11',
    lat: 32.0853,
    lon: 34.7818,
    title: 'Rozmowy pokojowe wznowione w regionie',
    source: 'AP',
    category: 'Conflict',
    importance: 0.92,
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    connections: ['n12'],
    type: 'breaking'
  },
  {
    id: 'n12',
    lat: 30.0444,
    lon: 31.2357,
    title: 'Egipt pośredniczy w negocjacjach',
    source: 'Al Jazeera',
    category: 'Politics',
    importance: 0.85,
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    connections: ['n11'],
    type: 'major'
  },
  // Asia Pacific
  {
    id: 'n13',
    lat: 39.9042,
    lon: 116.4074,
    title: 'Chiny ogłaszają nowy plan gospodarczy',
    source: 'Xinhua',
    category: 'Economy',
    importance: 0.80,
    timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
    connections: ['n14', 'n10'],
    type: 'major'
  },
  {
    id: 'n14',
    lat: 37.5665,
    lon: 126.9780,
    title: 'Korea Południowa reaguje na napięcia regionalne',
    source: 'Yonhap',
    category: 'Politics',
    importance: 0.78,
    timestamp: new Date(Date.now() - 260 * 60000).toISOString(),
    connections: ['n13', 'n8'],
    type: 'regular'
  },
  {
    id: 'n15',
    lat: 1.3521,
    lon: 103.8198,
    title: 'Singapur gospodarzem szczytu ASEAN',
    source: 'Straits Times',
    category: 'Politics',
    importance: 0.72,
    timestamp: new Date(Date.now() - 300 * 60000).toISOString(),
    connections: ['n14'],
    type: 'regular'
  },
  // Africa
  {
    id: 'n16',
    lat: 6.5244,
    lon: 3.3792,
    title: 'Nigeria uruchamia nową infrastrukturę cyfrową',
    source: 'This Day',
    category: 'Technology',
    importance: 0.65,
    timestamp: new Date(Date.now() - 320 * 60000).toISOString(),
    connections: [],
    type: 'regular'
  },
  {
    id: 'n17',
    lat: -1.2921,
    lon: 36.8219,
    title: 'Kenia przyciąga inwestycje w zieloną energię',
    source: 'Nation',
    category: 'Economy',
    importance: 0.68,
    timestamp: new Date(Date.now() - 340 * 60000).toISOString(),
    connections: [],
    type: 'regular'
  },
  // South America
  {
    id: 'n18',
    lat: -23.5505,
    lon: -46.6333,
    title: 'Brazylia wzmacnia ochronę Amazonii',
    source: 'Folha',
    category: 'Society',
    importance: 0.75,
    timestamp: new Date(Date.now() - 360 * 60000).toISOString(),
    connections: ['n19'],
    type: 'regular'
  },
  {
    id: 'n19',
    lat: -34.6037,
    lon: -58.3816,
    title: 'Argentyna negocjuje nowe umowy handlowe',
    source: 'Clarín',
    category: 'Economy',
    importance: 0.70,
    timestamp: new Date(Date.now() - 380 * 60000).toISOString(),
    connections: ['n18'],
    type: 'regular'
  },
  // Australia
  {
    id: 'n20',
    lat: -33.8688,
    lon: 151.2093,
    title: 'Australia inwestuje w technologie kwantowe',
    source: 'ABC',
    category: 'Science',
    importance: 0.72,
    timestamp: new Date(Date.now() - 400 * 60000).toISOString(),
    connections: ['n9'],
    type: 'regular'
  },
  // More European nodes
  {
    id: 'n21',
    lat: 41.9028,
    lon: 12.4964,
    title: 'Watykan wzywa do globalnego pokoju',
    source: 'ANSA',
    category: 'Society',
    importance: 0.65,
    timestamp: new Date(Date.now() - 420 * 60000).toISOString(),
    connections: ['n11'],
    type: 'regular'
  },
  {
    id: 'n22',
    lat: 40.4168,
    lon: -3.7038,
    title: 'Hiszpania prowadzi w energii odnawialnej UE',
    source: 'EFE',
    category: 'Economy',
    importance: 0.70,
    timestamp: new Date(Date.now() - 440 * 60000).toISOString(),
    connections: ['n5'],
    type: 'regular'
  },
  // India
  {
    id: 'n23',
    lat: 19.0760,
    lon: 72.8777,
    title: 'Indie uruchamiają nową misję kosmiczną',
    source: 'PTI',
    category: 'Science',
    importance: 0.82,
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
    connections: ['n20'],
    type: 'major'
  },
  {
    id: 'n24',
    lat: 28.6139,
    lon: 77.2090,
    title: 'Indie przyspieszają cyfrową transformację',
    source: 'Economic Times',
    category: 'Technology',
    importance: 0.75,
    timestamp: new Date(Date.now() - 280 * 60000).toISOString(),
    connections: ['n23', 'n16'],
    type: 'regular'
  },
  // Russia
  {
    id: 'n25',
    lat: 55.7558,
    lon: 37.6173,
    title: 'Rosja zmaga się z sankcjami gospodarczymi',
    source: 'TASS',
    category: 'Economy',
    importance: 0.85,
    timestamp: new Date(Date.now() - 100 * 60000).toISOString(),
    connections: ['n1', 'n4'],
    type: 'major'
  }
];

// Generate connections based on news nodes
export const MOCK_CONNECTIONS: Connection[] = [
  // Ukraine-Poland-Europe corridor
  { from: 'n1', to: 'n2', strength: 0.9, type: 'same_story' },
  { from: 'n1', to: 'n3', strength: 0.7, type: 'related' },
  { from: 'n2', to: 'n4', strength: 0.8, type: 'related' },
  { from: 'n4', to: 'n5', strength: 0.6, type: 'related' },
  { from: 'n1', to: 'n25', strength: 0.85, type: 'same_story' },
  
  // Market correlations
  { from: 'n6', to: 'n7', strength: 0.75, type: 'market' },
  { from: 'n6', to: 'n8', strength: 0.7, type: 'market' },
  { from: 'n7', to: 'n8', strength: 0.5, type: 'market' },
  
  // Tech connections
  { from: 'n9', to: 'n10', strength: 0.85, type: 'same_story' },
  { from: 'n9', to: 'n20', strength: 0.5, type: 'related' },
  
  // Middle East
  { from: 'n11', to: 'n12', strength: 0.9, type: 'same_story' },
  { from: 'n11', to: 'n21', strength: 0.4, type: 'related' },
  
  // Asia Pacific
  { from: 'n13', to: 'n14', strength: 0.6, type: 'related' },
  { from: 'n13', to: 'n10', strength: 0.7, type: 'related' },
  { from: 'n14', to: 'n15', strength: 0.5, type: 'related' },
  { from: 'n14', to: 'n8', strength: 0.45, type: 'market' },
  
  // South America
  { from: 'n18', to: 'n19', strength: 0.5, type: 'related' },
  
  // Europe energy
  { from: 'n5', to: 'n22', strength: 0.65, type: 'related' },
  
  // India tech/science
  { from: 'n23', to: 'n20', strength: 0.55, type: 'related' },
  { from: 'n23', to: 'n24', strength: 0.7, type: 'related' },
  { from: 'n24', to: 'n16', strength: 0.4, type: 'related' },
];

// Region statistics
export const MOCK_REGION_STATS: RegionStats[] = [
  { name: 'North America', lat: 45, lon: -100, storyCount: 47 },
  { name: 'Europe', lat: 54, lon: 15, storyCount: 62 },
  { name: 'Asia', lat: 35, lon: 105, storyCount: 89 },
  { name: 'Middle East', lat: 28, lon: 45, storyCount: 34 },
  { name: 'Africa', lat: 5, lon: 20, storyCount: 23 },
  { name: 'South America', lat: -15, lon: -55, storyCount: 18 },
  { name: 'Oceania', lat: -25, lon: 135, storyCount: 12 },
];

// Helper function to get time ago string
export function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Helper to get news type color
export function getNewsTypeColor(type: string): string {
  switch (type) {
    case 'breaking': return '#ef4444';
    case 'major': return '#f59e0b';
    case 'regular': return '#3b82f6';
    case 'market': return '#10b981';
    default: return '#3b82f6';
  }
}

// Helper to get category icon
export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Politics': return '🏛';
    case 'Economy': return '📈';
    case 'Technology': return '💻';
    case 'Science': return '🔬';
    case 'Conflict': return '⚠️';
    case 'Society': return '👥';
    case 'Market': return '📊';
    case 'Culture': return '🎭';
    default: return '📰';
  }
}
