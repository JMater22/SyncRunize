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

if (!(mapboxgl as unknown as { workerClass?: unknown }).workerClass) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - worker loader type provided via custom d.ts
  mapboxgl.workerClass = MapboxWorker;
}

export type LatLngLiteral = { lat: number; lng: number };

export type RunTrackerMapHandle = {
  recenter: (target?: LatLngLiteral | null) => void;
  resize: () => void;
};

type RunTrackerMapProps = {
  pathCoords: LatLngLiteral[];
  guidedPath: LatLngLiteral[];
  guidedStart: LatLngLiteral | null;
  guidedEnd: LatLngLiteral | null;
  hazards: HazardReport[];
  selectedHazardId?: number | string | null;
  hazardRadiusMeters: number;
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

const getHazardSeverity = (hazard: HazardReport): 'high' | 'medium' | 'low' => {
  const severity = Number(hazard.severity_weight ?? 0);
  if (severity >= 0.7) return 'high';
  if (severity >= 0.4) return 'medium';
  return 'low';
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
  const [mapReady, setMapReady] = useState(false);
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

        // ✅ FIX: Resize map after load to ensure proper dimensions
        // Without this, map may render at incorrect size until toggle is clicked
        requestAnimationFrame(() => {
          map.resize();
          console.log('[RunTrackerMap] Map resized after initial load');
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

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    // Only update path if it actually changed (more than just adding 1-2 points)
    const runnerSource = map.getSource(RUNNER_SOURCE_ID) as GeoJSONSource | undefined;
    if (runnerSource) {
      // Batch update: only re-render every 5 points or if path is short
      const shouldUpdatePath = pathCoords.length % 5 === 0 || pathCoords.length < 10;
      if (shouldUpdatePath) {
        runnerSource.setData(createLineGeoJSON(pathCoords));
      }
    }

    const latest = pathCoords[pathCoords.length - 1] ?? null;
    updateRunnerMarker(latest);
    updateRunnerRadius(latest);

    // Only auto-center every 10 points to reduce camera animation overhead
    if (latest && !mapOnlyView && pathCoords.length % 10 === 0) {
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

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const activeKeys = new Set(hazards.map((hazard) => hazardKey(hazard)));
    hazardMarkersRef.current.forEach((marker, key) => {
      if (!activeKeys.has(key)) {
        marker.remove();
        hazardMarkersRef.current.delete(key);
      }
    });

    hazards.forEach((hazard) => {
      if (!Number.isFinite(hazard.lat) || !Number.isFinite(hazard.lng)) {
        return;
      }
      const key = hazardKey(hazard);
      const severity = getHazardSeverity(hazard);
      const className = `hazard-marker ${severity}${selectedHazardId != null && key === String(selectedHazardId) ? ' selected' : ''}`;
      const lngLat: [number, number] = [Number(hazard.lng), Number(hazard.lat)];
      const existingMarker = hazardMarkersRef.current.get(key);
      if (!existingMarker) {
        const element = document.createElement('div');
        element.className = className;
        const hazardTitle = hazard.title || hazard.incident_type || 'Hazard';
        element.title = hazardTitle;
        element.addEventListener('click', (event) => {
          event.stopPropagation();
          onSelectHazard?.(hazard);
        });
        const marker = new mapboxgl.Marker({ element, anchor: 'center' }).setLngLat(lngLat).addTo(map);
        hazardMarkersRef.current.set(key, marker);
      } else {
        existingMarker.setLngLat(lngLat);
        existingMarker.getElement().className = className;
      }
    });
  }, [hazards, mapReady, onSelectHazard, selectedHazardId]);

  useEffect(() => {
    if (mapOnlyView) {
      mapRef.current?.resize();
    }
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
