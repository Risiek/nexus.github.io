import * as THREE from 'three';
import { gsap } from 'gsap';
import * as topojson from 'topojson-client';
import type { NewsNode, Connection, GlobeState } from './types';
import { DEFAULT_GLOBE_CONFIG } from './config';
import { MOCK_NEWS_NODES, MOCK_CONNECTIONS, getTimeAgo, getNewsTypeColor, getCategoryIcon } from './mockData';

export class NexusGlobe {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private globe!: THREE.Group;
  private globeMesh!: THREE.Mesh;
  private atmosphere!: THREE.Mesh;
  private countriesGroup!: THREE.Group;
  private countriesData: any = null;
  private newsNodes: Map<string, THREE.Group> = new Map();
  private connectionLines: THREE.Line[] = [];
  private particleSystems: THREE.Points[] = [];
  private heatmapMesh!: THREE.Mesh;
  private gridLines!: THREE.LineSegments;
  private starField!: THREE.Points;
  
  private state: GlobeState = {
    isInteracting: false,
    lastInteraction: Date.now(),
    zoomLevel: 1,
    selectedNode: null,
    hoveredNode: null,
    introComplete: false
  };
  
  private config = DEFAULT_GLOBE_CONFIG;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private targetRotation = { x: 0, y: 0 };
  private momentum = { x: 0, y: 0 };
  private animationId: number = 0;
  
  private tooltip!: HTMLElement;
  private overlay!: HTMLElement;
  
  constructor(container: HTMLElement) {
    this.container = container;
    // Wait for next frame to ensure container has proper dimensions
    requestAnimationFrame(() => {
      this.init();
    });
  }
  
  private init(): void {
    // Ensure we have valid dimensions
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 400;
    
    console.log('Globe container dimensions:', width, 'x', height);
    
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createLighting();
    this.createStarField();
    this.createGlobe();
    this.createCountries();
    this.createAtmosphere();
    this.createGridLines();
    this.createHeatmap();
    this.createNewsNodes();
    this.createConnections();
    this.createUI();
    this.setupEventListeners();
    this.startAnimation();
    this.playIntroSequence();
    
    // Force resize after initialization
    setTimeout(() => this.onResize(), 100);
  }
  
