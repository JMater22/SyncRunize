import { useState, useCallback, useEffect, useRef } from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonToast,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons
} from '@ionic/react';
import {
  navigateOutline,
  arrowBackOutline,
  closeCircleOutline,
  saveOutline,
  pinOutline,
  locationOutline,
  informationCircleOutline,
  mapOutline,
  listOutline,
  warningOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import { useHideTabBar } from '../hooks/useHideTabBar';
import { supabase } from '../lib/supabaseClient';
import { DEFAULT_AVATAR, kmToMiles } from '../lib/utils';
import { buildGuidedRoutePayload } from '../lib/routeGuides';
import '../theme/CreateRouteMap.css';

// Mapbox configuration
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Default center (Tarlac, Philippines)
const defaultCenter: [number, number] = [120.5963, 15.4755]; // [lng, lat]
const ALGO_ENGINE_URL =
  import.meta.env.VITE_ALGO_ENGINE_URL ||
  (import.meta as any)?.env?.VITE_ALGORITHM_ENGINE_URL ||
  'http://localhost:8000';

interface LatLng {
  lat: number;
  lng: number;
}

interface SafetyWarning {
  segment?: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  message: string;
  advice: string;
}

interface SafetyAnalysis {
  warnings: SafetyWarning[];
  stats: {
    total_distance_km: number;
    has_critical_warnings: boolean;
  };
}

interface HazardReport {
  report_id: number;
  title: string;
  incident_type: string;
  description: string;
  lat: number;
  lng: number;
  image_url: string | null;
  reported_at: string;
  severity_weight: number;
  trust_score: number;
  status: string;
  users?: {
    username: string;
    profile_picture: string | null;
  };
  // Establishment info (enriched from Places API)
  establishment?: {
    place_id: string;
    displayName: string;
    formattedAddress: string;
    types: string[];
  };
}

interface GeneratedRoute {
  route_id: number;
  route_name: string;
  distance_km: number;
  chosen_path: LatLng[];
  risk_score: number;
  duration_seconds: number;
  average_pace: number;
  route_status: string;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
  place_type: string[];
}

interface AccidentCluster {
  cluster_id: number;
  lat: number;
  lon: number;
  count: number;
  radius_meters: number;
  created_at?: string;
  updated_at?: string;
}

interface AccidentWarning {
  cluster_id: number;
  count: number;
  severity: 'high' | 'medium' | 'low';
}

const CreateRouteMap = () => {
  console.log('[CreateRoute] Component rendering...');
  useHideTabBar();
  const history = useHistory();

  // Form states
  const [routeName, setRouteName] = useState('');
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [endPoint, setEndPoint] = useState<LatLng | null>(null);

  // Map states
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<'streets' | 'satellite' | 'outdoors'>('streets');
  const [generatedPath, setGeneratedPath] = useState<LatLng[]>([]);
  const [generatedRoute, setGeneratedRoute] = useState<GeneratedRoute | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<{
    distance_warning: boolean;
    requested_distance_km: number;
    generated_distance_km: number;
  } | null>(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null);

  // Marker references
  const startMarker = useRef<mapboxgl.Marker | null>(null);
  const endMarker = useRef<mapboxgl.Marker | null>(null);
  const hazardMarkers = useRef<mapboxgl.Marker[]>([]);

  // Hazard states
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [selectedHazard, setSelectedHazard] = useState<HazardReport | null>(null);
  const [showHazardModal, setShowHazardModal] = useState(false);

  // Accident cluster states
  const [accidentClusters, setAccidentClusters] = useState<AccidentCluster[]>([]);
  const [accidentWarnings, setAccidentWarnings] = useState<AccidentWarning[]>([]);

  // Route mode: 'endpoint' or 'distance'
  const [routeMode, setRouteMode] = useState<'endpoint' | 'distance'>('endpoint');
  const [targetDistance, setTargetDistance] = useState<number>(5); // km
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'miles'>('km');

  // Loading and UI states
  const [isGenerating, setIsGenerating] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [pinMode, setPinMode] = useState<'start' | 'end' | null>(null);

  // Toast states
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // View toggle state - map or selection panel
  const [viewMode, setViewMode] = useState<'map' | 'selection'>('map');

  // Map refresh key for forcing complete map remount
  const [mapRefreshKey, setMapRefreshKey] = useState(0);

  // Legend modal state
  const [showLegendModal, setShowLegendModal] = useState(false);

  // Search input states
  const [startSearchQuery, setStartSearchQuery] = useState('');
  const [endSearchQuery, setEndSearchQuery] = useState('');

  // Autocomplete suggestions
  const [startSuggestions, setStartSuggestions] = useState<MapboxFeature[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<MapboxFeature[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

  // Initialize Mapbox map
  useEffect(() => {
    console.log('[CreateRoute] useEffect triggered');
    console.log('[CreateRoute] mapContainer.current:', mapContainer.current);
    console.log('[CreateRoute] map.current:', map.current);

    if (!mapContainer.current || map.current) {
      console.log('[CreateRoute] Skipping initialization - container null or map exists');
      return;
    }

    console.log('[CreateRoute] Initializing Mapbox map...');
    console.log('[CreateRoute] Mapbox token:', mapboxgl.accessToken ? 'Set' : 'Missing');
    console.log('[CreateRoute] Container:', mapContainer.current);

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: defaultCenter,
        zoom: 13,
        attributionControl: false
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Handle map load event
      map.current.on('load', () => {
        console.log('[CreateRoute] Mapbox map loaded successfully');
        setMapLoaded(true);
        // Resize map to fit container properly
        setTimeout(() => {
          if (map.current) {
            map.current.resize();
            console.log('[CreateRoute] Map resized');
          }
        }, 100);
        fetchHazardsInView();
        fetchAccidentClusters();
      });

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('[CreateRoute] Mapbox error:', e);
        setToastMessage('Map loading error. Please refresh.');
        setShowToast(true);
      });

      // Fetch hazards when map is moved
      map.current.on('idle', fetchHazardsInView);

      console.log('[CreateRoute] Map initialization started');
    } catch (error) {
      console.error('[CreateRoute] Failed to initialize map:', error);
      setToastMessage('Map initialization failed. Check console.');
      setShowToast(true);
    }

    return () => {
      if (map.current) {
        console.log('[CreateRoute] Cleaning up map');
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load user unit preference (km/mi) and map to component units (km/miles)
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const { data: me } = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (me?.distance_unit === 'mi') setDistanceUnit('miles');
        else setDistanceUnit('km');
      } catch (_) { /* default to km */ }
    })();
  }, []);

  // Update map style when mapType changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const styleMap: Record<string, string> = {
      streets: 'mapbox://styles/mapbox/streets-v12',
      satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
      outdoors: 'mapbox://styles/mapbox/outdoors-v12'
    };

    map.current.setStyle(styleMap[mapType]);
  }, [mapType, mapLoaded]);

  // Fetch all active hazards
  const fetchHazardsInView = useCallback(async () => {
    if (!map.current) return;

    try {
      const center = map.current.getCenter();
      const response = await axios.get<{ hazards: HazardReport[] }>(
        `${import.meta.env.VITE_API_URL}/hazards/nearby`,
        {
          params: {
            lat: center.lat,
            lng: center.lng,
            radius: 1000 // 1000km radius to get all hazards
          }
        }
      );

      const fetchedHazards = response.data.hazards || [];
      setHazards(fetchedHazards);

      // Clear existing hazard markers
      hazardMarkers.current.forEach(marker => marker.remove());
      hazardMarkers.current = [];

      // Add new hazard markers
      fetchedHazards.forEach((hazard) => {
        const el = document.createElement('div');
        el.className = 'hazard-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#DC143C';
        el.style.border = '2px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        el.addEventListener('click', () => {
          setSelectedHazard(hazard);
          setShowHazardModal(true);
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([hazard.lng, hazard.lat])
          .addTo(map.current!);

        hazardMarkers.current.push(marker);
      });
    } catch (error) {
      console.error('Failed to fetch hazards:', error);
    }
  }, []);

  // Fetch accident clusters from Supabase
  const fetchAccidentClusters = useCallback(async () => {
    try {
      console.log('[CreateRoute] Fetching accident clusters...');
      const { data, error } = await supabase
        .from('accident_clusters')
        .select('cluster_id, lat, lon, count, radius_meters');

      if (error) {
        console.error('[CreateRoute] Supabase error fetching accident clusters:', error);
        console.error('[CreateRoute] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return;
      }

      const clusters = data || [];
      console.log(`[CreateRoute] Fetched ${clusters.length} accident clusters`);
      if (clusters.length > 0) {
        console.log('[CreateRoute] Sample cluster:', clusters[0]);
      } else {
        console.warn('[CreateRoute] No accident clusters found in database!');
      }
      setAccidentClusters(clusters);
    } catch (error) {
      console.error('[CreateRoute] Exception fetching accident clusters:', error);
    }
  }, []);

  // Fetch autocomplete suggestions using Mapbox Geocoding API
  const fetchSuggestions = useCallback(async (query: string, type: 'start' | 'end') => {
    if (!query || query.length < 2) {
      if (type === 'start') {
        setStartSuggestions([]);
        setShowStartSuggestions(false);
      } else {
        setEndSuggestions([]);
        setShowEndSuggestions(false);
      }
      return;
    }

    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        {
          params: {
            access_token: mapboxgl.accessToken,
            country: 'PH',
            limit: 5,
            types: 'place,locality,neighborhood,address,poi'
          }
        }
      );

      const features = response.data.features || [];

      if (type === 'start') {
        setStartSuggestions(features);
        setShowStartSuggestions(features.length > 0);
      } else {
        setEndSuggestions(features);
        setShowEndSuggestions(features.length > 0);
      }
    } catch (error) {
      console.error('Autocomplete suggestions failed:', error);
      if (type === 'start') {
        setStartSuggestions([]);
        setShowStartSuggestions(false);
      } else {
        setEndSuggestions([]);
        setShowEndSuggestions(false);
      }
    }
  }, []);

  // Select suggestion from autocomplete
  const selectSuggestion = useCallback((feature: MapboxFeature, type: 'start' | 'end') => {
    if (!map.current) return;

    const [lng, lat] = feature.center;
    const point = { lat, lng };

    if (type === 'start') {
      setStartPoint(point);
      setStartSearchQuery(feature.place_name);
      setShowStartSuggestions(false);
      setToastMessage(`✓ Start: ${feature.place_name}`);

      // Update or create start marker
      if (startMarker.current) {
        startMarker.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#10b981';
        el.style.border = '3px solid white';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '14px';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        el.textContent = 'S';

        startMarker.current = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current);
      }
    } else {
      setEndPoint(point);
      setEndSearchQuery(feature.place_name);
      setShowEndSuggestions(false);
      setToastMessage(`✓ End: ${feature.place_name}`);

      // Update or create end marker
      if (endMarker.current) {
        endMarker.current.setLngLat([lng, lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#ef4444';
        el.style.border = '3px solid white';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '14px';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        el.textContent = 'E';

        endMarker.current = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current);
      }
    }

    setShowToast(true);
    map.current.flyTo({ center: [lng, lat], zoom: 15 });
  }, []);

  // Handle map click for pinning locations
  const handleMapClick = useCallback(async (e: mapboxgl.MapMouseEvent) => {
    if (!pinMode || !map.current) return;

    const { lng, lat } = e.lngLat;
    const clickedPoint = { lat, lng };

    // Reverse geocode to get place name
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
        {
          params: {
            access_token: mapboxgl.accessToken,
            limit: 1
          }
        }
      );

      const placeName = response.data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      if (pinMode === 'start') {
        setStartPoint(clickedPoint);
        setStartSearchQuery(placeName);
        setPinMode(null);
        setToastMessage(`✓ Start: ${placeName}`);

        // Update or create start marker
        if (startMarker.current) {
          startMarker.current.setLngLat([lng, lat]);
        } else {
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#10b981';
          el.style.border = '3px solid white';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.color = 'white';
          el.style.fontWeight = 'bold';
          el.style.fontSize = '14px';
          el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
          el.textContent = 'S';

          startMarker.current = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map.current!);
        }
      } else if (pinMode === 'end' && routeMode === 'endpoint') {
        setEndPoint(clickedPoint);
        setEndSearchQuery(placeName);
        setPinMode(null);
        setToastMessage(`✓ End: ${placeName}`);

        // Update or create end marker
        if (endMarker.current) {
          endMarker.current.setLngLat([lng, lat]);
        } else {
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#ef4444';
          el.style.border = '3px solid white';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.color = 'white';
          el.style.fontWeight = 'bold';
          el.style.fontSize = '14px';
          el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
          el.textContent = 'E';

          endMarker.current = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map.current!);
        }
      }

      setShowToast(true);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      if (pinMode === 'start') {
        setStartPoint(clickedPoint);
        setStartSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setPinMode(null);
      } else if (pinMode === 'end' && routeMode === 'endpoint') {
        setEndPoint(clickedPoint);
        setEndSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setPinMode(null);
      }
      setToastMessage('Point set!');
      setShowToast(true);
    }
  }, [pinMode, routeMode]);

  // Attach map click handler with proper dependencies
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const clickHandler = (e: mapboxgl.MapMouseEvent) => {
      handleMapClick(e);
    };

    map.current.on('click', clickHandler);

    return () => {
      if (map.current) {
        map.current.off('click', clickHandler);
      }
    };
  }, [mapLoaded, handleMapClick]);

  // Update polyline on map
  const updatePolyline = useCallback((path: LatLng[]) => {
    if (!map.current || !mapLoaded) return;

    try {
      const coordinates: [number, number][] = path.map(p => [p.lng, p.lat]);

      // Remove existing route layer and source safely
      try {
        if (map.current.getLayer('route')) {
          map.current.removeLayer('route');
        }
      } catch (e) {
        console.warn('Failed to remove route layer:', e);
      }

      try {
        if (map.current.getSource('route')) {
          map.current.removeSource('route');
        }
      } catch (e) {
        console.warn('Failed to remove route source:', e);
      }

      if (coordinates.length === 0) return;

      // Add new route layer
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#92C628',
          'line-width': 5,
          'line-opacity': 0.8
        }
      });

      // Fit map to route bounds
      if (coordinates.length > 1) {
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord as [number, number]);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      console.error('Error updating polyline:', error);
    }
  }, [mapLoaded]);

  // Update polyline when generatedPath changes
  useEffect(() => {
    updatePolyline(generatedPath);
  }, [generatedPath, updatePolyline]);

  // Display accident clusters on map
  useEffect(() => {
    if (!map.current || !mapLoaded || accidentClusters.length === 0) return;

    try {
      console.log(`[CreateRoute] Displaying ${accidentClusters.length} accident clusters on map`);

      // Remove existing accident cluster layers and sources
      try {
        if (map.current.getLayer('accident-cluster-circles')) {
          map.current.removeLayer('accident-cluster-circles');
        }
      } catch (e) {
        console.warn('Failed to remove accident cluster circles layer:', e);
      }

      try {
        if (map.current.getSource('accident-clusters')) {
          map.current.removeSource('accident-clusters');
        }
      } catch (e) {
        console.warn('Failed to remove accident clusters source:', e);
      }

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

      // Add source
      map.current.addSource('accident-clusters', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });

      // Add circle layer with color-coded severity
      map.current.addLayer({
        id: 'accident-cluster-circles',
        type: 'circle',
        source: 'accident-clusters',
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

      console.log('[CreateRoute] Accident clusters displayed successfully');
    } catch (error) {
      console.error('[CreateRoute] Error displaying accident clusters:', error);
    }
  }, [accidentClusters, mapLoaded]);

  // Check if route passes near accident clusters
  const checkRouteProximityToAccidentClusters = useCallback((routePath: LatLng[], clusters: AccidentCluster[]): AccidentWarning[] => {
    const warnings: AccidentWarning[] = [];

    // Haversine distance formula (in meters)
    const calculateDistance = (point1: LatLng, point2: { lat: number; lon: number }): number => {
      const R = 6371000; // Earth's radius in meters
      const toRad = (deg: number) => deg * Math.PI / 180;

      const dLat = toRad(point2.lat - point1.lat);
      const dLon = toRad(point2.lon - point1.lng);

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in meters
    };

    // Check each cluster
    for (const cluster of clusters) {
      let isNearCluster = false;

      // Check if any point on the route is within the cluster radius
      for (const point of routePath) {
        const distance = calculateDistance(point, { lat: cluster.lat, lon: cluster.lon });

        if (distance <= cluster.radius_meters) {
          isNearCluster = true;
          break;
        }
      }

      if (isNearCluster) {
        const severity: 'high' | 'medium' | 'low' =
          cluster.count >= 30 ? 'high' :
          cluster.count >= 15 ? 'medium' : 'low';

        warnings.push({
          cluster_id: cluster.cluster_id,
          count: cluster.count,
          severity
        });
      }
    }

    return warnings;
  }, []);

  // Generate route using algorithm engine
  const handleGenerateRoute = async () => {
    // Validation based on route mode
    if (!startPoint) {
      setToastMessage('Please set a start point');
      setShowToast(true);
      return;
    }

    if (routeMode === 'endpoint' && !endPoint) {
      setToastMessage('Please set an end point');
      setShowToast(true);
      return;
    }

    if (routeMode === 'distance' && (!targetDistance || targetDistance <= 0)) {
      setToastMessage('Please enter a valid distance');
      setShowToast(true);
      return;
    }

    try {
      setDistanceInfo(null);
      setIsGenerating(true);
      setGeneratedPath([]);
      setGeneratedRoute(null);
      setShowActions(false);

      // Step 1: Call algorithm engine to get safest path
      let algoResponse;

      if (routeMode === 'distance') {
        // Distance-based routing: find safest circular route
        const distanceInKm = distanceUnit === 'miles' ? targetDistance * 1.60934 : targetDistance;
        console.log('Calling algorithm engine for distance-based route:', { start: startPoint, distance: distanceInKm });

        algoResponse = await axios.post(`${ALGO_ENGINE_URL}/route-distance`, {
          start: startPoint,
          target_distance_km: distanceInKm,
          alpha: 0.5 // Balance between distance and safety
        });
      } else {
        // Endpoint-based routing: find safest path to destination
        console.log('Calling algorithm engine with:', { start: startPoint, end: endPoint });
        algoResponse = await axios.post(`${ALGO_ENGINE_URL}/route-osm`, {
          start: startPoint,
          end: endPoint,
          alpha: 0.5 // Balance between distance and safety
        });
      }

      const coordinates = algoResponse.data.coordinates;
      const safetyData = algoResponse.data.safety;
      const distanceInfoData = algoResponse.data.distance_info;

      if (routeMode === 'distance') {
        setDistanceInfo(distanceInfoData ?? null);
      } else {
        setDistanceInfo(null);
      }

      console.log('Algorithm returned', coordinates?.length || 0, 'coordinates');
      console.log('Safety analysis:', safetyData);

      // Use safety warnings directly from algorithm engine (no GPT enhancement for web)
      if (safetyData) {
        setSafetyAnalysis(safetyData);
      }

      if (!coordinates || coordinates.length === 0) {
        throw new Error('No route found. Try different points or check if they are accessible.');
      }

      // Convert coordinates to correct format
      // Algorithm returns arrays: [[lat1, lng1], [lat2, lng2], ...]
      const pathPoints: LatLng[] = coordinates.map((coord: any) => {
        // Accept a few common formats from algorithm backends
        if (Array.isArray(coord) && coord.length >= 2) {
          let a = parseFloat(coord[0]);
          let b = parseFloat(coord[1]);
          // Detect [lon, lat] vs [lat, lon] and normalize to {lat, lng}
          // Valid latitude range: [-90, 90]; longitude: [-180, 180]
          const looksLikeLatLon = Math.abs(a) <= 90 && Math.abs(b) <= 180;
          const looksLikeLonLat = Math.abs(a) <= 180 && Math.abs(b) <= 90;
          if (looksLikeLatLon && !looksLikeLonLat) {
            return { lat: a, lng: b };
          }
          if (looksLikeLonLat && !looksLikeLatLon) {
            return { lat: b, lng: a };
          }
          // Ambiguous: default to [lat, lon]
          return { lat: a, lng: b };
        } else if (coord && typeof coord === 'object') {
          if (coord.lat !== undefined && coord.lng !== undefined) {
            return { lat: parseFloat(coord.lat), lng: parseFloat(coord.lng) };
          }
          if (coord.latitude !== undefined && coord.longitude !== undefined) {
            return { lat: parseFloat(coord.latitude), lng: parseFloat(coord.longitude) };
          }
          if (coord.lat !== undefined && coord.lon !== undefined) {
            return { lat: parseFloat(coord.lat), lng: parseFloat(coord.lon) };
          }
        }
        console.error('Invalid coordinate format:', coord);
        return { lat: 0, lng: 0 };
      }).filter((p: LatLng) => p.lat !== 0 && p.lng !== 0);

      console.log('Converted to', pathPoints.length, 'path points');

      // Choose an endpoint for saving/display
      let chosenEnd: LatLng | null = null;
      if (routeMode === 'endpoint') {
        chosenEnd = endPoint && pathPoints.length > 0 ? endPoint : (pathPoints[pathPoints.length - 1] ?? null);
      } else if (routeMode === 'distance' && pathPoints.length > 0) {
        // Default to last path point
        chosenEnd = pathPoints[pathPoints.length - 1];
        // If the route is a loop (end approx start), pick the farthest point from the start as visual endpoint
        if (startPoint) {
          const toRad = (deg: number) => deg * Math.PI / 180;
          const haversineKm = (a: LatLng, b: LatLng) => {
            const R = 6371;
            const dLat = toRad(b.lat - a.lat);
            const dLng = toRad(b.lng - a.lng);
            const s = Math.sin(dLat/2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2) ** 2;
            return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
          };
          const distToStart = haversineKm(startPoint, chosenEnd);
          if (distToStart < 0.05) { // approx 50 meters threshold
            let best = chosenEnd;
            let bestDist = distToStart;
            for (const p of pathPoints) {
              const d = haversineKm(startPoint, p);
              if (d > bestDist) { bestDist = d; best = p; }
            }
            chosenEnd = best;
          }
        }
        // Update end marker to the chosen endpoint
        setEndPoint(chosenEnd);
      }

      // Determine if the returned path is a closed loop (end near start)
      const isClosedLoop = (() => {
        if (!startPoint || pathPoints.length < 2) return false;
        const toRad = (deg: number) => deg * Math.PI / 180;
        const haversineKm = (a: LatLng, b: LatLng) => {
          const R = 6371;
          const dLat = toRad(b.lat - a.lat);
          const dLng = toRad(b.lng - a.lng);
          const s = Math.sin(dLat/2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2) ** 2;
          return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
        };
        return haversineKm(startPoint, pathPoints[pathPoints.length - 1]) < 0.05;
      })();

      // Align polyline endpoints exactly to the selected pins (to avoid subtle offsets)
      if (pathPoints.length > 0 && startPoint) {
        pathPoints[0] = { lat: +startPoint.lat.toFixed(6), lng: +startPoint.lng.toFixed(6) };
      }
      if (pathPoints.length > 1 && chosenEnd && !isClosedLoop) {
        pathPoints[pathPoints.length - 1] = { lat: +chosenEnd.lat.toFixed(6), lng: +chosenEnd.lng.toFixed(6) };
      }

      // Do not render the interim path; render the saved path returned by backend below

      // Check for accident cluster proximity
      const clusterWarnings = checkRouteProximityToAccidentClusters(pathPoints, accidentClusters);
      setAccidentWarnings(clusterWarnings);
      if (clusterWarnings.length > 0) {
        console.log(`[CreateRoute] Route passes through ${clusterWarnings.length} accident-prone area(s)`);
      }

      // Step 2: Save route to backend with status 'generated'
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Please log in to create routes');
      }

      // Calculate distance based on path points
      const calculateDistance = (points: LatLng[]): number => {
        let total = 0;
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          // Haversine formula
          const R = 6371; // Earth's radius in km
          const dLat = (curr.lat - prev.lat) * Math.PI / 180;
          const dLng = (curr.lng - prev.lng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          total += R * c;
        }
        return total;
      };

      const distanceKm = calculateDistance(pathPoints);

      // Estimate duration based on average running pace (5 min/km)
      const estimatedPace = 5.5; // min/km
      const estimatedDuration = Math.round(distanceKm * estimatedPace * 60); // seconds

      console.log('Route stats:', { distanceKm, estimatedDuration });

      const routeResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/routes/generate`,
        {
          start_lat: startPoint.lat,
          start_lng: startPoint.lng,
          end_lat: (chosenEnd ?? pathPoints[pathPoints.length - 1]).lat,
          end_lng: (chosenEnd ?? pathPoints[pathPoints.length - 1]).lng,
          chosen_path: pathPoints,
          duration_seconds: estimatedDuration,
          average_pace: estimatedPace,
          route_name: routeName || (routeMode === 'distance' ? `${targetDistance} ${distanceUnit} Run` : 'Unnamed Route'),
          risk_score: 0.2, // Default low risk
          visibility: 'private'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Route saved to backend:', routeResponse.data.route);
      const savedRoute = routeResponse.data.route;
      setGeneratedRoute(savedRoute);

      // Parse chosen_path from saved route and render exactly what is persisted
      let savedPath: any = savedRoute?.chosen_path;
      try {
        savedPath = typeof savedPath === 'string' ? JSON.parse(savedPath) : savedPath;
      } catch {
        // keep as-is
      }
      const drawingPoints: LatLng[] = Array.isArray(savedPath)
        ? savedPath
            .map((p: any) => ({
              lat: parseFloat(p.lat ?? p.latitude),
              lng: parseFloat(p.lng ?? p.lon ?? p.longitude),
            }))
            .filter((p: LatLng) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        : [];

      if (drawingPoints.length > 0) {
        setGeneratedPath(drawingPoints);
      } else {
        // Fallback to algorithm path if parsing failed
        setGeneratedPath(pathPoints);
      }
      setShowActions(true);

      // Polyline rendering and fitBounds are handled automatically by updatePolyline()

      setToastMessage(`Route generated! Distance: ${distanceKm.toFixed(2)} km`);
      setShowToast(true);

    } catch (error: any) {
      console.error('Route generation failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate route';
      setToastMessage(errorMessage);
      setShowToast(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated route
  const handleSaveRoute = async () => {
    if (!generatedRoute) {
      setToastMessage('No route to save');
      setShowToast(true);
      return;
    }

    try {
      setToastMessage('Saving route...');
      setShowToast(true);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Please log in to save routes');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/saved-routes/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            route_id: generatedRoute.route_id, //  send here
          }),
        }
      );

      const responseData = await response.json();
      console.log('Route saved successfully:', responseData);

      setToastMessage('Route saved successfully! Redirecting...');
      setShowToast(true);

      // Navigate to routes page after a delay
      setTimeout(() => {
        history.push('/routes');
      }, 1500);

    } catch (error: any) {
      console.error('Save route failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save route';
      setToastMessage(`Error: ${errorMessage}`);
      setShowToast(true);
    }
  };

  const handleUseGeneratedRoute = () => {
    if (!generatedRoute) {
      setToastMessage('Generate a route first');
      setShowToast(true);
      return;
    }

    const payload = buildGuidedRoutePayload(
      {
        ...generatedRoute,
        snapshot_url: (generatedRoute as any)?.snapshot_url ?? null,
        description: generatedRoute.route_name,
      } as any,
      generatedPath.length ? generatedPath : (generatedRoute.chosen_path ?? []),
    );

    history.push('/run-tracking', { guidedRoute: payload });
  };

  // Cancel route creation
  const handleCancel = () => {
    // Clear all route-related state
    setGeneratedPath([]);
    setGeneratedRoute(null);
    setSafetyAnalysis(null);
    setShowActions(false);
    setDistanceInfo(null);

    // Clear markers
    if (startMarker.current) {
      startMarker.current.remove();
      startMarker.current = null;
    }
    if (endMarker.current) {
      endMarker.current.remove();
      endMarker.current = null;
    }

    setStartPoint(null);
    setEndPoint(null);

    // Clear input fields
    setRouteName('');
    setStartSearchQuery('');
    setEndSearchQuery('');

    // Reset pin mode
    setPinMode(null);

    // Clear route layer from map
    if (map.current) {
      try {
        if (map.current.getLayer('route')) {
          map.current.removeLayer('route');
        }
        if (map.current.getSource('route')) {
          map.current.removeSource('route');
        }
      } catch (e) {
        console.warn('Failed to clear route layer:', e);
      }
    }

    setToastMessage('Route cancelled');
    setShowToast(true);
  };

  const formatDisplayDistance = (valueKm: number) => {
    if (distanceUnit === 'km') {
      return `${valueKm.toFixed(2)} km`;
    }
    return `${kmToMiles(valueKm).toFixed(2)} miles`;
  };

  const handleBack = () => {
    history.push('/routes');
  };

  return (
    <IonPage>
      <IonHeader translucent className="route-builder-topbar">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={handleBack}>
              <IonIcon icon={arrowBackOutline} slot="start" />
              Routes
            </IonButton>
          </IonButtons>
          <IonTitle>Create Route</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="route-builder-content">
        <div className="route-builder-container">
          {/* View Toggle Button */}
          <button
            className="create-route-view-toggle"
            onClick={() => {
              const newMode = viewMode === 'map' ? 'selection' : 'map';
              setViewMode(newMode);

              // Refresh map when switching to map view to prevent black screen
              if (newMode === 'map' && map.current) {
                setTimeout(() => {
                  console.log('[CreateRoute] Resizing map on view toggle');
                  map.current?.resize();
                }, 100);
              }
            }}
          >
            <IonIcon icon={viewMode === 'map' ? listOutline : mapOutline} />
            {viewMode === 'map' ? 'Show inputs' : 'Show map'}
          </button>

          {/* Selection Panel (Sidebar) */}
          <div className={`create-route-sidebar ${viewMode === 'selection' ? 'visible' : ''}`}>
            <div className="create-route-sidebar-header">
              <h1 className="create-route-main-title">Create a New Route</h1>
              <p className="create-route-subtitle">
                Create a safe running route by searching or pinning locations.
                The app will find the safest path for you.
              </p>
            </div>

            {/* Route Name */}
            <div className="create-route-section-card">
              <div className="create-route-section-header">
                <div className="create-route-step-number">1</div>
                <div className="create-route-section-title-wrapper">
                  <span className="create-route-section-title">ROUTE NAME</span>
                </div>
              </div>
              <IonInput
                value={routeName}
                onIonChange={(e) => setRouteName(e.detail.value!)}
                placeholder="Enter route name (optional)"
                className="create-route-location-input"
              />
            </div>

            {/* Starting Point Section */}
            <div className="create-route-section-card">
              <div className="create-route-section-header">
                <div className="create-route-step-number">2</div>
                <div className="create-route-section-title-wrapper">
                  <span className="create-route-section-title">STARTING POINT</span>
                </div>
              </div>

              <div className="input-with-suggestions">
                <div className="input-wrapper">
                  <IonInput
                    value={startSearchQuery}
                    onIonChange={(e) => {
                      const value = e.detail.value!;
                      setStartSearchQuery(value);
                      fetchSuggestions(value, 'start');
                    }}
                    placeholder="Type to search location..."
                    className="create-route-location-input"
                    disabled={pinMode === 'start'}
                  />
                  <IonButton
                    fill="clear"
                    className="pin-icon-button"
                    onClick={() => {
                      const newPinMode = pinMode === 'start' ? null : 'start';
                      setPinMode(newPinMode);
                      if (newPinMode === 'start') {
                        setViewMode('map');
                      }
                    }}
                  >
                    <IonIcon
                      icon={pinOutline}
                      className={pinMode === 'start' ? 'pin-active' : ''}
                    />
                  </IonButton>
                </div>

                {/* Autocomplete Suggestions */}
                {showStartSuggestions && startSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    <div className="suggestions-header">
                      <span className="suggestions-title">Select Location</span>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => setShowStartSuggestions(false)}
                        className="suggestions-close"
                      >
                        <IonIcon icon={closeCircleOutline} />
                      </IonButton>
                    </div>
                    {startSuggestions.map((feature, index) => {
                      return (
                        <div
                          key={`start-${index}`}
                          className="suggestion-item"
                          onClick={() => selectSuggestion(feature, 'start')}
                        >
                          <IonIcon icon={locationOutline} className="suggestion-icon" />
                          <div className="suggestion-text">
                            <div className="suggestion-main">{feature.text}</div>
                            <div className="suggestion-secondary">{feature.place_name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {startPoint && (
                <IonText color="success" className="point-set-text">
                  Location set
                </IonText>
              )}
            </div>

            {/* Route Mode Selection */}
            <div className="create-route-section-card">
              <div className="create-route-section-header">
                <div className="create-route-step-number">3</div>
                <div className="create-route-section-title-wrapper">
                  <span className="create-route-section-title">ROUTE TYPE</span>
                </div>
              </div>

              <div className="mode-selector">
                <div
                  className={`mode-option ${routeMode === 'endpoint' ? 'active' : ''}`}
                  onClick={() => {
                    setRouteMode('endpoint');
                    setEndPoint(null);
                    setEndSearchQuery('');
                  }}
                >
                  <IonIcon icon={navigateOutline} className="mode-icon" />
                  <div className="mode-content">
                    <div className="mode-title">Choose Destination</div>
                    <div className="mode-desc">Set a specific end point</div>
                  </div>
                </div>

                <div
                  className={`mode-option ${routeMode === 'distance' ? 'active' : ''}`}
                  onClick={() => {
                    setRouteMode('distance');
                    setEndPoint(null);
                    setEndSearchQuery('');
                    setPinMode(null);
                  }}
                >
                  <IonIcon icon={navigateOutline} className="mode-icon" />
                  <div className="mode-content">
                    <div className="mode-title">Choose Distance</div>
                    <div className="mode-desc">Auto-find safe circular route</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Distance-based Configuration */}
            {routeMode === 'distance' && (
              <div className="create-route-section-card">
                <div className="create-route-section-header">
                  <div className="create-route-step-number">4</div>
                  <div className="create-route-section-title-wrapper">
                    <span className="create-route-section-title">TARGET DISTANCE</span>
                    <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', color: '#6b7280', fontSize: 12 }}>
                      <IonIcon icon={informationCircleOutline} style={{ marginRight: 4, fontSize: 14 }} />
                      Distance is approximate - safety prioritized
                    </span>
                  </div>
                </div>

                <div className="distance-config">
                  <div className="distance-input-wrapper">
                    <IonInput
                      type="number"
                      value={targetDistance}
                      onIonChange={(e) => setTargetDistance(parseFloat(e.detail.value!) || 5)}
                      placeholder="Enter distance"
                      className="distance-input"
                      min="0.5"
                      step="0.5"
                    />
                    <div className="unit-toggle">
                      <button
                        className={`unit-btn ${distanceUnit === 'km' ? 'active' : ''}`}
                        onClick={() => setDistanceUnit('km')}
                      >
                        KM
                      </button>
                      <button
                        className={`unit-btn ${distanceUnit === 'miles' ? 'active' : ''}`}
                        onClick={() => setDistanceUnit('miles')}
                      >
                        Miles
                      </button>
                    </div>
                  </div>
                  <div className="distance-info">
                    {distanceUnit === 'km'
                      ? `approx. ${(targetDistance * 0.621371).toFixed(2)} miles`
                      : `approx. ${(targetDistance * 1.60934).toFixed(2)} km`
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Endpoint-based Configuration */}
            {routeMode === 'endpoint' && (
              <div className="create-route-section-card">
                <div className="create-route-section-header">
                  <div className="create-route-step-number">4</div>
                  <div className="create-route-section-title-wrapper">
                    <span className="create-route-section-title">DESTINATION</span>
                  </div>
                </div>

                <div className="input-with-suggestions">
                  <div className="input-wrapper">
                    <IonInput
                      value={endSearchQuery}
                      onIonChange={(e) => {
                        const value = e.detail.value!;
                        setEndSearchQuery(value);
                        fetchSuggestions(value, 'end');
                      }}
                      placeholder="Type to search destination..."
                      className="create-route-location-input"
                      disabled={pinMode === 'end'}
                    />
                    <IonButton
                      fill="clear"
                      className="pin-icon-button"
                      onClick={() => {
                        const newPinMode = pinMode === 'end' ? null : 'end';
                        setPinMode(newPinMode);
                        if (newPinMode === 'end') {
                          setViewMode('map');
                        }
                      }}
                    >
                      <IonIcon
                        icon={pinOutline}
                        className={pinMode === 'end' ? 'pin-active' : ''}
                      />
                    </IonButton>
                  </div>

                  {/* Autocomplete Suggestions */}
                  {showEndSuggestions && endSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      <div className="suggestions-header">
                        <span className="suggestions-title">Select Destination</span>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => setShowEndSuggestions(false)}
                          className="suggestions-close"
                        >
                          <IonIcon icon={closeCircleOutline} />
                        </IonButton>
                      </div>
                      {endSuggestions.map((feature, index) => {
                        return (
                          <div
                            key={`end-${index}`}
                            className="suggestion-item"
                            onClick={() => selectSuggestion(feature, 'end')}
                          >
                            <IonIcon icon={locationOutline} className="suggestion-icon" />
                            <div className="suggestion-text">
                              <div className="suggestion-main">{feature.text}</div>
                              <div className="suggestion-secondary">{feature.place_name}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {endPoint && (
                  <IonText color="success" className="point-set-text">
                    Location set
                  </IonText>
                )}
              </div>
            )}

            {/* Generate Route Button */}
            {!showActions && (
              <IonButton
                expand="block"
                className="next-button"
                onClick={handleGenerateRoute}
                disabled={
                  !startPoint ||
                  (routeMode === 'endpoint' && !endPoint) ||
                  (routeMode === 'distance' && (!targetDistance || targetDistance <= 0)) ||
                  isGenerating
                }
              >
                {isGenerating ? (
                  <>
                    <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                    Generating Route...
                  </>
                ) : routeMode === 'distance' ? (
                  `Generate ${targetDistance} ${distanceUnit} Route`
                ) : (
                  'Generate Safe Route'
                )}
              </IonButton>
            )}

            {/* Action Buttons (Save/Cancel) */}
            {showActions && generatedRoute && (
              <div className="action-buttons">
                <IonCard className="route-info-card">
                  <IonCardContent>
                    <h3>{generatedRoute.route_name}</h3>
                    {/* Quick unit toggle for displayed stats */}
                    <div style={{ display: 'flex', gap: 8, margin: '6px 0 10px' }}>
                      <button
                        className={`unit-btn ${distanceUnit === 'km' ? 'active' : ''}`}
                        onClick={() => setDistanceUnit('km')}
                        style={{ padding: '4px 10px' }}
                      >
                        KM
                      </button>
                      <button
                        className={`unit-btn ${distanceUnit === 'miles' ? 'active' : ''}`}
                        onClick={() => setDistanceUnit('miles')}
                        style={{ padding: '4px 10px' }}
                      >
                        Miles
                      </button>
                    </div>

                      <div className="route-stats">
                        <div className="stat-item">
                          <span className="stat-label">Distance</span>
                          <span className="stat-value">
                            {distanceUnit === 'km'
                              ? `${(distanceInfo?.generated_distance_km ?? generatedRoute.distance_km).toFixed(2)} km`
                              : `${kmToMiles(distanceInfo?.generated_distance_km ?? generatedRoute.distance_km).toFixed(2)} miles`}
                          </span>
                        </div>
                      <div className="stat-item">
                        <span className="stat-label">Est. Time</span>
                        <span className="stat-value">{Math.round(generatedRoute.duration_seconds / 60)} min</span>
                      </div>
                    </div>
                </IonCardContent>
              </IonCard>

              {routeMode === 'distance' && distanceInfo && (
                <div
                  className={`distance-warning-banner ${distanceInfo.distance_warning ? 'warning' : 'success'}`}
                >
                  {distanceInfo.distance_warning ? (
                    <>
                      <strong>Safety first.</strong> We couldn't find a safe{' '}
                      {formatDisplayDistance(distanceInfo.requested_distance_km)} loop starting here. This route covers{' '}
                      <strong>{formatDisplayDistance(distanceInfo.generated_distance_km)}</strong> to avoid hazards near
                      your start point. Try choosing another start location if you need an exact distance.
                    </>
                  ) : (
                    <>
                      <strong>Great news!</strong> This route closely matches your{' '}
                      {formatDisplayDistance(distanceInfo.requested_distance_km)} target while keeping you on the safest
                      streets nearby.
                    </>
                  )}
                </div>
              )}

              {/* Accident Cluster Warnings */}
              {accidentWarnings.length > 0 && (
                <div className="accident-warning-banner">
                  <div className="accident-warning-header">
                    <IonIcon icon={warningOutline} className="accident-warning-icon" />
                    <span className="accident-warning-title">
                      Route passes through {accidentWarnings.length} accident-prone area{accidentWarnings.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="accident-warning-details">
                    {accidentWarnings
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 3)
                      .map((warning, index) => (
                        <div key={warning.cluster_id} className={`accident-warning-item severity-${warning.severity}`}>
                          <span className="accident-cluster-label">Cluster #{warning.cluster_id}</span>
                          <span className="accident-count">{warning.count} recorded accidents</span>
                          <span className={`accident-severity-badge ${warning.severity}`}>
                            {warning.severity === 'high' ? 'High Risk' : warning.severity === 'medium' ? 'Medium Risk' : 'Low Risk'}
                          </span>
                        </div>
                      ))}
                    {accidentWarnings.length > 3 && (
                      <div className="accident-warning-more">
                        +{accidentWarnings.length - 3} more area{accidentWarnings.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div className="accident-warning-advice">
                    Stay extra vigilant in these zones. Historical accident data indicates higher risk areas.
                  </div>
                </div>
              )}

                {/* Safety Warnings Card */}
                {safetyAnalysis && safetyAnalysis.warnings.length > 0 && (
                  <IonCard className="safety-warnings-card">
                    <IonCardContent>
                      <h3 className="safety-warnings-title">Safety Information</h3>
                      <div className="warnings-list">
                        {safetyAnalysis.warnings.map((warning, index) => (
                          <div
                            key={index}
                            className={`warning-item severity-${warning.severity}`}
                          >
                            <div className="warning-message">{warning.message}</div>
                            {warning.advice && warning.advice.trim() !== '' && (
                              <div className="warning-advice">{warning.advice}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </IonCardContent>
                  </IonCard>
                )}

                <div className="action-button-group">
                  <IonButton expand="block" className="save-button" onClick={handleSaveRoute}>
                    <IonIcon icon={saveOutline} slot="start" />
                    Save Route
                  </IonButton>

                  <IonButton expand="block" color="dark" onClick={handleUseGeneratedRoute}>
                    <IonIcon icon={navigateOutline} slot="start" />
                    Use this route
                  </IonButton>

                  <IonButton
                    expand="block"
                    fill="outline"
                    className="cancel-button"
                    onClick={handleCancel}
                  >
                    <IonIcon icon={closeCircleOutline} slot="start" />
                    Cancel
                  </IonButton>
                </div>
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className={`map-container ${pinMode ? 'pin-mode-active' : ''}`}>
            <div className="map-tabs">
              <div className="map-tabs-left">
                <button
                  className={`map-tab ${mapType === 'streets' ? 'active' : ''}`}
                  onClick={() => setMapType('streets')}
                >
                  Map
                </button>
                <button
                  className={`map-tab ${mapType === 'satellite' ? 'active' : ''}`}
                  onClick={() => setMapType('satellite')}
                >
                  Satellite
                </button>
                <button
                  className={`map-tab ${mapType === 'outdoors' ? 'active' : ''}`}
                  onClick={() => setMapType('outdoors')}
                >
                  Outdoors
                </button>
              </div>
              <button
                className="legend-toggle-btn"
                onClick={() => setShowLegendModal(true)}
                title="Map Legend"
              >
                <IonIcon icon={informationCircleOutline} />
              </button>
            </div>

            {/* Mapbox Map Container */}
            <div ref={mapContainer} style={mapContainerStyle} />

            {/* Pin Mode Indicator */}
            {pinMode && (
              <div className="pin-mode-indicator">
                <IonIcon icon={pinOutline} />
                <span>Click on the map to set {pinMode === 'start' ? 'start' : 'end'} point</span>
              </div>
            )}
          </div>
        </div>

        {/* Toast for notifications */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
        />

        {/* Instagram-style Hazard Detail Modal */}
        <IonModal
          isOpen={showHazardModal}
          onDidDismiss={() => {
            setShowHazardModal(false);
            setSelectedHazard(null);
          }}
          className="hazard-detail-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Hazard Details</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowHazardModal(false)}>
                  <IonIcon icon={closeCircleOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="hazard-modal-content">
            {selectedHazard && (
              <div className="hazard-detail-container">
                {/* Hazard Image - only show if image_url exists and is not null/empty */}
                {selectedHazard.image_url && selectedHazard.image_url.trim() !== '' && (
                  <div className="hazard-image-container" id={`hazard-img-container-${selectedHazard.report_id}`}>
                    <img
                      src={selectedHazard.image_url}
                      alt={selectedHazard.title}
                      className="hazard-image"
                      onError={() => {
                        console.warn('[CreateRoute Mobile] Hazard image failed to load:', selectedHazard.image_url);
                        // Hide the entire image container when image fails to load
                        const container = document.getElementById(`hazard-img-container-${selectedHazard.report_id}`);
                        if (container) {
                          container.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                )}

                {/* Hazard Info */}
                <div className="hazard-info">
                  <div className="hazard-header">
                    <div className="hazard-user-info">
                    <img
                      src={selectedHazard.users?.profile_picture || DEFAULT_AVATAR}
                      alt={selectedHazard.users?.username || 'Anonymous'}
                      className="user-avatar"
                    />
                      <div className="user-details">
                        <span className="username">
                          {selectedHazard.users?.username || 'Anonymous'}
                        </span>
                        <span className="report-time">
                          {new Date(selectedHazard.reported_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="hazard-severity">
                      <span className={`severity-badge severity-${Math.round(selectedHazard.severity_weight * 10)}`}>
                        {selectedHazard.incident_type}
                      </span>
                    </div>
                  </div>

                  <div className="hazard-content">
                    <h2 className="hazard-title">{selectedHazard.title}</h2>
                    <p className="hazard-description">
                      {selectedHazard.description || 'No additional details provided.'}
                    </p>

                    <div className="hazard-stats">
                      <div className="stat">
                        <span className="stat-label">Trust Score</span>
                        <span className="stat-value">
                          {(selectedHazard.trust_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Status</span>
                        <span className={`stat-value status-${selectedHazard.status}`}>
                          {selectedHazard.status}
                        </span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Location</span>
                        <span className="stat-value">
                          {selectedHazard.lat.toFixed(4)}, {selectedHazard.lng.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Map Legend Modal */}
        <IonModal
          isOpen={showLegendModal}
          onDidDismiss={() => setShowLegendModal(false)}
          className="legend-modal"
          breakpoints={[0, 0.6, 0.75]}
          initialBreakpoint={0.6}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Map Legend</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowLegendModal(false)}>
                  <IonIcon icon={closeCircleOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="legend-modal-content">
            <div className="legend-content-wrapper">
              {/* User-Reported Hazards */}
              <div className="legend-section">
                <h4 className="legend-section-title">User-Reported Hazards</h4>
                <div className="legend-item">
                  <div className="legend-color-sample hazard-sample"></div>
                  <div className="legend-item-text">
                    <span className="legend-item-name">Active Hazard</span>
                    <span className="legend-item-desc">Crimson Red</span>
                  </div>
                </div>
              </div>

              {/* Accident Clusters */}
              <div className="legend-section">
                <h4 className="legend-section-title">Accident Clusters (Historical Data)</h4>

                <div className="legend-item">
                  <div className="legend-color-sample cluster-low"></div>
                  <div className="legend-item-text">
                    <span className="legend-item-name">Low Severity</span>
                    <span className="legend-item-desc">Yellow-Orange • &lt; 15 accidents</span>
                  </div>
                </div>

                <div className="legend-item">
                  <div className="legend-color-sample cluster-medium"></div>
                  <div className="legend-item-text">
                    <span className="legend-item-name">Medium Severity</span>
                    <span className="legend-item-desc">Dark Orange • 15-29 accidents</span>
                  </div>
                </div>

                <div className="legend-item">
                  <div className="legend-color-sample cluster-high"></div>
                  <div className="legend-item-text">
                    <span className="legend-item-name">High Severity</span>
                    <span className="legend-item-desc">Vivid Orange • ≥ 30 accidents</span>
                  </div>
                </div>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default CreateRouteMap;
