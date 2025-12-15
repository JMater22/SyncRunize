import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import mapboxgl, { type GeoJSONSource } from 'mapbox-gl';
// eslint-disable-next-line import/no-webpack-loader-syntax
import MapboxWorker from 'mapbox-gl/dist/mapbox-gl-csp-worker?worker&inline';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { FeatureCollection, LineString, Polygon } from 'geojson';
import type { HazardReport } from '../services/hazards';
import { clusterHazards, calculateCentroid, SPIDERFY_CONFIG } from '../lib/hazardClustering';

if (!(mapboxgl as unknown as { workerClass?: unknown }).workerClass) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - worker loader type provided via custom d.ts
  mapboxgl.workerClass = MapboxWorker;
}

export type LatLngLiteral = { lat: number; lng: number };

export type RunTrackerMapHandle = {
  recenter: (target?: LatLngLiteral | null) => void;
  resize: () => void;
  getCenter: () => LatLngLiteral | null;
};

interface AccidentCluster {
  cluster_id: number;
  lat: number;
  lon: number;
  count: number;
  radius_meters: number;
}

type RunTrackerMapProps = {
  pathCoords: LatLngLiteral[];
  guidedPath: LatLngLiteral[];
  guidedStart: LatLngLiteral | null;
  guidedEnd: LatLngLiteral | null;
  hazards: HazardReport[];
  selectedHazardId?: number | string | null;
  hazardRadiusMeters: number;
  accidentClusters: AccidentCluster[];
  showAccidentClusters?: boolean; // Toggle for accident cluster visibility
  mapType: 'streets' | 'satellite' | 'outdoors';
  mapOnlyView: boolean;
  mapboxToken?: string;
  onMapReadyChange?: (ready: boolean) => void;
  onError?: (message: string | null) => void;
  onSelectHazard?: (hazard: HazardReport) => void;
};

const DEFAULT_CENTER: LatLngLiteral = { lat: 15.4755, lng: 120.5963 };
const MAP_STYLE = import.meta.env.VITE_MAPBOX_STYLE ?? 'mapbox/streets-v12';
const resolveStyleUrl = (style: string) => {
  if (!style) return 'mapbox://styles/mapbox/streets-v12';
  if (style.startsWith('mapbox://') || style.startsWith('http')) {
    return style;
  }
  return `mapbox://styles/${style}`;
};

const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12'
};

const RUNNER_SOURCE_ID = 'runner-path';
const RUNNER_LAYER_ID = 'runner-path-line';
const GUIDED_SOURCE_ID = 'guided-route';
const GUIDED_LAYER_ID = 'guided-route-line';
const RADIUS_SOURCE_ID = 'runner-radius';
const RADIUS_LAYER_ID = 'runner-radius-fill';

const createLineGeoJSON = (points: LatLngLiteral[]): FeatureCollection<LineString> => ({
  type: 'FeatureCollection',
  features: points.length < 2
    ? []
    : [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: points.map((point) => [point.lng, point.lat]),
        },
      }],
});

const createCircleGeoJSON = (center: LatLngLiteral, radiusMeters: number, steps = 64): FeatureCollection<Polygon> => {
  if (!radiusMeters) {
    return { type: 'FeatureCollection', features: [] };
  }
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * 2 * Math.PI;
    const dx = Math.cos(angle) * radiusMeters;
    const dy = Math.sin(angle) * radiusMeters;
    const deltaLng = dx / (111320 * Math.cos((center.lat * Math.PI) / 180));
    const deltaLat = dy / 110540;
    coordinates.push([center.lng + deltaLng, center.lat + deltaLat]);
  }
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
    }],
  };
};

const hazardKey = (hazard: HazardReport) => {
  if (hazard.report_id == null) {
    return `${hazard.lat}:${hazard.lng}`;
  }
  return String(hazard.report_id);
};

