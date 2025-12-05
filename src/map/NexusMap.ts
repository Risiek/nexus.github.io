import './map.css';

interface City {
  name: string;
  lat: number;
  lon: number;
  size: number;
}

interface NewsNode {
  id: string;
  lat: number;
  lon: number;
  title: string;
  type: 'breaking' | 'major' | 'regular' | 'market';
  category: string;
  time: string;
}

export class NexusMap {
  private container: HTMLElement;
  private svg!: SVGSVGElement;
  private mapGroup!: SVGGElement;
  private citiesGroup!: SVGGElement;
  private nodesGroup!: SVGGElement;
  private connectionsGroup!: SVGGElement;
  private width: number = 800;
  private height: number = 450;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private translateX = 0;
  private translateY = 0;
  private scale = 1;
  private tooltip: HTMLElement | null = null;

  private cities: City[] = [
    // Europe
    { name: 'Warszawa', lat: 52.2297, lon: 21.0122, size: 1.4 },
    { name: 'Berlin', lat: 52.5200, lon: 13.4050, size: 1.4 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522, size: 1.6 },
    { name: 'London', lat: 51.5074, lon: -0.1278, size: 1.6 },
    { name: 'Rome', lat: 41.9028, lon: 12.4964, size: 1.3 },
    { name: 'Madrid', lat: 40.4168, lon: -3.7038, size: 1.4 },
    { name: 'Moscow', lat: 55.7558, lon: 37.6173, size: 1.5 },
    { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, size: 1.1 },
    { name: 'Vienna', lat: 48.2082, lon: 16.3738, size: 1.1 },
    { name: 'Prague', lat: 50.0755, lon: 14.4378, size: 1.1 },
    { name: 'Stockholm', lat: 59.3293, lon: 18.0686, size: 1.1 },
    { name: 'Kyiv', lat: 50.4501, lon: 30.5234, size: 1.3 },
    // Americas
    { name: 'New York', lat: 40.7128, lon: -74.0060, size: 1.8 },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, size: 1.5 },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298, size: 1.3 },
    { name: 'Toronto', lat: 43.6532, lon: -79.3832, size: 1.3 },
    { name: 'Mexico City', lat: 19.4326, lon: -99.1332, size: 1.4 },
    { name: 'São Paulo', lat: -23.5505, lon: -46.6333, size: 1.6 },
    { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, size: 1.3 },
    // Asia
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, size: 1.8 },
    { name: 'Beijing', lat: 39.9042, lon: 116.4074, size: 1.7 },
    { name: 'Shanghai', lat: 31.2304, lon: 121.4737, size: 1.6 },
    { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, size: 1.4 },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198, size: 1.3 },
    { name: 'Seoul', lat: 37.5665, lon: 126.9780, size: 1.5 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777, size: 1.5 },
    { name: 'Dubai', lat: 25.2048, lon: 55.2708, size: 1.3 },
    { name: 'Bangkok', lat: 13.7563, lon: 100.5018, size: 1.3 },
    // Africa
    { name: 'Cairo', lat: 30.0444, lon: 31.2357, size: 1.4 },
    { name: 'Lagos', lat: 6.5244, lon: 3.3792, size: 1.4 },
    { name: 'Johannesburg', lat: -26.2041, lon: 28.0473, size: 1.2 },
    // Oceania
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, size: 1.4 },
    { name: 'Melbourne', lat: -37.8136, lon: 144.9631, size: 1.2 },
  ];

  private newsNodes: NewsNode[] = [
    { id: '1', lat: 52.2297, lon: 21.0122, title: 'Sejm przyjął nową ustawę energetyczną', type: 'breaking', category: 'Polityka', time: '12 min' },
    { id: '2', lat: 50.0755, lon: 14.4378, title: 'Szczyt UE w Pradze zakończony', type: 'major', category: 'Dyplomacja', time: '34 min' },
    { id: '3', lat: 40.7128, lon: -74.0060, title: 'Wall Street: indeksy w górę', type: 'market', category: 'Finanse', time: '8 min' },
    { id: '4', lat: 35.6762, lon: 139.6503, title: 'Nowy przełom w AI z Tokio', type: 'regular', category: 'Technologia', time: '1 godz' },
    { id: '5', lat: 51.5074, lon: -0.1278, title: 'UK: Nowe regulacje handlowe', type: 'major', category: 'Gospodarka', time: '45 min' },
    { id: '6', lat: 48.8566, lon: 2.3522, title: 'Francja: reforma emerytalna', type: 'breaking', category: 'Społeczeństwo', time: '5 min' },
    { id: '7', lat: 39.9042, lon: 116.4074, title: 'Chiny: nowa polityka klimatyczna', type: 'major', category: 'Środowisko', time: '2 godz' },
    { id: '8', lat: -23.5505, lon: -46.6333, title: 'Brazylia: wzrost PKB', type: 'regular', category: 'Gospodarka', time: '3 godz' },
  ];

  constructor(container: HTMLElement) {
    this.container = container;
    requestAnimationFrame(() => this.init());
  }

  private init(): void {
    this.updateDimensions();
    this.createSVG();
    this.loadCountries();
    this.createConnections();
    this.createCities();
    this.createNewsNodes();
    this.setupEventListeners();
  }

  private updateDimensions(): void {
    this.width = this.container.clientWidth || 800;
    this.height = this.container.clientHeight || 450;
  }

  private createSVG(): void {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    this.svg.setAttribute('class', 'nexus-map-svg');
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    
    // Defs for gradients
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0a0a0a" />
        <stop offset="100%" stop-color="#0f0f0f" />
      </linearGradient>
    `;
    this.svg.appendChild(defs);
    
    // Background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', 'url(#bgGradient)');
    this.svg.appendChild(bg);
    
    // Main map group
    this.mapGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.mapGroup.setAttribute('class', 'map-group');
    this.svg.appendChild(this.mapGroup);
    
    // Connections layer
    this.connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.connectionsGroup.setAttribute('class', 'connections-group');
    this.mapGroup.appendChild(this.connectionsGroup);
    
    // Cities layer
    this.citiesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.citiesGroup.setAttribute('class', 'cities-group');
    this.mapGroup.appendChild(this.citiesGroup);
    
    // News nodes layer
    this.nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.nodesGroup.setAttribute('class', 'nodes-group');
    this.mapGroup.appendChild(this.nodesGroup);
    
    this.container.appendChild(this.svg);
  }

  private async loadCountries(): Promise<void> {
    try {
      const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      const topology = await response.json();
      const topojson = await import('topojson-client');
      const countries = topojson.feature(topology, topology.objects.countries);
      this.drawCountries(countries as any);
    } catch (error) {
      console.error('Failed to load countries:', error);
    }
  }

  private drawCountries(geojson: any): void {
    const countriesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    countriesGroup.setAttribute('class', 'countries-group');
    
    geojson.features.forEach((feature: any) => {
      if (!feature.geometry) return;
      
      const paths = this.geometryToPath(feature.geometry);
      paths.forEach(d => {
        if (!d || d.length < 10) return; // Skip empty or tiny paths
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'country');
        countriesGroup.appendChild(path);
      });
    });
    
    this.mapGroup.insertBefore(countriesGroup, this.connectionsGroup);
  }

  private geometryToPath(geometry: any): string[] {
    const paths: string[] = [];
    
    if (geometry.type === 'Polygon') {
      paths.push(this.ringToPath(geometry.coordinates[0]));
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygon: number[][][]) => {
        paths.push(this.ringToPath(polygon[0]));
      });
    }
    
    return paths;
  }

  private ringToPath(ring: number[][]): string {
    if (ring.length < 3) return '';
    
    const segments: string[][] = [];
    let currentSegment: string[] = [];
    
    for (let i = 0; i < ring.length; i++) {
      const coord = ring[i];
      const [x, y] = this.latLonToXY(coord[1], coord[0]);
      
      // Check if we're crossing the antimeridian
      if (i > 0) {
        const prevLon = ring[i - 1][0];
        const currLon = coord[0];
        
        // If longitude jump is > 180, we crossed the antimeridian
        if (Math.abs(currLon - prevLon) > 180) {
          // End current segment and start new one
          if (currentSegment.length > 1) {
            segments.push(currentSegment);
          }
          currentSegment = [];
        }
      }
      
      currentSegment.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    
    // Add last segment
    if (currentSegment.length > 1) {
      segments.push(currentSegment);
    }
    
    // Build path from all segments
    return segments
      .filter(seg => seg.length > 2)
      .map(seg => `M${seg.join('L')}`)
      .join(' ');
  }

  private latLonToXY(lat: number, lon: number): [number, number] {
    // Miller cylindrical projection - less distortion than equirectangular
    const x = ((lon + 180) / 360) * this.width;
    
    // Miller projection formula
    const latRad = lat * Math.PI / 180;
    const millerLat = 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * latRad));
    
    // Normalize to height (Miller range is approximately -2.3 to 2.3)
    const y = (this.height / 2) - (millerLat * this.height / 5.3);
    
    return [x, Math.max(10, Math.min(this.height - 10, y))];
  }

  private createCities(): void {
    this.cities.forEach(city => {
      const [x, y] = this.latLonToXY(city.lat, city.lon);
      
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', String(x));
      dot.setAttribute('cy', String(y));
      dot.setAttribute('r', String(1.5 * city.size));
      dot.setAttribute('class', 'city-dot');
      
      this.citiesGroup.appendChild(dot);
    });
  }

  private createNewsNodes(): void {
    this.newsNodes.forEach(node => {
      const [x, y] = this.latLonToXY(node.lat, node.lon);
      
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', `news-node node-${node.type}`);
      group.setAttribute('transform', `translate(${x}, ${y})`);
      
      // Outer ring
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('r', '8');
      ring.setAttribute('class', 'node-ring');
      group.appendChild(ring);
      
      // Inner dot
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', '4');
      dot.setAttribute('class', 'node-dot');
      group.appendChild(dot);
      
      // Prevent drag when interacting with nodes
      group.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      
      // Events
      group.addEventListener('mouseenter', (e) => this.showTooltip(node, e));
      group.addEventListener('mouseleave', () => this.hideTooltip());
      group.addEventListener('click', () => this.selectNode(node));
      
      this.nodesGroup.appendChild(group);
    });
  }

  private createConnections(): void {
    const connections = [
      ['1', '2'],
      ['5', '6'],
      ['3', '7'],
    ];

    connections.forEach(([fromId, toId]) => {
      const fromNode = this.newsNodes.find(n => n.id === fromId);
      const toNode = this.newsNodes.find(n => n.id === toId);
      
      if (fromNode && toNode) {
        const [x1, y1] = this.latLonToXY(fromNode.lat, fromNode.lon);
        const [x2, y2] = this.latLonToXY(toNode.lat, toNode.lon);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(x1));
        line.setAttribute('y1', String(y1));
        line.setAttribute('x2', String(x2));
        line.setAttribute('y2', String(y2));
        line.setAttribute('class', 'connection-line');
        
        this.connectionsGroup.appendChild(line);
      }
    });
  }

  private showTooltip(node: NewsNode, _e: MouseEvent): void {
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'map-tooltip';
      this.container.appendChild(this.tooltip);
    }

    this.tooltip.innerHTML = `
      <div class="tooltip-category">${node.category}</div>
      <div class="tooltip-title">${node.title}</div>
      <div class="tooltip-time">${node.time} temu</div>
    `;
    
    // Get node position on screen
    const [nodeX, nodeY] = this.latLonToXY(node.lat, node.lon);
    
    // Calculate position with current transform
    const scaledX = nodeX * this.scale + this.translateX;
    const scaledY = nodeY * this.scale + this.translateY;
    
    // Position tooltip to the right of the node
    this.tooltip.style.left = `${scaledX + 20}px`;
    this.tooltip.style.top = `${scaledY - 20}px`;
    this.tooltip.classList.add('visible');
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
    }
  }

  private selectNode(node: NewsNode): void {
    const event = new CustomEvent('nodeSelected', { detail: node });
    this.container.dispatchEvent(event);
  }

  private setupEventListeners(): void {
    // Pan - anywhere on the map
    this.svg.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.startX = e.clientX - this.translateX;
      this.startY = e.clientY - this.translateY;
      this.svg.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      let newTranslateX = e.clientX - this.startX;
      let newTranslateY = e.clientY - this.startY;
      
      // Calculate bounds based on scale
      const scaledWidth = this.width * this.scale;
      const scaledHeight = this.height * this.scale;
      
      // Limit panning so map edges stay within container
      const maxX = (scaledWidth - this.width) / 2;
      const maxY = (scaledHeight - this.height) / 2;
      
      newTranslateX = Math.max(-maxX, Math.min(maxX, newTranslateX));
      newTranslateY = Math.max(-maxY, Math.min(maxY, newTranslateY));
      
      this.translateX = newTranslateX;
      this.translateY = newTranslateY;
      this.updateTransform();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.svg.style.cursor = 'grab';
    });

    // Smooth zoom with easing
    let targetScale = this.scale;
    let isZooming = false;
    
    const animateZoom = () => {
      const diff = targetScale - this.scale;
      if (Math.abs(diff) > 0.001) {
        this.scale += diff * 0.15; // Easing factor
        this.updateTransform();
        requestAnimationFrame(animateZoom);
      } else {
        this.scale = targetScale;
        this.updateTransform();
        isZooming = false;
      }
    };

    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.85 : 1.18;
      // Min scale 1.0 = map fits container, max 4x zoom
      targetScale = Math.max(1.0, Math.min(4, targetScale * delta));
      
      if (!isZooming) {
        isZooming = true;
        requestAnimationFrame(animateZoom);
      }
    }, { passive: false });

    window.addEventListener('resize', () => {
      this.updateDimensions();
      this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    });
  }

  private updateTransform(): void {
    this.mapGroup.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    this.mapGroup.style.transformOrigin = 'center center';
  }

  public destroy(): void {
    if (this.tooltip) {
      this.tooltip.remove();
    }
    this.svg.remove();
  }
}
