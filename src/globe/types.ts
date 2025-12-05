// NEXUS Globe Types
export interface NewsNode {
  id: string;
  lat: number;
  lon: number;
  title: string;
  source: string;
  category: NewsCategory;
  importance: number; // 0-1 scale
  timestamp: string;
  connections: string[];
  type: NewsType;
}

export interface Connection {
  from: string;
  to: string;
  strength: number; // 0-1 scale
  type: ConnectionType;
}

export type NewsCategory = 
  | 'Politics' 
  | 'Economy' 
  | 'Technology' 
  | 'Science' 
  | 'Conflict' 
  | 'Society' 
  | 'Market' 
  | 'Culture';

export type NewsType = 
  | 'breaking' 
  | 'major' 
  | 'regular' 
  | 'market';

export type ConnectionType = 
  | 'same_story' 
  | 'related' 
  | 'market';

export interface GlobeConfig {
  radius: number;
  segments: number;
  autoRotateSpeed: number;
  idleTimeout: number;
  colors: {
    background: string;
    landmass: string;
    ocean: string;
    atmosphere: string;
    grid: string;
    breaking: string;
    major: string;
    regular: string;
    market: string;
    connectionPrimary: string;
    connectionSecondary: string;
    heatmapCold: string;
    heatmapWarm: string;
    heatmapHot: string;
  };
}

export interface RegionStats {
  name: string;
  lat: number;
  lon: number;
  storyCount: number;
}

export interface GlobeState {
  isInteracting: boolean;
  lastInteraction: number;
  zoomLevel: 1 | 2 | 3;
  selectedNode: NewsNode | null;
  hoveredNode: NewsNode | null;
  introComplete: boolean;
}
