import type { GlobeConfig } from './types';

export const DEFAULT_GLOBE_CONFIG: GlobeConfig = {
  radius: 5,
  segments: 64,
  autoRotateSpeed: 0.001,
  idleTimeout: 5000,
  colors: {
    background: '#0f172a',
    landmass: '#1e293b',
    ocean: '#0a0f1a',
    atmosphere: '#667eea',
    grid: '#667eea',
    breaking: '#ef4444',
    major: '#f59e0b',
    regular: '#3b82f6',
    market: '#10b981',
    connectionPrimary: '#667eea',
    connectionSecondary: '#764ba2',
    heatmapCold: '#3730a3',
    heatmapWarm: '#667eea',
    heatmapHot: '#ec4899',
  }
};

// Detailed country borders GeoJSON
export const WORLD_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [
    // Poland
    { type: "Feature" as const, properties: { name: "Poland" }, geometry: { type: "Polygon" as const, coordinates: [[[14.12, 49.00], [14.12, 54.84], [24.15, 54.84], [24.15, 49.00], [14.12, 49.00]]] } },
    // Germany
    { type: "Feature" as const, properties: { name: "Germany" }, geometry: { type: "Polygon" as const, coordinates: [[[5.87, 47.27], [5.87, 55.06], [15.04, 55.06], [15.04, 47.27], [5.87, 47.27]]] } },
    // France
    { type: "Feature" as const, properties: { name: "France" }, geometry: { type: "Polygon" as const, coordinates: [[[-5.14, 42.33], [-5.14, 51.09], [8.23, 51.09], [8.23, 42.33], [-5.14, 42.33]]] } },
    // UK
    { type: "Feature" as const, properties: { name: "UK" }, geometry: { type: "Polygon" as const, coordinates: [[[-8.17, 49.96], [-8.17, 58.64], [-2.00, 58.64], [-2.00, 49.96], [-8.17, 49.96]]] } },
    // Spain
    { type: "Feature" as const, properties: { name: "Spain" }, geometry: { type: "Polygon" as const, coordinates: [[[-9.39, 36.00], [-9.39, 43.79], [3.04, 43.79], [3.04, 36.00], [-9.39, 36.00]]] } },
    // Italy
    { type: "Feature" as const, properties: { name: "Italy" }, geometry: { type: "Polygon" as const, coordinates: [[[6.63, 36.62], [6.63, 47.12], [18.52, 47.12], [18.52, 36.62], [6.63, 36.62]]] } },
    // Russia
    { type: "Feature" as const, properties: { name: "Russia" }, geometry: { type: "Polygon" as const, coordinates: [[[19.64, 41.15], [19.64, 81.86], [169.40, 81.86], [169.40, 41.15], [19.64, 41.15]]] } },
    // Ukraine
    { type: "Feature" as const, properties: { name: "Ukraine" }, geometry: { type: "Polygon" as const, coordinates: [[[22.14, 43.39], [22.14, 52.38], [40.23, 52.38], [40.23, 43.39], [22.14, 43.39]]] } },
    // USA
    { type: "Feature" as const, properties: { name: "USA" }, geometry: { type: "Polygon" as const, coordinates: [[[-125.00, 24.52], [-125.00, 49.38], [-66.94, 49.38], [-66.94, 24.52], [-125.00, 24.52]]] } },
    // Canada
    { type: "Feature" as const, properties: { name: "Canada" }, geometry: { type: "Polygon" as const, coordinates: [[[-141.00, 41.67], [-141.00, 83.11], [-52.62, 83.11], [-52.62, 41.67], [-141.00, 41.67]]] } },
    // Mexico
    { type: "Feature" as const, properties: { name: "Mexico" }, geometry: { type: "Polygon" as const, coordinates: [[[-117.13, 14.54], [-117.13, 32.72], [-86.81, 32.72], [-86.81, 14.54], [-117.13, 14.54]]] } },
    // Brazil
    { type: "Feature" as const, properties: { name: "Brazil" }, geometry: { type: "Polygon" as const, coordinates: [[[-73.98, -33.74], [-73.98, 5.24], [-34.79, 5.24], [-34.79, -33.74], [-73.98, -33.74]]] } },
    // Argentina
    { type: "Feature" as const, properties: { name: "Argentina" }, geometry: { type: "Polygon" as const, coordinates: [[[-73.57, -55.48], [-73.57, -21.78], [-53.63, -21.78], [-53.63, -55.48], [-73.57, -55.48]]] } },
    // China
    { type: "Feature" as const, properties: { name: "China" }, geometry: { type: "Polygon" as const, coordinates: [[[73.50, 18.20], [73.50, 53.56], [135.10, 53.56], [135.10, 18.20], [73.50, 18.20]]] } },
    // Japan
    { type: "Feature" as const, properties: { name: "Japan" }, geometry: { type: "Polygon" as const, coordinates: [[[129.41, 30.40], [129.41, 45.56], [145.54, 45.56], [145.54, 30.40], [129.41, 30.40]]] } },
    // India
    { type: "Feature" as const, properties: { name: "India" }, geometry: { type: "Polygon" as const, coordinates: [[[68.18, 8.06], [68.18, 37.09], [97.41, 37.09], [97.41, 8.06], [68.18, 8.06]]] } },
    // Australia
    { type: "Feature" as const, properties: { name: "Australia" }, geometry: { type: "Polygon" as const, coordinates: [[[112.92, -44.00], [112.92, -9.24], [154.00, -9.24], [154.00, -44.00], [112.92, -44.00]]] } },
    // South Africa
    { type: "Feature" as const, properties: { name: "South Africa" }, geometry: { type: "Polygon" as const, coordinates: [[[16.34, -46.73], [16.34, -22.13], [33.02, -22.13], [33.02, -46.73], [16.34, -46.73]]] } },
    // Egypt
    { type: "Feature" as const, properties: { name: "Egypt" }, geometry: { type: "Polygon" as const, coordinates: [[[24.70, 19.47], [24.70, 31.67], [34.88, 31.67], [34.88, 19.47], [24.70, 19.47]]] } },
    // Saudi Arabia
    { type: "Feature" as const, properties: { name: "Saudi Arabia" }, geometry: { type: "Polygon" as const, coordinates: [[[34.36, 16.35], [34.36, 32.16], [55.67, 32.16], [55.67, 16.35], [34.36, 16.35]]] } },
    // Israel
    { type: "Feature" as const, properties: { name: "Israel" }, geometry: { type: "Polygon" as const, coordinates: [[[34.27, 29.45], [34.27, 33.34], [35.84, 33.34], [35.84, 29.45], [34.27, 29.45]]] } },
    // Turkey
    { type: "Feature" as const, properties: { name: "Turkey" }, geometry: { type: "Polygon" as const, coordinates: [[[26.04, 35.82], [26.04, 42.74], [44.82, 42.74], [44.82, 35.82], [26.04, 35.82]]] } },
    // Indonesia
    { type: "Feature" as const, properties: { name: "Indonesia" }, geometry: { type: "Polygon" as const, coordinates: [[[95.29, -11.01], [95.29, 6.08], [141.01, 6.08], [141.01, -11.01], [95.29, -11.01]]] } },
    // Thailand
    { type: "Feature" as const, properties: { name: "Thailand" }, geometry: { type: "Polygon" as const, coordinates: [[[97.34, 5.61], [97.34, 20.47], [105.64, 20.47], [105.64, 5.61], [97.34, 5.61]]] } },
    // Singapore
    { type: "Feature" as const, properties: { name: "Singapore" }, geometry: { type: "Polygon" as const, coordinates: [[[103.61, 1.13], [103.61, 1.47], [104.07, 1.47], [104.07, 1.13], [103.61, 1.13]]] } },
    // South Korea
    { type: "Feature" as const, properties: { name: "South Korea" }, geometry: { type: "Polygon" as const, coordinates: [[[124.63, 33.11], [124.63, 38.61], [131.87, 38.61], [131.87, 33.11], [124.63, 33.11]]] } },
    // Vietnam
    { type: "Feature" as const, properties: { name: "Vietnam" }, geometry: { type: "Polygon" as const, coordinates: [[[102.14, 8.56], [102.14, 23.39], [109.64, 23.39], [109.64, 8.56], [102.14, 8.56]]] } },
    // Nigeria
    { type: "Feature" as const, properties: { name: "Nigeria" }, geometry: { type: "Polygon" as const, coordinates: [[[2.67, 4.27], [2.67, 13.89], [14.68, 13.89], [14.68, 4.27], [2.67, 4.27]]] } },
    // Kenya
    { type: "Feature" as const, properties: { name: "Kenya" }, geometry: { type: "Polygon" as const, coordinates: [[[29.34, -4.68], [29.34, 4.72], [41.90, 4.72], [41.90, -4.68], [29.34, -4.68]]] } },
    // New Zealand
    { type: "Feature" as const, properties: { name: "New Zealand" }, geometry: { type: "Polygon" as const, coordinates: [[[166.25, -47.29], [166.25, -34.41], [178.60, -34.41], [178.60, -47.29], [166.25, -47.29]]] } },
    // Greece
    { type: "Feature" as const, properties: { name: "Greece" }, geometry: { type: "Polygon" as const, coordinates: [[[19.37, 34.80], [19.37, 41.75], [28.24, 41.75], [28.24, 34.80], [19.37, 34.80]]] } },
    // Czech Republic
    { type: "Feature" as const, properties: { name: "Czech Republic" }, geometry: { type: "Polygon" as const, coordinates: [[[12.09, 48.55], [12.09, 51.06], [18.86, 51.06], [18.86, 48.55], [12.09, 48.55]]] } },
    // Hungary
    { type: "Feature" as const, properties: { name: "Hungary" }, geometry: { type: "Polygon" as const, coordinates: [[[16.20, 45.74], [16.20, 48.63], [22.90, 48.63], [22.90, 45.74], [16.20, 45.74]]] } },
    // Romania
    { type: "Feature" as const, properties: { name: "Romania" }, geometry: { type: "Polygon" as const, coordinates: [[[20.26, 43.62], [20.26, 48.27], [29.63, 48.27], [29.63, 43.62], [20.26, 43.62]]] } },
  ]
};