const RunTrackerMap = forwardRef<RunTrackerMapHandle, RunTrackerMapProps>((props, ref) => {
  const {
    pathCoords,
    guidedPath,
    guidedStart,
    guidedEnd,
    hazards,
    selectedHazardId,
    hazardRadiusMeters,
    accidentClusters,
    showAccidentClusters = false, // Default to hidden
    mapType,
    mapOnlyView,
    mapboxToken,
    onMapReadyChange,
    onError,
    onSelectHazard,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const runnerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const guidedStartMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const guidedEndMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const hazardMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const hazardClustersRef = useRef<Map<string, HazardReport[]>>(new Map());
  const lastZoomStateRef = useRef<'spiderfied' | 'clustered' | 'hidden' | null>(null);
  const currentStyleRef = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);
  const [internalError, setInternalError] = useState<string | null>(null);

  const reportError = useCallback((message: string | null) => {
    setInternalError(message);
    onError?.(message);
  }, [onError]);

  // ✅ FIX: Use ref for initial center - compute once, don't trigger re-initialization
  // This prevents map destruction/recreation on every GPS update
  const initialCenterRef = useRef<LatLngLiteral | null>(null);
  if (!initialCenterRef.current) {
    initialCenterRef.current = pathCoords[pathCoords.length - 1] ?? guidedStart ?? DEFAULT_CENTER;
  }

  useImperativeHandle(ref, () => ({
    recenter(target) {
      const fallback = target ?? pathCoords[pathCoords.length - 1] ?? guidedStart ?? DEFAULT_CENTER;
      if (!fallback || !mapRef.current) return;
      mapRef.current.easeTo({
        center: [fallback.lng, fallback.lat],
        duration: 600,
      });
    },
    resize() {
      requestAnimationFrame(() => mapRef.current?.resize());
    },
    getCenter() {
      if (!mapRef.current) return null;
      const center = mapRef.current.getCenter();
      return { lat: center.lat, lng: center.lng };
    },
  }), [guidedStart, pathCoords]);

  const ensureBaseLayers = useCallback((map: mapboxgl.Map) => {
    if (!map.getSource(RUNNER_SOURCE_ID)) {
      map.addSource(RUNNER_SOURCE_ID, {
        type: 'geojson',
        data: createLineGeoJSON([]),
      });
    }
    if (!map.getLayer(RUNNER_LAYER_ID)) {
      map.addLayer({
        id: RUNNER_LAYER_ID,
        type: 'line',
        source: RUNNER_SOURCE_ID,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#4c9cff',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      });
    }
    if (!map.getSource(GUIDED_SOURCE_ID)) {
      map.addSource(GUIDED_SOURCE_ID, {
        type: 'geojson',
        data: createLineGeoJSON([]),
      });
    }
    if (!map.getLayer(GUIDED_LAYER_ID)) {
      map.addLayer({
        id: GUIDED_LAYER_ID,
        type: 'line',
        source: GUIDED_SOURCE_ID,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#00c853',
          'line-width': 3,
          'line-dasharray': [1, 1.4],
          'line-opacity': 0.8,
        },
      });
    }
    if (!map.getSource(RADIUS_SOURCE_ID)) {
      map.addSource(RADIUS_SOURCE_ID, {
        type: 'geojson',
        data: createCircleGeoJSON(DEFAULT_CENTER, 0),
      });
    }
    if (!map.getLayer(RADIUS_LAYER_ID)) {
      map.addLayer({
        id: RADIUS_LAYER_ID,
        type: 'fill',
        source: RADIUS_SOURCE_ID,
        paint: {
          'fill-color': '#FFB74D',
          'fill-opacity': 0.18,
          'fill-outline-color': '#FB8C00',
        },
      });
    }
  }, []);

  const updateRunnerMarker = useCallback((coordinate: LatLngLiteral | null) => {
    if (!mapRef.current) return;
    if (!coordinate) {
      runnerMarkerRef.current?.remove();
      runnerMarkerRef.current = null;
      return;
    }
    const element = runnerMarkerRef.current?.getElement() ?? document.createElement('div');
    element.className = 'runner-marker';
    if (!runnerMarkerRef.current) {
      runnerMarkerRef.current = new mapboxgl.Marker({ element, anchor: 'center' })
        .setLngLat([coordinate.lng, coordinate.lat])
        .addTo(mapRef.current);
    } else {
      runnerMarkerRef.current.setLngLat([coordinate.lng, coordinate.lat]);
    }
  }, []);

  const updateRunnerRadius = useCallback((coordinate: LatLngLiteral | null) => {
    if (!mapRef.current) return;
    const source = mapRef.current.getSource(RADIUS_SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return;
    if (!coordinate) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    source.setData(createCircleGeoJSON(coordinate, hazardRadiusMeters));
  }, [hazardRadiusMeters]);

  const updateGuidedMarkers = useCallback((start: LatLngLiteral | null, end: LatLngLiteral | null, showEnd: boolean) => {
    if (!mapRef.current) return;
    const ensureMarker = (markerRef: React.MutableRefObject<mapboxgl.Marker | null>, coord: LatLngLiteral | null, className: string) => {
      if (!coord) {
        markerRef.current?.remove();
        markerRef.current = null;
        return;
      }
      const element = markerRef.current?.getElement() ?? document.createElement('div');
      element.className = className;
      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker({ element, anchor: 'bottom' })
          .setLngLat([coord.lng, coord.lat])
          .addTo(mapRef.current!);
      } else {
        markerRef.current.setLngLat([coord.lng, coord.lat]);
      }
    };

    ensureMarker(guidedStartMarkerRef, start, 'guided-marker start');
    ensureMarker(guidedEndMarkerRef, showEnd ? end : null, 'guided-marker end');
  }, []);

  // ✅ FIX: Map initialization - only depends on static values, not changing GPS position
  useEffect(() => {
    if (!mapboxToken) {
      reportError('Mapbox access token missing.');
      onMapReadyChange?.(false);
      return;
    }
    if (!containerRef.current || mapRef.current) {
      return;
    }
    try {
      mapboxgl.accessToken = mapboxToken;
      // ✅ FIX: Use initial center ref - won't change on every GPS update
      const initialCenter = initialCenterRef.current || DEFAULT_CENTER;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: resolveStyleUrl(MAP_STYLE),
        center: [initialCenter.lng, initialCenter.lat],
        zoom: 15,
        attributionControl: false,
        dragRotate: false,
      });
      mapRef.current = map;

      map.on('load', () => {
        ensureBaseLayers(map);
        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }));

        // Track initial style
        currentStyleRef.current = MAP_STYLES.streets;

        // ✅ FIX: Double RAF for reliable layout completion before resize
        // First RAF waits for browser paint, second RAF waits for layout to settle
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            map.resize();
            console.log('[RunTrackerMap] Map resized after initial load (double RAF)');
          });
        });

        setMapReady(true);
        onMapReadyChange?.(true);
        reportError(null);
      });

      map.on('error', (event) => {
        console.error('[RunTrackerMap] Mapbox error', event?.error);
        reportError('Unable to render Mapbox map. Please try again.');
      });
    } catch (err) {
      console.error('[RunTrackerMap] Failed to initialize map', err);
      reportError('Map initialization failed.');
    }

    return () => {
      setMapReady(false);
      onMapReadyChange?.(false);
      hazardMarkersRef.current.forEach((marker) => marker.remove());
      hazardMarkersRef.current.clear();
      guidedStartMarkerRef.current?.remove();
      guidedStartMarkerRef.current = null;
      guidedEndMarkerRef.current?.remove();
      guidedEndMarkerRef.current = null;
      runnerMarkerRef.current?.remove();
      runnerMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // ✅ FIX: Removed defaultCenter from dependencies - prevents re-initialization on GPS updates
  }, [ensureBaseLayers, mapboxToken, onMapReadyChange, reportError]);

  useEffect(() => {
    const handleResize = () => mapRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Change map style when mapType changes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;
    const newStyle = MAP_STYLES[mapType];

    // Check if style is actually changing to avoid unnecessary updates
    if (currentStyleRef.current === newStyle) {
      return; // Style already matches, no need to change
    }

    console.log('[RunTrackerMap] Changing map style to:', mapType);
    currentStyleRef.current = newStyle;
    map.setStyle(newStyle);

    // Re-add all custom layers after style loads
    map.once('style.load', () => {
      ensureBaseLayers(map);
      // Increment version to trigger re-render of accident clusters and hazards
      setStyleVersion(prev => prev + 1);
      console.log('[RunTrackerMap] Style loaded, base layers restored');
    });
  }, [mapType, mapReady, ensureBaseLayers]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    // Only update path if it actually changed (more than just adding 1-2 points)
    const runnerSource = map.getSource(RUNNER_SOURCE_ID) as GeoJSONSource | undefined;
    if (runnerSource) {
      // ✅ FIX: Increased from 5 to 15 points (66% fewer map updates)
      // With 10s GPS sampling, updates every ~2.5 minutes instead of ~50 seconds
      const shouldUpdatePath = pathCoords.length % 15 === 0 || pathCoords.length < 20;
      if (shouldUpdatePath) {
        runnerSource.setData(createLineGeoJSON(pathCoords));
      }
    }

    const latest = pathCoords[pathCoords.length - 1] ?? null;
    updateRunnerMarker(latest);
    updateRunnerRadius(latest);

    // ✅ FIX: Increased from 10 to 20 points to reduce camera animations
    // Animations now every ~3.3 minutes instead of ~1.7 minutes
    if (latest && !mapOnlyView && pathCoords.length % 20 === 0) {
      map.easeTo({
        center: [latest.lng, latest.lat],
        duration: 300, // Faster animation (was 500ms)
      });
    }
  }, [mapOnlyView, mapReady, pathCoords, updateRunnerMarker, updateRunnerRadius]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const guidedSource = map.getSource(GUIDED_SOURCE_ID) as GeoJSONSource | undefined;
    guidedSource?.setData(createLineGeoJSON(guidedPath));
    updateGuidedMarkers(guidedStart, guidedEnd, pathCoords.length === 0);
    if (!pathCoords.length && guidedStart) {
      map.easeTo({
        center: [guidedStart.lng, guidedStart.lat],
        duration: 400,
      });
    }
  }, [guidedEnd, guidedPath, guidedStart, mapReady, pathCoords.length, updateGuidedMarkers]);

  // Update marker visibility and scaling based on zoom level
  const updateMarkersForZoom = useCallback(() => {
    if (!mapRef.current) return;

    const zoom = mapRef.current.getZoom();
    const minZoom = 12;

    hazardMarkersRef.current.forEach((marker) => {
      const el = marker.getElement();

      // Skip spiderfied markers - they use translate() transforms
      if (el.classList.contains('hazard-marker-spiderfied')) {
        el.style.display = 'flex';
        return;
      }

      if (zoom < minZoom) {
        el.style.display = 'none';
      } else {
        el.style.display = 'flex';

        // Responsive sizing
        let scale = 0.7;
        if (zoom >= 15) {
          scale = 1.0 + ((zoom - 15) * 0.1);
        } else {
          scale = 0.7 + ((zoom - 12) * 0.1);
        }
        scale = Math.min(scale, 1.3);

        el.style.transform = `scale(${scale})`;
      }
    });
  }, []);

  // Create a single hazard marker
  const createSingleHazardMarker = useCallback((hazard: HazardReport): mapboxgl.Marker => {
    const el = document.createElement('div');
    el.className = 'hazard-marker-simple';
    el.innerHTML = `
      <div class="crimson-marker"></div>
      <div class="cloud-bubble">${hazard.incident_type}</div>
    `;

    el.addEventListener('click', () => {
      onSelectHazard?.(hazard);
    });

    return new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([hazard.lng, hazard.lat])
      .addTo(mapRef.current!);
  }, [onSelectHazard]);

  // Create a cluster marker with count badge
  const createClusterMarker = useCallback((
    position: { lat: number; lng: number },
    count: number,
    clusterId: string
  ): mapboxgl.Marker => {
    const el = document.createElement('div');
    el.className = 'hazard-marker-cluster';
    el.dataset.clusterId = clusterId;
    el.innerHTML = `
      <div class="crimson-marker">
        <span class="cluster-count">${count}</span>
      </div>
      <div class="cloud-bubble">Multiple Hazards</div>
    `;

    return new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([position.lng, position.lat])
      .addTo(mapRef.current!);
  }, []);

  // Create spiderfied markers
  const createSpiderfiedMarkers = useCallback((
    hazardsInCluster: HazardReport[],
    centerPosition: { lat: number; lng: number }
  ): mapboxgl.Marker[] => {
    if (!mapRef.current) return [];

    const isMobile = window.innerWidth <= 768;
    const radius = isMobile
      ? SPIDERFY_CONFIG.SPIDER_RADIUS_MOBILE
      : SPIDERFY_CONFIG.SPIDER_RADIUS_DESKTOP;

    const displayHazards = hazardsInCluster.slice(0, SPIDERFY_CONFIG.MAX_SPIDER_DISPLAY);
    const angleStep = (2 * Math.PI) / displayHazards.length;
    const startAngle = -Math.PI / 2;

    const markers: mapboxgl.Marker[] = [];

    displayHazards.forEach((hazard, index) => {
      const angle = startAngle + (angleStep * index);
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;

      const markerEl = document.createElement('div');
      markerEl.className = 'hazard-marker-spiderfied';
      markerEl.innerHTML = `
        <div class="crimson-marker"></div>
        <div class="cloud-bubble">${hazard.incident_type}</div>
      `;

      markerEl.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectHazard?.(hazard);
      });

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'bottom'
      })
        .setLngLat([centerPosition.lng, centerPosition.lat])
        .addTo(mapRef.current!);

      markers.push(marker);
    });

    return markers;
  }, [onSelectHazard]);

  // Render markers based on current zoom level
  const renderMarkersForZoom = useCallback(() => {
    if (!mapRef.current || hazardClustersRef.current.size === 0) return;

    const zoom = mapRef.current.getZoom();
    const MIN_ZOOM_THRESHOLD = 12;
    const SPIDERFY_ZOOM_THRESHOLD = 18;

    // Clear old markers
    hazardMarkersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        // Marker may already be removed
      }
    });
    hazardMarkersRef.current.clear();

    // Hide markers when zoomed out too far
    if (zoom < MIN_ZOOM_THRESHOLD) {
      lastZoomStateRef.current = 'hidden';
      return;
    }

    const currentState = zoom >= SPIDERFY_ZOOM_THRESHOLD ? 'spiderfied' : 'clustered';
    lastZoomStateRef.current = currentState;

    // Render based on zoom level
    const markers: mapboxgl.Marker[] = [];
    hazardClustersRef.current.forEach((hazardsInCluster, clusterId) => {
      try {
        if (hazardsInCluster.length === 1) {
          const marker = createSingleHazardMarker(hazardsInCluster[0]);
          markers.push(marker);
        } else {
          const centroid = calculateCentroid(hazardsInCluster);

          if (zoom >= SPIDERFY_ZOOM_THRESHOLD) {
            const spiderfiedMarkers = createSpiderfiedMarkers(hazardsInCluster, centroid);
            markers.push(...spiderfiedMarkers);
          } else {
            const marker = createClusterMarker(centroid, hazardsInCluster.length, clusterId);
            markers.push(marker);
          }
        }
      } catch (error) {
        console.error('[RunTrackerMap] Failed to create marker for cluster:', clusterId, error);
      }
    });

    // Store markers in ref
    markers.forEach((marker, index) => {
      hazardMarkersRef.current.set(`marker-${index}`, marker);
    });

    updateMarkersForZoom();
  }, [updateMarkersForZoom, createSingleHazardMarker, createClusterMarker, createSpiderfiedMarkers]);

  // Re-render markers when zoom crosses threshold
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const handleZoomEnd = () => {
      if (!mapRef.current || hazardClustersRef.current.size === 0) return;

      const zoom = mapRef.current.getZoom();
      const MIN_ZOOM_THRESHOLD = 12;
      const SPIDERFY_ZOOM_THRESHOLD = 18;

      const currentState = zoom < MIN_ZOOM_THRESHOLD
        ? 'hidden'
        : zoom >= SPIDERFY_ZOOM_THRESHOLD
          ? 'spiderfied'
          : 'clustered';

      // Only re-render when crossing threshold
      if (currentState !== lastZoomStateRef.current) {
        renderMarkersForZoom();
      }
    };

    mapRef.current.on('zoomend', handleZoomEnd);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('zoomend', handleZoomEnd);
      }
    };
  }, [mapReady, renderMarkersForZoom]);

  // Cluster hazards and render them
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    console.log('[RunTrackerMap] Clustering hazards:', hazards.length);

    // Cluster hazards by proximity
    const clusters = clusterHazards(hazards);
    hazardClustersRef.current = clusters;

    // Clean up old markers
    hazardMarkersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        // Marker may already be removed
      }
    });
    hazardMarkersRef.current.clear();

    // Reset zoom state to force re-render
    lastZoomStateRef.current = null;

    // Render markers after brief delay
    setTimeout(() => {
      renderMarkersForZoom();
    }, 100);
  }, [hazards, mapReady, renderMarkersForZoom]);

  // ✅ FIX: Use source.setData() instead of removing/re-adding layer
  // Prevents expensive layer recreation on every accident cluster update
  useEffect(() => {
    if (!mapReady || !mapRef.current || accidentClusters.length === 0) return;

    const map = mapRef.current;

    try {
      // Create GeoJSON features from accident clusters
      const features = accidentClusters.map(cluster => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [cluster.lon, cluster.lat]
        },
        properties: {
          cluster_id: cluster.cluster_id,
          count: cluster.count,
          radius_meters: cluster.radius_meters
        }
      }));

      const featureCollection = {
        type: 'FeatureCollection' as const,
        features: features
      };

      // Check if source already exists
      const existingSource = map.getSource('accident-clusters') as GeoJSONSource | undefined;

      if (existingSource) {
        // ✅ Just update the data, don't recreate layer
        existingSource.setData(featureCollection);
      } else {
        // First time: create source and layer
        map.addSource('accident-clusters', {
          type: 'geojson',
          data: featureCollection
        });

        // Add circle layer for accident clusters with color based on severity
        map.addLayer({
          id: 'accident-cluster-circles',
          type: 'circle',
          source: 'accident-clusters',
          layout: {
            'visibility': showAccidentClusters ? 'visible' : 'none' // Toggle visibility
          },
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 10,  // At zoom 10, radius is 10px (enhanced visibility)
              15, 30   // At zoom 15, radius is 30px (enhanced visibility)
            ],
            'circle-color': [
              'step',
              ['get', 'count'],
              '#FFA500', // Yellow-Orange for count < 15
              15, '#FF8C00', // Dark Orange for count 15-29
              30, '#FF6500'  // Vivid Orange for count >= 30
            ],
            'circle-opacity': 0.3,  // Increased from 0.15 to make more visible
            'circle-stroke-width': 2,  // Increased from 1
            'circle-stroke-color': [
              'step',
              ['get', 'count'],
              '#FFA500',
              15, '#FF8C00',
              30, '#FF6500'
            ],
            'circle-stroke-opacity': 0.6  // Increased from 0.4
          }
        });
      }
    } catch (error) {
      console.error('[RunTrackerMap] Error displaying accident clusters:', error);
    }
  }, [accidentClusters, mapReady, styleVersion]);

  // Update accident cluster visibility when toggle changes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;
    const layerId = 'accident-cluster-circles';

    try {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', showAccidentClusters ? 'visible' : 'none');
        console.log('[RunTrackerMap] Accident clusters visibility:', showAccidentClusters ? 'visible' : 'hidden');
      }
    } catch (error) {
      console.error('[RunTrackerMap] Error updating accident cluster visibility:', error);
    }
  }, [showAccidentClusters, mapReady]);

  // ✅ FIX: Resize map when toggling between map-only and split view
  // Delay allows CSS transitions to complete before resize
  useEffect(() => {
    if (!mapRef.current) return;

    const timeoutId = setTimeout(() => {
      mapRef.current?.resize();
      console.log('[RunTrackerMap] Map resized after view toggle:', mapOnlyView ? 'map-only' : 'split');
    }, 150); // 150ms delay for CSS transition completion

    return () => clearTimeout(timeoutId);
  }, [mapOnlyView]);

  return (
    <div className="map-iframe">
      <div ref={containerRef} className="mapbox-map" />
      {!mapReady && !internalError && (
        <div className="map-loading-overlay">Loading map…</div>
      )}
      {internalError && (
        <div className="map-error-placeholder">
          <p>{internalError}</p>
        </div>
      )}
    </div>
  );
});

RunTrackerMap.displayName = 'RunTrackerMap';

export default RunTrackerMap;