  private createScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.colors.background);
    
    // Add fog for depth
    this.scene.fog = new THREE.FogExp2(this.config.colors.background, 0.015);
  }
  
  private createCamera(): void {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 450;
    const aspect = width / height;
    
    // Use FOV of 50 for more natural view
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 18);
    this.camera.lookAt(0, 0, 0);
    
    console.log('Camera aspect:', aspect, 'FOV: 50');
  }

  private createRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);
  }  private createLighting(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x404050, 0.4);
    this.scene.add(ambient);
    
    // Sun light (directional)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(50, 30, 50);
    this.scene.add(sunLight);
    
    // Rim light (purple accent)
    const rimLight = new THREE.DirectionalLight(0x8b7aff, 0.8);
    rimLight.position.set(-30, 0, -30);
    this.scene.add(rimLight);
    
    // Hemisphere light for ambient variation
    const hemiLight = new THREE.HemisphereLight(0x667eea, 0x0a0f1a, 0.5);
    this.scene.add(hemiLight);
  }
  
  private createStarField(): void {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const radius = 100 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      sizes[i] = Math.random() * 2 + 0.5;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    
    this.starField = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.starField);
  }
  
  private createGlobe(): void {
    this.globe = new THREE.Group();
    
    // Ocean sphere
    const oceanGeometry = new THREE.SphereGeometry(
      this.config.radius * 0.99, 
      this.config.segments, 
      this.config.segments
    );
    const oceanMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(this.config.colors.ocean),
      transparent: true,
      opacity: 0.95,
      shininess: 25
    });
    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    this.globe.add(ocean);
    
    // Main globe sphere (for landmass)
    const globeGeometry = new THREE.SphereGeometry(
      this.config.radius, 
      this.config.segments, 
      this.config.segments
    );
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(this.config.colors.landmass),
      transparent: true,
      opacity: 0.4,
      shininess: 10
    });
    this.globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    this.globe.add(this.globeMesh);
    
    this.scene.add(this.globe);
  }

  private createCountries(): void {
    this.countriesGroup = new THREE.Group();
    this.globe.add(this.countriesGroup);
    
    // Load countries data via fetch
    this.loadCountriesData();
  }
  
  private async loadCountriesData(): Promise<void> {
    try {
      // Fetch TopoJSON data from CDN
      const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      this.countriesData = await response.json();
      
      // Convert TopoJSON to GeoJSON
      const countries = topojson.feature(this.countriesData, this.countriesData.objects.countries) as any;
      
      const countryMaterial = new THREE.LineBasicMaterial({
        color: 0x667eea, // Purple color matching theme
        transparent: true,
        opacity: 0.8,
        linewidth: 1
      });
      
      // Draw each country
      countries.features.forEach((country: any) => {
        if (!country.geometry) return;
        
        const geometryType = country.geometry.type;
        let coordinates: number[][][] = [];
        
        if (geometryType === 'Polygon') {
          coordinates = [country.geometry.coordinates[0]];
        } else if (geometryType === 'MultiPolygon') {
          coordinates = country.geometry.coordinates.map((poly: number[][][]) => poly[0]);
        }
        
        coordinates.forEach((ring: number[][]) => {
          const points: THREE.Vector3[] = [];
          
          ring.forEach((coord: number[]) => {
            const lon = coord[0];
            const lat = coord[1];
            const pos = this.latLonToVector3(lat, lon, this.config.radius * 1.005);
            points.push(pos);
          });
          
          if (points.length > 2) {
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, countryMaterial);
            this.countriesGroup.add(line);
          }
        });
      });
      
      console.log('Countries loaded:', this.countriesGroup.children.length, 'borders');
      
      // Also create cities after countries load
      this.createCities();
    } catch (error) {
      console.error('Failed to load countries data:', error);
    }
  }
  
  private citiesGroup!: THREE.Group;
  
  private createCities(): void {
    this.citiesGroup = new THREE.Group();
    
    // Major world cities with coordinates
    const cities = [
      // Europe
      { name: 'Warszawa', lat: 52.2297, lon: 21.0122, size: 1.5 },
      { name: 'Berlin', lat: 52.5200, lon: 13.4050, size: 1.5 },
      { name: 'Paris', lat: 48.8566, lon: 2.3522, size: 1.8 },
      { name: 'London', lat: 51.5074, lon: -0.1278, size: 1.8 },
      { name: 'Rome', lat: 41.9028, lon: 12.4964, size: 1.4 },
      { name: 'Madrid', lat: 40.4168, lon: -3.7038, size: 1.5 },
      { name: 'Moscow', lat: 55.7558, lon: 37.6173, size: 1.6 },
      { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, size: 1.2 },
      { name: 'Vienna', lat: 48.2082, lon: 16.3738, size: 1.2 },
      { name: 'Prague', lat: 50.0755, lon: 14.4378, size: 1.2 },
      // Americas
      { name: 'New York', lat: 40.7128, lon: -74.0060, size: 1.8 },
      { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, size: 1.5 },
      { name: 'Chicago', lat: 41.8781, lon: -87.6298, size: 1.3 },
      { name: 'Toronto', lat: 43.6532, lon: -79.3832, size: 1.3 },
      { name: 'Mexico City', lat: 19.4326, lon: -99.1332, size: 1.5 },
      { name: 'São Paulo', lat: -23.5505, lon: -46.6333, size: 1.6 },
      { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, size: 1.3 },
      // Asia
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503, size: 1.8 },
      { name: 'Beijing', lat: 39.9042, lon: 116.4074, size: 1.7 },
      { name: 'Shanghai', lat: 31.2304, lon: 121.4737, size: 1.7 },
      { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, size: 1.4 },
      { name: 'Singapore', lat: 1.3521, lon: 103.8198, size: 1.3 },
      { name: 'Seoul', lat: 37.5665, lon: 126.9780, size: 1.5 },
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777, size: 1.6 },
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
    
    cities.forEach(city => {
      const pos = this.latLonToVector3(city.lat, city.lon, this.config.radius * 1.01);
      
      // City dot - bright white core
      const dotGeometry = new THREE.SphereGeometry(0.05 * city.size, 12, 12);
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0
      });
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.position.copy(pos);
      this.citiesGroup.add(dot);
      
      // City glow - larger purple halo
      const glowGeometry = new THREE.SphereGeometry(0.12 * city.size, 12, 12);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x667eea,
        transparent: true,
        opacity: 0.5
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(pos);
      this.citiesGroup.add(glow);
    });
    
    // Add cities to globe so they rotate with it
    this.globe.add(this.citiesGroup);
    console.log('Cities loaded:', cities.length, 'cities added to globe');
  }
  
  private createAtmosphere(): void {
    // Inner glow
    const innerGlowGeometry = new THREE.SphereGeometry(
      this.config.radius * 1.01,
      this.config.segments,
      this.config.segments
    );
    
    const innerGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(this.config.colors.atmosphere) },
        viewVector: { value: this.camera.position },
        c: { value: 0.4 },
        p: { value: 4.0 }
      },
      vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(c - dot(vNormal, vNormel), p);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity * 0.6);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    
    this.atmosphere = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    this.atmosphere.scale.multiplyScalar(1.15);
    this.globe.add(this.atmosphere);
    
    // Outer corona
    const coronaGeometry = new THREE.SphereGeometry(
      this.config.radius * 1.02,
      32,
      32
    );
    const coronaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x8b7aff) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(glowColor, intensity * 0.4);
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    corona.scale.multiplyScalar(1.3);
    this.globe.add(corona);
  }
  
  private createGridLines(): void {
    const gridMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(this.config.colors.grid),
      transparent: true,
      opacity: 0.1
    });
    
    const gridGeometry = new THREE.BufferGeometry();
    const gridPoints: number[] = [];
    
    // Latitude lines
    for (let lat = -80; lat <= 80; lat += 20) {
      const latRad = (lat * Math.PI) / 180;
      const radius = this.config.radius * 1.001;
      
      for (let lon = 0; lon <= 360; lon += 5) {
        const lonRad = (lon * Math.PI) / 180;
        const nextLonRad = ((lon + 5) * Math.PI) / 180;
        
        gridPoints.push(
          radius * Math.cos(latRad) * Math.cos(lonRad),
          radius * Math.sin(latRad),
          radius * Math.cos(latRad) * Math.sin(lonRad)
        );
        gridPoints.push(
          radius * Math.cos(latRad) * Math.cos(nextLonRad),
          radius * Math.sin(latRad),
          radius * Math.cos(latRad) * Math.sin(nextLonRad)
        );
      }
    }
    
    // Longitude lines
    for (let lon = 0; lon < 360; lon += 30) {
      const lonRad = (lon * Math.PI) / 180;
      const radius = this.config.radius * 1.001;
      
      for (let lat = -90; lat < 90; lat += 5) {
        const latRad = (lat * Math.PI) / 180;
        const nextLatRad = ((lat + 5) * Math.PI) / 180;
        
        gridPoints.push(
          radius * Math.cos(latRad) * Math.cos(lonRad),
          radius * Math.sin(latRad),
          radius * Math.cos(latRad) * Math.sin(lonRad)
        );
        gridPoints.push(
          radius * Math.cos(nextLatRad) * Math.cos(lonRad),
          radius * Math.sin(nextLatRad),
          radius * Math.cos(nextLatRad) * Math.sin(lonRad)
        );
      }
    }
    
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
    this.gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
    this.globe.add(this.gridLines);
  }

  private createHeatmap(): void {
    // Create heatmap as a sprite-based overlay
    const heatmapGeometry = new THREE.SphereGeometry(
      this.config.radius * 1.003,
      64,
      64
    );
    
    // Create heatmap texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Create gradient heatmap based on news density
    const imageData = ctx.createImageData(512, 256);
    
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 512; x++) {
        const lon = (x / 512) * 360 - 180;
        const lat = 90 - (y / 256) * 180;
        
        // Calculate heat based on proximity to news nodes
        let heat = 0;
        MOCK_NEWS_NODES.forEach(node => {
          const dist = Math.sqrt(
            Math.pow(node.lon - lon, 2) + 
            Math.pow(node.lat - lat, 2)
          );
          heat += Math.max(0, 1 - dist / 40) * node.importance;
        });
        
        heat = Math.min(heat, 1);
        
        const idx = (y * 512 + x) * 4;
        
        // Color gradient: cold purple -> warm purple -> hot magenta
        if (heat < 0.33) {
          // Cold: deep purple
          imageData.data[idx] = 55;     // R
          imageData.data[idx + 1] = 48; // G
          imageData.data[idx + 2] = 163; // B
        } else if (heat < 0.66) {
          // Warm: NEXUS purple
          imageData.data[idx] = 102;
          imageData.data[idx + 1] = 126;
          imageData.data[idx + 2] = 234;
        } else {
          // Hot: magenta
          imageData.data[idx] = 236;
          imageData.data[idx + 1] = 72;
          imageData.data[idx + 2] = 153;
        }
        
        imageData.data[idx + 3] = Math.floor(heat * 80); // Alpha
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const heatmapTexture = new THREE.CanvasTexture(canvas);
    const heatmapMaterial = new THREE.MeshBasicMaterial({
      map: heatmapTexture,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    
    this.heatmapMesh = new THREE.Mesh(heatmapGeometry, heatmapMaterial);
    this.heatmapMesh.visible = true;
    this.globe.add(this.heatmapMesh);
  }
  
  private createNewsNodes(): void {
    MOCK_NEWS_NODES.forEach((node, index) => {
      const nodeGroup = this.createNewsNode(node);
      nodeGroup.userData = { ...node, index };
      this.newsNodes.set(node.id, nodeGroup);
      this.globe.add(nodeGroup);
    });
  }
  
  private createNewsNode(node: NewsNode): THREE.Group {
    const group = new THREE.Group();
    const position = this.latLonToVector3(node.lat, node.lon, this.config.radius * 1.01);
    group.position.copy(position);
    
    const color = new THREE.Color(getNewsTypeColor(node.type));
    const size = 0.05 + node.importance * 0.08;
    
    // Core sphere
    const coreGeometry = new THREE.SphereGeometry(size, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Outer glow
    const glowGeometry = new THREE.SphereGeometry(size * 1.8, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    // Pulse rings
    for (let i = 0; i < 2; i++) {
      const ringGeometry = new THREE.RingGeometry(size * 1.5, size * 1.8, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.userData = { isPulseRing: true, pulsePhase: i * Math.PI };
      
      // Orient ring to face outward from globe center
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      group.add(ring);
    }
    
    // Particle system for sparks
    const particleCount = node.type === 'breaking' ? 20 : 10;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * size * 2;
      particlePositions[i * 3 + 1] = Math.random() * size * 3;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * size * 2;
      
      particleVelocities[i * 3] = (Math.random() - 0.5) * 0.01;
      particleVelocities[i * 3 + 1] = Math.random() * 0.02 + 0.01;
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.userData = { velocities: particleVelocities };
    
    const particleMaterial = new THREE.PointsMaterial({
      color: color,
      size: 0.03,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.userData = { isParticleSystem: true };
    group.add(particles);
    
    return group;
  }
  
  private createConnections(): void {
    MOCK_CONNECTIONS.forEach(connection => {
      const fromNode = MOCK_NEWS_NODES.find(n => n.id === connection.from);
      const toNode = MOCK_NEWS_NODES.find(n => n.id === connection.to);
      
      if (fromNode && toNode) {
        const line = this.createConnectionLine(fromNode, toNode, connection);
        this.connectionLines.push(line);
        this.globe.add(line);
      }
    });
  }
  
  private createConnectionLine(from: NewsNode, to: NewsNode, connection: Connection): THREE.Line {
    const fromPos = this.latLonToVector3(from.lat, from.lon, this.config.radius * 1.02);
    const toPos = this.latLonToVector3(to.lat, to.lon, this.config.radius * 1.02);
    
    // Calculate arc midpoint
    const midPoint = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
    const distance = fromPos.distanceTo(toPos);
    midPoint.normalize().multiplyScalar(this.config.radius * 1.02 + distance * 0.15);
    
    // Create bezier curve
    const curve = new THREE.QuadraticBezierCurve3(fromPos, midPoint, toPos);
    const points = curve.getPoints(50);
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create gradient color
    const colors: number[] = [];
    const color1 = new THREE.Color(this.config.colors.connectionPrimary);
    const color2 = new THREE.Color(this.config.colors.connectionSecondary);
    
    for (let i = 0; i < points.length; i++) {
      const t = i / (points.length - 1);
      const color = color1.clone().lerp(color2, t);
      colors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.3 + connection.strength * 0.3,
      linewidth: connection.type === 'same_story' ? 3 : 1
    });
    
    // Dashed lines for market connections handled via LineDashedMaterial
    if (connection.type === 'market') {
      (lineMaterial as any).dashSize = 0.1;
      (lineMaterial as any).gapSize = 0.05;
    }
    
    const line = new THREE.Line(geometry, lineMaterial);
    line.userData = { connection, curve };
    
    // Add flowing particles along the connection
    this.createConnectionParticles(curve, connection);
    
    return line;
  }
  
  private createConnectionParticles(curve: THREE.QuadraticBezierCurve3, connection: Connection): void {
    const particleCount = Math.floor(5 + connection.strength * 10);
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      phases[i] = Math.random();
      const point = curve.getPoint(phases[i]);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.userData = { curve, phases };
    
    const particleMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(this.config.colors.connectionPrimary),
      size: 0.04,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.userData = { isConnectionParticle: true };
    this.particleSystems.push(particles);
    this.globe.add(particles);
  }
  
  private createUI(): void {
    // Create tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'globe-tooltip';
    this.tooltip.innerHTML = `
      <div class="tooltip-content">
        <div class="tooltip-header">
          <span class="tooltip-category"></span>
          <span class="tooltip-time"></span>
        </div>
        <h4 class="tooltip-title"></h4>
        <p class="tooltip-source"></p>
        <span class="tooltip-cta">Click to read →</span>
      </div>
    `;
    this.tooltip.style.cssText = `
      position: absolute;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 100;
      max-width: 280px;
    `;
    this.container.appendChild(this.tooltip);
    
    // Create overlay for controls
    this.overlay = document.createElement('div');
    this.overlay.className = 'globe-overlay';
    this.overlay.innerHTML = `
      <div class="globe-controls">
        <button class="globe-btn zoom-in" title="Zoom In">+</button>
        <button class="globe-btn zoom-out" title="Zoom Out">−</button>
        <button class="globe-btn toggle-heatmap active" title="Toggle Heatmap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
            <path d="M2 12h20"></path>
          </svg>
        </button>
        <button class="globe-btn toggle-connections active" title="Toggle Connections">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15,3 21,3 21,9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
      </div>
      <div class="globe-legend">
        <div class="legend-item"><span class="legend-dot breaking"></span>Breaking</div>
        <div class="legend-item"><span class="legend-dot major"></span>Major</div>
        <div class="legend-item"><span class="legend-dot regular"></span>Regular</div>
        <div class="legend-item"><span class="legend-dot market"></span>Market</div>
      </div>
    `;
    this.container.appendChild(this.overlay);
    
    // Setup control event listeners
    this.setupControlListeners();
  }
  
  private setupControlListeners(): void {
    const zoomIn = this.overlay.querySelector('.zoom-in');
    const zoomOut = this.overlay.querySelector('.zoom-out');
    const toggleHeatmap = this.overlay.querySelector('.toggle-heatmap');
    const toggleConnections = this.overlay.querySelector('.toggle-connections');
    
    zoomIn?.addEventListener('click', () => this.zoom(1));
    zoomOut?.addEventListener('click', () => this.zoom(-1));
    
    toggleHeatmap?.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLElement;
      btn.classList.toggle('active');
      this.heatmapMesh.visible = btn.classList.contains('active');
    });
    
    toggleConnections?.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLElement;
      btn.classList.toggle('active');
      const visible = btn.classList.contains('active');
      this.connectionLines.forEach(line => line.visible = visible);
      this.particleSystems.forEach(ps => ps.visible = visible);
    });
  }
  
  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;
    
    // Mouse events
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this));
    
    // Touch events
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
    
    // Window resize
    window.addEventListener('resize', this.onResize.bind(this));
    
    // Click for node selection
    canvas.addEventListener('click', this.onClick.bind(this));
  }
  
  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.state.isInteracting = true;
    this.state.lastInteraction = Date.now();
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
    this.momentum = { x: 0, y: 0 };
  }
  
  private onMouseMove(event: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    if (this.isDragging) {
      const deltaX = event.clientX - this.previousMousePosition.x;
      const deltaY = event.clientY - this.previousMousePosition.y;
      
      this.targetRotation.y += deltaX * 0.005;
      this.targetRotation.x += deltaY * 0.005;
      
      // Clamp X rotation
      this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
      
      // Store momentum
      this.momentum.x = deltaY * 0.002;
      this.momentum.y = deltaX * 0.002;
      
      this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }
    
    // Check for hover
    this.checkHover(event);
  }
  
  private onMouseUp(): void {
    this.isDragging = false;
    this.state.lastInteraction = Date.now();
  }
  
  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.state.isInteracting = true;
    this.state.lastInteraction = Date.now();
    
    const zoomDelta = event.deltaY > 0 ? -1 : 1;
    this.zoom(zoomDelta * 0.3);
  }
  
  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.state.isInteracting = true;
      this.state.lastInteraction = Date.now();
      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    }
  }
  
  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    if (event.touches.length === 1 && this.isDragging) {
      const deltaX = event.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = event.touches[0].clientY - this.previousMousePosition.y;
      
      this.targetRotation.y += deltaX * 0.005;
      this.targetRotation.x += deltaY * 0.005;
      
      this.targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotation.x));
      
      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    } else if (event.touches.length === 2) {
      // Pinch to zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if ((event as any).previousPinchDist) {
        const delta = dist - (event as any).previousPinchDist;
        this.zoom(delta * 0.01);
      }
      (event as any).previousPinchDist = dist;
    }
  }
  
  private onTouchEnd(): void {
    this.isDragging = false;
    this.state.lastInteraction = Date.now();
  }
  
  private onClick(event: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const nodeObjects = Array.from(this.newsNodes.values());
    const intersects = this.raycaster.intersectObjects(nodeObjects, true);
    
    if (intersects.length > 0) {
      let parent = intersects[0].object;
      while (parent.parent && !parent.userData.id) {
        parent = parent.parent as THREE.Object3D;
      }
      
      if (parent.userData.id) {
        this.selectNode(parent.userData as NewsNode);
      }
    }
  }
  
  private checkHover(event: MouseEvent): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const nodeObjects = Array.from(this.newsNodes.values());
    const intersects = this.raycaster.intersectObjects(nodeObjects, true);
    
    if (intersects.length > 0) {
      let parent = intersects[0].object;
      while (parent.parent && !parent.userData.id) {
        parent = parent.parent as THREE.Object3D;
      }
      
      if (parent.userData.id) {
        this.showTooltip(parent.userData as NewsNode, event);
        this.state.hoveredNode = parent.userData as NewsNode;
        this.container.style.cursor = 'pointer';
        return;
      }
    }
    
    this.hideTooltip();
    this.state.hoveredNode = null;
    this.container.style.cursor = 'grab';
  }
  
  private showTooltip(node: NewsNode, event: MouseEvent): void {
    const category = this.tooltip.querySelector('.tooltip-category') as HTMLElement;
    const time = this.tooltip.querySelector('.tooltip-time') as HTMLElement;
    const title = this.tooltip.querySelector('.tooltip-title') as HTMLElement;
    const source = this.tooltip.querySelector('.tooltip-source') as HTMLElement;
    
    category.textContent = `${getCategoryIcon(node.category)} ${node.category}`;
    category.style.color = getNewsTypeColor(node.type);
    time.textContent = getTimeAgo(node.timestamp);
    title.textContent = node.title;
    source.textContent = node.source;
    
    const rect = this.container.getBoundingClientRect();
    this.tooltip.style.left = `${event.clientX - rect.left + 15}px`;
    this.tooltip.style.top = `${event.clientY - rect.top + 15}px`;
    this.tooltip.style.opacity = '1';
  }
  
  private hideTooltip(): void {
    this.tooltip.style.opacity = '0';
  }
  
  private selectNode(node: NewsNode): void {
    this.state.selectedNode = node;
    
    // Dispatch custom event for external handling
    const event = new CustomEvent('nodeSelected', { detail: node });
    this.container.dispatchEvent(event);
    
    // Animate camera to focus on node
    const nodePosition = this.latLonToVector3(node.lat, node.lon, this.config.radius * 2);
    
    gsap.to(this.camera.position, {
      duration: 1,
      x: nodePosition.x * 1.5,
      y: nodePosition.y * 1.5,
      z: nodePosition.z * 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.lookAt(0, 0, 0);
      }
    });
  }
  
  private zoom(delta: number): void {
    const minZ = 12;
    const maxZ = 35;
    
    gsap.to(this.camera.position, {
      duration: 0.5,
      z: Math.max(minZ, Math.min(maxZ, this.camera.position.z - delta * 2)),
      ease: 'power2.out'
    });
    
    // Update zoom level
    const z = this.camera.position.z;
    if (z > 25) this.state.zoomLevel = 1;
    else if (z > 15) this.state.zoomLevel = 2;
    else this.state.zoomLevel = 3;
  }
  
  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    if (width === 0 || height === 0) return;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
  
  private latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    // Fixed coordinate system - removed negative X
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      -radius * Math.sin(phi) * Math.sin(theta)
    );
  }
  
  private playIntroSequence(): void {
    // Initial state
    this.globe.scale.setScalar(0.8);
    this.globe.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
        (obj.material as THREE.Material).opacity = 0;
      }
    });
    
    const timeline = gsap.timeline({
      onComplete: () => {
        this.state.introComplete = true;
      }
    });
    
    // Globe fade and scale in
    timeline.to(this.globe.scale, {
      duration: 1,
      x: 1,
      y: 1,
      z: 1,
      ease: 'power2.out'
    }, 0);
    
    // Grid lines appear
    timeline.to(this.gridLines.material, {
      duration: 0.8,
      opacity: 0.1,
      ease: 'power2.inOut'
    }, 0.5);
    
    // Globe mesh opacity
    timeline.to(this.globeMesh.material, {
      duration: 1,
      opacity: 0.4,
      ease: 'power2.inOut'
    }, 0.3);
    
    // Atmosphere
    timeline.to((this.atmosphere.material as THREE.ShaderMaterial).uniforms.c, {
      duration: 1,
      value: 0.4,
      ease: 'power2.inOut'
    }, 0.5);
    
    // News nodes appear sequentially
    const nodes = Array.from(this.newsNodes.values());
    nodes.forEach((node, index) => {
      timeline.fromTo(node.scale,
        { x: 0, y: 0, z: 0 },
        {
          duration: 0.4,
          x: 1,
          y: 1,
          z: 1,
          ease: 'back.out(2)'
        },
        1 + index * 0.05
      );
    });
    
    // Connection lines draw
    this.connectionLines.forEach((line, index) => {
      timeline.to(line.material, {
        duration: 0.5,
        opacity: (line.material as THREE.LineBasicMaterial).opacity || 0.5,
        ease: 'power2.inOut'
      }, 2 + index * 0.03);
    });
    
    // Heatmap fade in
    timeline.to(this.heatmapMesh.material, {
      duration: 1,
      opacity: 0.4,
      ease: 'power2.inOut'
    }, 3);
  }
  
  private startAnimation(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
  
  private update(): void {
    const time = Date.now() * 0.001;
    
    // Auto rotation when idle
    const idleTime = Date.now() - this.state.lastInteraction;
    if (!this.state.isInteracting && idleTime > this.config.idleTimeout && this.state.introComplete) {
      this.targetRotation.y += this.config.autoRotateSpeed;
    }
    
    // Apply momentum
    if (!this.isDragging) {
      this.targetRotation.x += this.momentum.x;
      this.targetRotation.y += this.momentum.y;
      
      // Decay momentum
      this.momentum.x *= 0.95;
      this.momentum.y *= 0.95;
    }
    
    // Smooth rotation
    this.globe.rotation.x += (this.targetRotation.x - this.globe.rotation.x) * 0.1;
    this.globe.rotation.y += (this.targetRotation.y - this.globe.rotation.y) * 0.1;
    
    // Update news node animations
    this.newsNodes.forEach((nodeGroup, id) => {
      const node = MOCK_NEWS_NODES.find(n => n.id === id);
      if (!node) return;
      
      const pulseSpeed = node.type === 'breaking' ? 3 : node.type === 'major' ? 2 : 1.5;
      
      // Pulse rings
      nodeGroup.children.forEach(child => {
        if (child.userData.isPulseRing) {
          const phase = child.userData.pulsePhase || 0;
          const scale = 1 + Math.sin(time * pulseSpeed + phase) * 0.3;
          child.scale.setScalar(scale);
          ((child as THREE.Mesh).material as THREE.Material).opacity = 0.5 - (scale - 1) * 1.2;
        }
        
        // Update particles
        if (child.userData.isParticleSystem) {
          const particles = child as THREE.Points;
          const positions = particles.geometry.attributes.position.array as Float32Array;
          const velocities = particles.geometry.userData.velocities;
          
          for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i];
            positions[i + 1] += velocities[i + 1];
            positions[i + 2] += velocities[i + 2];
            
            // Reset particles that go too high
            if (positions[i + 1] > 0.3) {
              positions[i] = (Math.random() - 0.5) * 0.1;
              positions[i + 1] = 0;
              positions[i + 2] = (Math.random() - 0.5) * 0.1;
            }
          }
          
          particles.geometry.attributes.position.needsUpdate = true;
        }
      });
    });
    
    // Update connection particles
    this.particleSystems.forEach(ps => {
      if (ps.userData.isConnectionParticle) {
        const geometry = ps.geometry;
        const curve = geometry.userData.curve as THREE.QuadraticBezierCurve3;
        const phases = geometry.userData.phases as Float32Array;
        const positions = geometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < phases.length; i++) {
          phases[i] += 0.003;
          if (phases[i] > 1) phases[i] = 0;
          
          const point = curve.getPoint(phases[i]);
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;
        }
        
        geometry.attributes.position.needsUpdate = true;
      }
    });
    
    // Rotate star field slowly
    if (this.starField) {
      this.starField.rotation.y += 0.0001;
    }
    
    // Update atmosphere shader
    const atmosMat = this.atmosphere.material as THREE.ShaderMaterial;
    if (atmosMat.uniforms) {
      atmosMat.uniforms.viewVector.value = this.camera.position;
    }
    
    // Heatmap breathing effect
    if (this.heatmapMesh && this.heatmapMesh.visible) {
      const breathe = 0.35 + Math.sin(time * 0.5) * 0.05;
      (this.heatmapMesh.material as THREE.Material).opacity = breathe;
    }
    
    // Reset isInteracting after a short delay
    if (this.state.isInteracting && !this.isDragging) {
      if (Date.now() - this.state.lastInteraction > 100) {
        this.state.isInteracting = false;
      }
    }
  }
  
  // Public methods
  public addNewsNode(node: NewsNode): void {
    const nodeGroup = this.createNewsNode(node);
    nodeGroup.userData = { ...node };
    this.newsNodes.set(node.id, nodeGroup);
    
    // Animate entrance
    nodeGroup.scale.setScalar(0);
    this.globe.add(nodeGroup);
    
    gsap.to(nodeGroup.scale, {
      duration: 0.6,
      x: 1.2,
      y: 1.2,
      z: 1.2,
      ease: 'back.out(3)',
      onComplete: () => {
        gsap.to(nodeGroup.scale, {
          duration: 0.2,
          x: 1,
          y: 1,
          z: 1
        });
      }
    });
  }
  
  public focusOnRegion(lat: number, lon: number): void {
    const targetPos = this.latLonToVector3(lat, lon, this.config.radius * 2);
    
    gsap.to(this.camera.position, {
      duration: 1.5,
      x: targetPos.x * 1.2,
      y: targetPos.y * 1.2,
      z: targetPos.z * 1.2 + 10,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.camera.lookAt(0, 0, 0);
      }
    });
  }
  
  public setHeatmapVisible(visible: boolean): void {
    this.heatmapMesh.visible = visible;
    const btn = this.overlay.querySelector('.toggle-heatmap');
    btn?.classList.toggle('active', visible);
  }
  
  public setConnectionsVisible(visible: boolean): void {
    this.connectionLines.forEach(line => line.visible = visible);
    this.particleSystems.forEach(ps => ps.visible = visible);
    const btn = this.overlay.querySelector('.toggle-connections');
    btn?.classList.toggle('active', visible);
  }
  
  public destroy(): void {
    cancelAnimationFrame(this.animationId);
    
    window.removeEventListener('resize', this.onResize.bind(this));
    
    this.scene.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    
    this.renderer.dispose();
    
    if (this.tooltip) this.tooltip.remove();
    if (this.overlay) this.overlay.remove();
    
    this.container.innerHTML = '';
  }
}