// Major cities for reference points
export const MAJOR_CITIES = [
  { name: "New York", lat: 40.7128, lon: -74.0060, country: "USA" },
  { name: "London", lat: 51.5074, lon: -0.1278, country: "UK" },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, country: "Japan" },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, country: "Australia" },
  { name: "Dubai", lat: 25.2048, lon: 55.2708, country: "UAE" },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, country: "Singapore" },
  { name: "Moscow", lat: 55.7558, lon: 37.6173, country: "Russia" },
  { name: "São Paulo", lat: -23.5505, lon: -46.6333, country: "Brazil" },
  { name: "Warsaw", lat: 52.2297, lon: 21.0122, country: "Poland" },
  { name: "Berlin", lat: 52.5200, lon: 13.4050, country: "Germany" },
  { name: "Paris", lat: 48.8566, lon: 2.3522, country: "France" },
  { name: "Beijing", lat: 39.9042, lon: 116.4074, country: "China" },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777, country: "India" },
  { name: "Cairo", lat: 30.0444, lon: 31.2357, country: "Egypt" },
  { name: "Lagos", lat: 6.5244, lon: 3.3792, country: "Nigeria" },
  { name: "Kyiv", lat: 50.4501, lon: 30.5234, country: "Ukraine" },
  { name: "Tel Aviv", lat: 32.0853, lon: 34.7818, country: "Israel" },
  { name: "Hong Kong", lat: 22.3193, lon: 114.1694, country: "China" },
  { name: "Seoul", lat: 37.5665, lon: 126.9780, country: "South Korea" },
  { name: "Jakarta", lat: -6.2088, lon: 106.8456, country: "Indonesia" },
];

// Region statistics locations
export const REGION_STATS_POSITIONS = [
  { name: "North America", lat: 45, lon: -100 },
  { name: "South America", lat: -15, lon: -60 },
  { name: "Europe", lat: 50, lon: 10 },
  { name: "Africa", lat: 5, lon: 20 },
  { name: "Asia", lat: 35, lon: 100 },
  { name: "Oceania", lat: -25, lon: 135 },
];
