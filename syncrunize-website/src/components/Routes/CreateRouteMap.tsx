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
  IonButtons,
  IonLabel,
  IonItem
} from '@ionic/react';
import {
  navigateOutline,
  arrowBackOutline,
  closeCircleOutline,
  saveOutline,
  pinOutline,
  locationOutline,
  informationCircleOutline,
  warningOutline,
  trashOutline,
  checkmarkCircle,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import { supabase } from '../../supabaseClient';
import { DEFAULT_AVATAR } from '../../constants/avatar';
import { kmToMiles } from '../../utils/distanceConverter';
import { clusterHazards, calculateCentroid, SPIDERFY_CONFIG } from '../../utils/hazardClustering';
import UnifiedMapPanel from './UnifiedMapPanel';
import './CreateRouteMap.css';

// Mapbox configuration
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Default center (Tarlac, Philippines)
const defaultCenter: [number, number] = [120.5963, 15.4755]; // [lng, lat]

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
  cached_address?: string | null; // Human-readable address from reverse geocoding
  image_url: string | null;
  reported_at: string;
  severity_weight: number;
  trust_score: number;
  status: string;
  users?: {
    username: string;
    profile_picture: string | null;
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
  console.log('[CreateRoute Web] Component rendering...');
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
  const [styleVersion, setStyleVersion] = useState(0); // Track style changes to re-render layers
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
  const hazardClusters = useRef<Map<string, HazardReport[]>>(new Map());

  // Track zoom state for responsive spiderfy
  const lastZoomState = useRef<'spiderfied' | 'clustered' | 'hidden' | null>(null);

  // Hazard states
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [selectedHazard, setSelectedHazard] = useState<HazardReport | null>(null);
  const [showHazardModal, setShowHazardModal] = useState(false);
  const [userToken, setUserToken] = useState<string | undefined>(undefined);

  // Hazard confirmation states
  const [userConfirmations, setUserConfirmations] = useState<Set<number>>(new Set());

  // Accident cluster states
  const [accidentClusters, setAccidentClusters] = useState<AccidentCluster[]>([]);
  const [accidentWarnings, setAccidentWarnings] = useState<AccidentWarning[]>([]);
  const [showAccidentClusters, setShowAccidentClusters] = useState(false); // Toggle for cluster visibility

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

  // Search input states
  const [startSearchQuery, setStartSearchQuery] = useState('');
  const [endSearchQuery, setEndSearchQuery] = useState('');

  // Autocomplete suggestions
  const [startSuggestions, setStartSuggestions] = useState<MapboxFeature[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<MapboxFeature[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

  // Mobile sidebar state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    

// Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('[CreateRoute Web] Initializing map...');
    console.log('[CreateRoute Web] Container dimensions:', {
      width: mapContainer.current.clientWidth,
      height: mapContainer.current.clientHeight,
      offsetWidth: mapContainer.current.offsetWidth,
      offsetHeight: mapContainer.current.offsetHeight
    });

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: defaultCenter,
      zoom: 13
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Fetch hazards when map is loaded
    map.current.on('load', () => {
      console.log('[CreateRoute Web] Map loaded successfully');
      setMapLoaded(true);
      // Multiple resize attempts to ensure proper rendering
      setTimeout(() => {
        if (map.current) {
          console.log('[CreateRoute Web] First resize');
          map.current.resize();
        }
      }, 100);
      setTimeout(() => {
        if (map.current) {
          console.log('[CreateRoute Web] Second resize');
          map.current.resize();
        }
      }, 500);
      setTimeout(() => {
        if (map.current) {
          console.log('[CreateRoute Web] Third resize');
          map.current.resize();
        }
      }, 1000);

      fetchHazardsInView();
      fetchAccidentClusters();
    });

    // NOTE: Removed 'moveend' listener - it was causing constant re-rendering
    // because map.resize() operations trigger moveend events repeatedly.
    // Hazards now only fetch on initial map load.

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty deps - map initialization runs once

  // Handle map resize on window resize (important for mobile)
  useEffect(() => {
    const handleResize = () => {
      if (map.current && mapLoaded) {
        setTimeout(() => {
          map.current?.resize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Force initial resize for mobile after a delay
    const initialResize = setTimeout(() => {
      if (map.current && mapLoaded) {
        console.log('[CreateRoute Web] Forcing map resize for mobile');
        map.current.resize();
      }
    }, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialResize);
    };
  }, [mapLoaded]);
  

  // Load user unit preference (km/mi) and user token
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        // Store user token for HazardListPanel
        setUserToken(session.access_token);

        const { data: me } = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (me?.distance_unit === 'mi') setDistanceUnit('miles');
        else setDistanceUnit('km');
      } catch (_) { /* default to km */ }
    })();
  }, []);

  // Fetch user confirmations when token and hazards are available
  useEffect(() => {
    if (userToken && hazards.length > 0) {
      fetchUserConfirmations();
    }
  }, [userToken, hazards]);

  const fetchUserConfirmations = async () => {
    if (!userToken) return;

    try {
      const confirmationSet = new Set<number>();
      const promises = hazards.map(async (hazard) => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/confirmations/${hazard.report_id}/check`,
            { headers: { Authorization: `Bearer ${userToken}` } }
          );
          if (response.data.confirmed) {
            confirmationSet.add(hazard.report_id);
          }
        } catch (error) {
          console.error(`Error checking confirmation for hazard ${hazard.report_id}:`, error);
        }
      });
      await Promise.all(promises);
      setUserConfirmations(confirmationSet);
    } catch (error) {
      console.error('Error fetching user confirmations:', error);
    }
  };

  // Update map style when mapType changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const styleMap: Record<string, string> = {
      streets: 'mapbox://styles/mapbox/streets-v12',
      satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
      outdoors: 'mapbox://styles/mapbox/outdoors-v12'
    };

    console.log('[CreateRoute Web] Changing map style to:', mapType);
    map.current.setStyle(styleMap[mapType]);

    // Re-render layers after style loads
    map.current.once('style.load', () => {
      console.log('[CreateRoute Web] Style loaded');
      setStyleVersion(prev => prev + 1);
      fetchHazardsInView(); // Re-add HTML markers
    });
  }, [mapType, mapLoaded]);

  // Update marker visibility and size based on zoom level
  const updateMarkersForZoom = useCallback(() => {
    if (!map.current) return;

    const zoom = map.current.getZoom();
    const minZoom = 12; // Only show markers at zoom 12+ (street/neighborhood view)

    hazardMarkers.current.forEach(marker => {
      const el = marker.getElement();

      // Skip spiderfied markers - they use translate() transforms
      if (el.classList.contains('hazard-marker-spiderfied')) {
        el.style.display = 'flex';  // Ensure visibility
        return;
      }

      if (zoom < minZoom) {
        // Hide markers when zoomed out too far
        el.style.display = 'none';
      } else {
        // Show markers and scale based on zoom level
        el.style.display = 'flex';

        // Responsive sizing: 0.7x at zoom 12, 1.0x at zoom 15, 1.3x at zoom 18+
        let scale = 0.7;
        if (zoom >= 15) {
          scale = 1.0 + ((zoom - 15) * 0.1); // Grows after zoom 15
        } else {
          scale = 0.7 + ((zoom - 12) * 0.1); // Grows from zoom 12 to 15
        }
        scale = Math.min(scale, 1.3); // Max 1.3x

        el.style.transform = `scale(${scale})`;
      }
    });
  }, []);

  // Create a single hazard marker (non-clustered)
  const createSingleHazardMarker = useCallback((hazard: HazardReport): mapboxgl.Marker => {
    const el = document.createElement('div');
    el.className = 'hazard-marker-simple';
    el.innerHTML = `
      <div class="crimson-marker"></div>
      <div class="cloud-bubble">${hazard.incident_type}</div>
    `;

    el.addEventListener('click', () => {
      setSelectedHazard(hazard);
      setShowHazardModal(true);
    });

    return new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([hazard.lng, hazard.lat])
      .addTo(map.current!);
  }, []);

  // Create a cluster marker with count badge (shown at lower zoom levels)
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
      .addTo(map.current!);
  }, []);

  // Create spiderfied markers (shown at high zoom levels)
  const createSpiderfiedMarkers = useCallback((
    hazards: HazardReport[],
    centerPosition: { lat: number; lng: number }
  ): mapboxgl.Marker[] => {
    if (!map.current) return [];

    const isMobile = window.innerWidth <= 768;
    const radius = isMobile
      ? SPIDERFY_CONFIG.SPIDER_RADIUS_MOBILE
      : SPIDERFY_CONFIG.SPIDER_RADIUS_DESKTOP;

    const displayHazards = hazards.slice(0, SPIDERFY_CONFIG.MAX_SPIDER_DISPLAY);
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
        setSelectedHazard(hazard);
        setShowHazardModal(true);
      });

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'bottom'
      })
        .setLngLat([centerPosition.lng, centerPosition.lat])
        .addTo(map.current!);

      markers.push(marker);
    });

    return markers;
  }, []);

  // Render markers based on current zoom level (without re-fetching)
  const renderMarkersForZoom = useCallback(() => {
    if (!map.current || hazardClusters.current.size === 0) return;

    const zoom = map.current.getZoom();
    const MIN_ZOOM_THRESHOLD = 12;
    const SPIDERFY_ZOOM_THRESHOLD = 18;

    // Clear old markers first
    hazardMarkers.current.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        // Marker may already be removed
      }
    });
    hazardMarkers.current = [];

    // Hide markers when zoomed out too far
    if (zoom < MIN_ZOOM_THRESHOLD) {
      lastZoomState.current = 'hidden';
      return;
    }

    const currentState = zoom >= SPIDERFY_ZOOM_THRESHOLD ? 'spiderfied' : 'clustered';
    lastZoomState.current = currentState;

    // Render based on zoom level
    hazardClusters.current.forEach((hazardsInCluster, clusterId) => {
      try {
        if (hazardsInCluster.length === 1) {
          const marker = createSingleHazardMarker(hazardsInCluster[0]);
          hazardMarkers.current.push(marker);
        } else {
          const centroid = calculateCentroid(hazardsInCluster);

          if (zoom >= SPIDERFY_ZOOM_THRESHOLD) {
            const spiderfiedMarkers = createSpiderfiedMarkers(hazardsInCluster, centroid);
            hazardMarkers.current.push(...spiderfiedMarkers);
          } else {
            const marker = createClusterMarker(centroid, hazardsInCluster.length, clusterId);
            hazardMarkers.current.push(marker);
          }
        }
      } catch (error) {
        console.error('[CreateRoute] Failed to create marker for cluster:', clusterId, error);
      }
    });

    updateMarkersForZoom();
  }, [updateMarkersForZoom, createSingleHazardMarker, createClusterMarker, createSpiderfiedMarkers]);

  // Re-render markers when zoom crosses threshold (clustered <-> spiderfied)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleZoomEnd = () => {
      if (!map.current || hazardClusters.current.size === 0) return;

      const zoom = map.current.getZoom();
      const MIN_ZOOM_THRESHOLD = 12;
      const SPIDERFY_ZOOM_THRESHOLD = 18;

      const currentState = zoom < MIN_ZOOM_THRESHOLD
        ? 'hidden'
        : zoom >= SPIDERFY_ZOOM_THRESHOLD
          ? 'spiderfied'
          : 'clustered';

      // Only re-render when crossing threshold
      if (currentState !== lastZoomState.current) {
        renderMarkersForZoom();
      }
    };

    map.current.on('zoomend', handleZoomEnd);

    return () => {
      if (map.current) {
        map.current.off('zoomend', handleZoomEnd);
      }
    };
  }, [mapLoaded, renderMarkersForZoom]);

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
            radius: 1000,
            sortBy: 'newest'
          }
        }
      );

      const fetchedHazards = response.data.hazards || [];
      setHazards(fetchedHazards);

      const clusters = clusterHazards(fetchedHazards);
      hazardClusters.current = clusters;

      // Clean up old markers before rendering new ones
      hazardMarkers.current.forEach(marker => {
        try {
          marker.remove();
        } catch (e) {
          // Marker may already be removed
        }
      });
      hazardMarkers.current = [];

      // Reset zoom state to force re-render
      lastZoomState.current = null;

      // Render markers after brief delay (ensures map is ready)
      setTimeout(() => {
        renderMarkersForZoom();
      }, 100);
    } catch (error) {
      console.error('Failed to fetch hazards:', error);
      // Ensure clean state on error
      hazardMarkers.current.forEach(marker => {
        try {
          marker.remove();
        } catch (e) {
          // Ignore
        }
      });
      hazardMarkers.current = [];
    }
  }, [renderMarkersForZoom]);

  // Fetch accident clusters from Supabase
  const fetchAccidentClusters = useCallback(async () => {
    try {
      console.log('[CreateRoute Web] Fetching accident clusters...');
      const { data, error } = await supabase
        .from('accident_clusters')
        .select('cluster_id, lat, lon, count, radius_meters');

      if (error) {
        console.error('[CreateRoute Web] Supabase error fetching accident clusters:', error);
        console.error('[CreateRoute Web] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return;
      }

      const clusters = data || [];
      console.log(`[CreateRoute Web] ✅ Fetched ${clusters.length} accident clusters`);
      if (clusters.length > 0) {
        console.log('[CreateRoute Web] Sample cluster:', clusters[0]);
      } else {
        console.warn('[CreateRoute Web] No accident clusters found in database!');
      }
      setAccidentClusters(clusters);
    } catch (error) {
      console.error('[CreateRoute Web] Exception fetching accident clusters:', error);
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

  // Attach map click handler
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [mapLoaded, handleMapClick]);

  // DON'T re-render on zoom - markers are rendered once and stay stable
  // No zoom event listener = no re-rendering = no positioning glitches

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

  // Update polyline when generatedPath changes or style changes
  useEffect(() => {
    updatePolyline(generatedPath);
  }, [generatedPath, updatePolyline, styleVersion]);

  // Display accident clusters on map
  useEffect(() => {
    console.log('[CreateRoute Web] Display clusters useEffect triggered', {
      hasMap: !!map.current,
      mapLoaded,
      clusterCount: accidentClusters.length
    });

    if (!map.current || !mapLoaded || accidentClusters.length === 0) {
      console.log('[CreateRoute Web] Skipping cluster display:', {
        hasMap: !!map.current,
        mapLoaded,
        clusterCount: accidentClusters.length
      });
      return;
    }

    try {
      console.log(`[CreateRoute Web] ✅ Displaying ${accidentClusters.length} accident clusters on map`);
      console.log('[CreateRoute Web] First cluster:', accidentClusters[0]);

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
        layout: {
          'visibility': showAccidentClusters ? 'visible' : 'none' // Toggle visibility based on state
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
          'circle-opacity': 0.3,
          'circle-stroke-width': 2,
          'circle-stroke-color': [
            'step',
            ['get', 'count'],
            '#FFA500',
            15, '#FF8C00',
            30, '#FF6500'
          ],
          'circle-stroke-opacity': 0.6
        }
      });

      console.log('[CreateRoute Web] Accident clusters layer created (visibility:', showAccidentClusters ? 'visible' : 'hidden', ')');
    } catch (error) {
      console.error('[CreateRoute Web] Error displaying accident clusters:', error);
    }
  }, [accidentClusters, mapLoaded, styleVersion, showAccidentClusters]);

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

      const algoEngineUrl = import.meta.env.VITE_ALGO_ENGINE_URL || 'http://localhost:8000';

      if (routeMode === 'distance') {
        // Distance-based routing: find safest circular route
        const distanceInKm = distanceUnit === 'miles' ? targetDistance * 1.60934 : targetDistance;
        console.log('Calling algorithm engine for distance-based route:', { start: startPoint, distance: distanceInKm });

        algoResponse = await axios.post(`${algoEngineUrl}/route-distance`, {
          start: startPoint,
          target_distance_km: distanceInKm,
          alpha: 0.5 // Balance between distance and safety
        });
      } else {
        // Endpoint-based routing: find safest path to destination
        console.log('Calling algorithm engine with:', { start: startPoint, end: endPoint });
        algoResponse = await axios.post(`${algoEngineUrl}/route-osm`, {
          start: startPoint,
          end: endPoint,
          alpha: 0.5 // Balance between distance and safety
        });
      }

      console.log('Full backend response:', algoResponse.data);

      const coordinates = algoResponse.data.coordinates;
      const safetyData = algoResponse.data.safety;
      const distanceInfoData = algoResponse.data.distance_info;

      if (routeMode === 'distance') {
        setDistanceInfo(distanceInfoData ?? null);
      } else {
        setDistanceInfo(null);
      }

      console.log('Extracted coordinates:', coordinates);
      console.log('Coordinates length:', coordinates?.length || 0);
      console.log('Safety analysis:', safetyData);

      // Use safety warnings directly from algorithm engine
      if (safetyData) {
        setSafetyAnalysis(safetyData);
      }

      if (!coordinates || coordinates.length === 0) {
        throw new Error('No route found. Try different points or check if they are accessible.');
      }

      // Convert coordinates to correct format
      const normalizeCoordinate = (coord: any): LatLng | null => {
        if (Array.isArray(coord) && coord.length >= 2) {
          let lat = Number(coord[0]);
          let lng = Number(coord[1]);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            const latOutOfRange = Math.abs(lat) > 90;
            const lngLooksLikeLat = Math.abs(lng) <= 90;
            const lngOutOfRange = Math.abs(lng) > 180;
            if ((latOutOfRange && lngLooksLikeLat) || lngOutOfRange) {
              [lat, lng] = [lng, lat];
            }
            if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              return { lat, lng };
            }
          }
        } else if (coord && typeof coord === 'object') {
          const latValue = coord.lat ?? coord.latitude;
          const lngValue = coord.lng ?? coord.lon ?? coord.longitude;
          const latNum = Number(latValue);
          const lngNum = Number(lngValue);
          if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
            return { lat: latNum, lng: lngNum };
          }
        }
        console.error('Invalid coordinate format:', coord);
        return null;
      };

      const normalizedCoords: (LatLng | null)[] = coordinates.map((coord: any) => normalizeCoordinate(coord));
      const pathPoints: LatLng[] = normalizedCoords
        .filter((p): p is LatLng => p !== null)
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

      console.log('Converted to', pathPoints.length, 'path points');

      // Check for accident cluster proximity
      const clusterWarnings = checkRouteProximityToAccidentClusters(pathPoints, accidentClusters);
      setAccidentWarnings(clusterWarnings);
      if (clusterWarnings.length > 0) {
        console.log(`[CreateRoute Web] Route passes through ${clusterWarnings.length} accident-prone area(s)`);
      }

      // Choose an endpoint for saving/display
      let chosenEnd: LatLng | null = null;
      if (routeMode === 'endpoint') {
        chosenEnd = endPoint && pathPoints.length > 0 ? endPoint : (pathPoints[pathPoints.length - 1] ?? null);
      } else if (routeMode === 'distance' && pathPoints.length > 0) {
        chosenEnd = pathPoints[pathPoints.length - 1];
        const toRad = (deg: number) => deg * Math.PI / 180;
        const haversineKm = (a: LatLng, b: LatLng) => {
          const R = 6371;
          const dLat = toRad(b.lat - a.lat);
          const dLng = toRad(b.lng - a.lng);
          const s = Math.sin(dLat/2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2) ** 2;
          return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
        };
        if (startPoint) {
          const distToStart = haversineKm(startPoint, chosenEnd);
          if (distToStart < 0.05) {
            let best = chosenEnd;
            let bestDist = distToStart;
            for (const p of pathPoints) {
              const d = haversineKm(startPoint, p);
              if (d > bestDist) { bestDist = d; best = p; }
            }
            chosenEnd = best;
          }
        }
        setEndPoint(chosenEnd);

        // Update end marker for circular routes
        if (endMarker.current) {
          endMarker.current.setLngLat([chosenEnd.lng, chosenEnd.lat]);
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
            .setLngLat([chosenEnd.lng, chosenEnd.lat])
            .addTo(map.current!);
        }
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
          const R = 6371;
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
      const estimatedPace = 5.5;
      const estimatedDuration = Math.round(distanceKm * estimatedPace * 60);

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
          risk_score: 0.2,
          visibility: 'private'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Route saved to backend:', routeResponse.data.route);
      const savedRoute = routeResponse.data.route;
      setGeneratedRoute(savedRoute);

      // Parse chosen_path from saved route
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
        setGeneratedPath(pathPoints);
      }
      setShowActions(true);

      setToastMessage(`Route generated! Distance: ${distanceKm.toFixed(2)} km`);
      setShowToast(true);

    } catch (error: any) {
      console.error('Route generation failed:', error);
      console.log('Error response data:', error.response?.data);
      console.log('Error detail:', error.response?.data?.detail);
      console.log('Error detail type:', typeof error.response?.data?.detail);

      // Add 1-second delay before showing error
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if this is a "no safe route" error from backend
      let errorData = error.response?.data?.detail;

      // If errorData is a string, try to parse it as JSON
      if (typeof errorData === 'string') {
        try {
          errorData = JSON.parse(errorData);
        } catch (e) {
          // If parsing fails, it's just a regular string error
        }
      }

      if (errorData && typeof errorData === 'object' && errorData.error === 'no_safe_route') {
        // Simple message for runners - just title, message, and reason in sentence format
        const title = errorData.title || 'No Safe Route Available';
        const message = errorData.message || 'We couldn\'t find a safe running path between these locations.';
        const reason = errorData.reason || 'The only available route passes through hazard areas.';

        setToastMessage(`${title}. ${message} ${reason} Please try different start or end points.`);
        setShowToast(true);
      } else {
        // Other errors - handle both string and object errors
        let errorMessage = 'Failed to generate route';

        if (typeof error.response?.data?.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response?.data?.detail === 'object') {
          // If detail is an object, extract message fields
          errorMessage = error.response.data.detail.message || error.response.data.detail.title || 'Failed to generate route';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setToastMessage(errorMessage);
        setShowToast(true);
      }
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
            route_id: generatedRoute.route_id,
          }),
        }
      );

      const responseData = await response.json();
      console.log('Route saved successfully:', responseData);

      setToastMessage('✓ Route saved successfully! Redirecting...');
      setShowToast(true);

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

  // Handle hazard confirmation toggle
  const handleConfirmToggle = async () => {
    if (!selectedHazard) return;

    if (!userToken) {
      setToastMessage('Please log in to confirm hazards');
      setShowToast(true);
      return;
    }

    const isConfirmed = userConfirmations.has(selectedHazard.report_id);

    try {
      if (isConfirmed) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/confirmations/${selectedHazard.report_id}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        setUserConfirmations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(selectedHazard.report_id);
          return newSet;
        });

        setToastMessage('✓ Confirmation removed');
        setShowToast(true);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/confirmations/${selectedHazard.report_id}`, {}, {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        setUserConfirmations((prev) => new Set(prev).add(selectedHazard.report_id));

        setToastMessage('✓ Hazard confirmed');
        setShowToast(true);
      }
    } catch (error: any) {
      console.error('[CreateRoute Web] Confirmation toggle failed:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update confirmation';
      setToastMessage(`Error: ${errorMsg}`);
      setShowToast(true);
    }
  };

  // Delete hazard
  const handleDeleteHazard = async () => {
    if (!selectedHazard) return;

    const reason = prompt('Optional: Provide a reason for deleting this hazard (e.g., "Resolved", "Duplicate")');

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this hazard?\n\nTitle: ${selectedHazard.title}`
    );

    if (!confirmDelete) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setToastMessage('Please log in to delete hazards');
        setShowToast(true);
        return;
      }

      // Send delete request with reason in body
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/hazards/${selectedHazard.report_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { reason: reason || null }
        }
      );

      console.log('[CreateRoute Web] Hazard deleted:', response.data);

      setToastMessage('✓ Hazard deleted successfully');
      setShowToast(true);

      // Remove from local state
      setHazards(prev => prev.filter(h => h.report_id !== selectedHazard.report_id));

      // Close modal
      setShowHazardModal(false);
      setSelectedHazard(null);

    } catch (error: any) {
      console.error('[CreateRoute Web] Failed to delete hazard:', error);
      const errorMsg = error.response?.data?.error || 'Failed to delete hazard';
      setToastMessage(`Error: ${errorMsg}`);
      setShowToast(true);
    }
  };
  // Cancel route creation
  const handleCancel = () => {
    // Clean up map layers first
    if (map.current && mapLoaded) {
      try {
        if (map.current.getLayer('route')) {
          map.current.removeLayer('route');
        }
        if (map.current.getSource('route')) {
          map.current.removeSource('route');
        }
      } catch (e) {
        console.warn('Error cleaning up route layers:', e);
      }
    }

    // Clear all state
    setGeneratedPath([]);
    setGeneratedRoute(null);
    setSafetyAnalysis(null);
    setShowActions(false);
    setDistanceInfo(null);
    setStartPoint(null);
    setEndPoint(null);
    setRouteName('');
    setStartSearchQuery('');
    setEndSearchQuery('');
    setPinMode(null);

    // Remove markers
    if (startMarker.current) {
      startMarker.current.remove();
      startMarker.current = null;
    }
    if (endMarker.current) {
      endMarker.current.remove();
      endMarker.current = null;
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

  // Handler for recenter button in HazardListPanel
  const handleRecenterFromPanel = (coords: { lat: number; lng: number }) => {
    if (!map.current) return;

    const currentZoom = map.current.getZoom();
    const SPIDERFY_ZOOM_THRESHOLD = 18;

    // Check if the hazard is part of a cluster
    let isInCluster = false;
    let clusterSize = 0;

    hazardClusters.current.forEach((hazardsInCluster) => {
      hazardsInCluster.forEach((hazard) => {
        if (hazard.lat === coords.lat && hazard.lng === coords.lng) {
          if (hazardsInCluster.length > 1) {
            isInCluster = true;
            clusterSize = hazardsInCluster.length;
          }
        }
      });
    });

    // Determine appropriate zoom level and message
    let targetZoom = 17; // Default: zoom in close to see individual hazard
    let message = '📍 Centering on hazard...';

    if (isInCluster) {
      if (currentZoom < SPIDERFY_ZOOM_THRESHOLD) {
        targetZoom = 17; // Zoom to spiderfy level
        message = `📍 Showing cluster of ${clusterSize} hazards (zooming to expand)`;
      } else {
        targetZoom = Math.max(currentZoom, 17); // Keep current zoom or go higher
        message = `📍 Centering on hazard (${clusterSize} clustered hazards at this location)`;
      }
    } else {
      message = '📍 Centering on hazard...';
    }

    // Fly to the hazard
    map.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom: targetZoom,
      duration: 1000
    });

    // Show feedback toast
    setToastMessage(message);
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonContent className="route-builder-content" scrollY={true}>
        <div className="route-builder-container">
          {/* Left Sidebar - Desktop */}
          <div className={`sidebar desktop-only`}>
            {/* Back Button */}
            <IonButton
              fill="clear"
              className="back-button"
              onClick={handleBack}
            >
              <IonIcon icon={arrowBackOutline} slot="start" />
              Back to Routes
            </IonButton>

            <div className="sidebar-header">
              <h1 className="main-title">Create a New Route</h1>
              <p className="subtitle">
                Create a safe running route by searching or pinning locations.
                The app will find the safest path for you.
              </p>
            </div>

            {/* Route Name */}
            <div className="section-card">
              <div className="section-header">
                <div className="step-number">1</div>
                <div className="section-title-wrapper">
                  <span className="section-title">ROUTE NAME</span>
                </div>
              </div>
              <IonInput
                value={routeName}
                onIonChange={(e) => setRouteName(e.detail.value!)}
                placeholder="Enter route name (optional)"
                className="location-input"
              />
            </div>

            {/* Starting Point Section */}
            <div className="section-card">
              <div className="section-header">
                <div className="step-number">2</div>
                <div className="section-title-wrapper">
                  <span className="section-title">STARTING POINT</span>
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
                    className="location-input"
                    disabled={pinMode === 'start'}
                  />
                  <IonButton
                    fill="clear"
                    className="pin-icon-button"
                    onClick={() => setPinMode(pinMode === 'start' ? null : 'start')}
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
                    {startSuggestions.map((feature, index) => (
                      <div
                        key={`start-${feature.id}-${index}`}
                        className="suggestion-item"
                        onClick={() => selectSuggestion(feature, 'start')}
                      >
                        <IonIcon icon={locationOutline} className="suggestion-icon" />
                        <div className="suggestion-text">
                          <div className="suggestion-main">{feature.text}</div>
                          <div className="suggestion-secondary">{feature.place_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {startPoint && (
                <IonText color="success" className="point-set-text">
                  ✓ Location set
                </IonText>
              )}
            </div>

            {/* Route Mode Selection */}
            <div className="section-card">
              <div className="section-header">
                <div className="step-number">3</div>
                <div className="section-title-wrapper">
                  <span className="section-title">ROUTE TYPE</span>
                </div>
              </div>

              <div className="mode-selector">
                <div
                  className={`mode-option ${routeMode === 'endpoint' ? 'active' : ''}`}
                  onClick={() => {
                    setRouteMode('endpoint');
                    setEndPoint(null);
                    setEndSearchQuery('');
                    if (endMarker.current) {
                      endMarker.current.remove();
                      endMarker.current = null;
                    }
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
                    if (endMarker.current) {
                      endMarker.current.remove();
                      endMarker.current = null;
                    }
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
              <div className="section-card">
                <div className="section-header">
                  <div className="step-number">4</div>
                  <div className="section-title-wrapper">
                    <span className="section-title">TARGET DISTANCE</span>
                    <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', color: '#6b7280', fontSize: 12 }}>
                      <IonIcon icon={informationCircleOutline} style={{ marginRight: 4, fontSize: 14 }} />
                      Distance is approximate — safety prioritized
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
                      ? `≈ ${(targetDistance * 0.621371).toFixed(2)} miles`
                      : `≈ ${(targetDistance * 1.60934).toFixed(2)} km`
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Endpoint-based Configuration */}
            {routeMode === 'endpoint' && (
              <div className="section-card">
                <div className="section-header">
                  <div className="step-number">4</div>
                  <div className="section-title-wrapper">
                    <span className="section-title">DESTINATION</span>
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
                      className="location-input"
                      disabled={pinMode === 'end'}
                    />
                    <IonButton
                      fill="clear"
                      className="pin-icon-button"
                      onClick={() => setPinMode(pinMode === 'end' ? null : 'end')}
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
                      {endSuggestions.map((feature, index) => (
                        <div
                          key={`end-${feature.id}-${index}`}
                          className="suggestion-item"
                          onClick={() => selectSuggestion(feature, 'end')}
                        >
                          <IonIcon icon={locationOutline} className="suggestion-icon" />
                          <div className="suggestion-text">
                            <div className="suggestion-main">{feature.text}</div>
                            <div className="suggestion-secondary">{feature.place_name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {endPoint && (
                  <IonText color="success" className="point-set-text">
                    ✓ Location set
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
                        .map((warning) => (
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
                  <IonButton
                    expand="block"
                    className="save-button"
                    onClick={handleSaveRoute}
                  >
                    <IonIcon icon={saveOutline} slot="start" />
                    Save Route
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
          <div className="map-container">
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
                className={`accident-clusters-toggle-btn ${showAccidentClusters ? 'active' : ''}`}
                onClick={() => setShowAccidentClusters(!showAccidentClusters)}
                title={showAccidentClusters ? 'Hide Accident Clusters' : 'Show Accident Clusters'}
              >
                <IonIcon icon={warningOutline} />
              </button>
            </div>

            {/* Mapbox Map Container */}
            <div ref={mapContainer} style={mapContainerStyle} />

              {/* Mobile Create Route FAB */}
              <button
                className="mobile-create-route-fab"
                onClick={() => setShowMobileSidebar(true)}
              >
                <IonIcon icon={navigateOutline} />
              </button>

            {/* Pin Mode Indicator */}
            {pinMode && (
              <div className="pin-mode-indicator">
                <IonIcon icon={pinOutline} />
                <span>Click on the map to set {pinMode === 'start' ? 'start' : 'end'} point</span>
              </div>
            )}

          </div>
        </div>

        {/* Mobile Modal for Route Creation */}
        <IonModal
          isOpen={showMobileSidebar}
          onDidDismiss={() => setShowMobileSidebar(false)}
          initialBreakpoint={0.9}
          breakpoints={[0, 0.5, 0.75, 0.9, 1]}
          className="route-input-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Create Route</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowMobileSidebar(false)}>
                  <IonIcon icon={closeCircleOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent scrollY={true} style={{ '--background': '#ffffff' }}>
            <div className="route-input-wrapper" style={{ padding: '16px' }}>
              {/* Route Name */}
              <div className="section-card">
                <div className="section-header">
                  <div className="step-number">1</div>
                  <div className="section-title-wrapper">
                    <span className="section-title">ROUTE NAME</span>
                  </div>
                </div>
                <IonInput
                  value={routeName}
                  onIonChange={(e) => setRouteName(e.detail.value!)}
                  placeholder="Enter route name (optional)"
                  className="location-input"
                />
              </div>

              {/* Starting Point Section */}
              <div className="section-card">
                <div className="section-header">
                  <div className="step-number">2</div>
                  <div className="section-title-wrapper">
                    <span className="section-title">STARTING POINT</span>
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
                      className="location-input"
                      disabled={pinMode === 'start'}
                    />
                    <IonButton
                      fill="clear"
                      className="pin-icon-button"
                      onClick={() => {
                        setPinMode(pinMode === 'start' ? null : 'start');
                        setShowMobileSidebar(false);
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
                      {startSuggestions.map((feature, index) => (
                        <div
                          key={`start-${feature.id}-${index}`}
                          className="suggestion-item"
                          onClick={() => selectSuggestion(feature, 'start')}
                        >
                          <IonIcon icon={locationOutline} className="suggestion-icon" />
                          <div className="suggestion-text">
                            <div className="suggestion-main">{feature.text}</div>
                            <div className="suggestion-secondary">{feature.place_name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {startPoint && (
                  <IonText color="success" className="point-set-text">
                    ✓ Location set
                  </IonText>
                )}
              </div>

              {/* Route Mode Selection */}
              <div className="section-card">
                <div className="section-header">
                  <div className="step-number">3</div>
                  <div className="section-title-wrapper">
                    <span className="section-title">ROUTE TYPE</span>
                  </div>
                </div>

                <div className="mode-selector">
                  <div
                    className={`mode-option ${routeMode === 'endpoint' ? 'active' : ''}`}
                    onClick={() => {
                      setRouteMode('endpoint');
                      setEndPoint(null);
                      setEndSearchQuery('');
                      if (endMarker.current) {
                        endMarker.current.remove();
                        endMarker.current = null;
                      }
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
                      if (endMarker.current) {
                        endMarker.current.remove();
                        endMarker.current = null;
                      }
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
                <div className="section-card">
                  <div className="section-header">
                    <div className="step-number">4</div>
                    <div className="section-title-wrapper">
                      <span className="section-title">TARGET DISTANCE</span>
                      <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', color: '#6b7280', fontSize: 12 }}>
                        <IonIcon icon={informationCircleOutline} style={{ marginRight: 4, fontSize: 14 }} />
                        Distance is approximate — safety prioritized
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
                        ? `≈ ${(targetDistance * 0.621371).toFixed(2)} miles`
                        : `≈ ${(targetDistance * 1.60934).toFixed(2)} km`
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Endpoint-based Configuration */}
              {routeMode === 'endpoint' && (
                <div className="section-card">
                  <div className="section-header">
                    <div className="step-number">4</div>
                    <div className="section-title-wrapper">
                      <span className="section-title">DESTINATION</span>
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
                        className="location-input"
                        disabled={pinMode === 'end'}
                      />
                      <IonButton
                        fill="clear"
                        className="pin-icon-button"
                        onClick={() => {
                          setPinMode(pinMode === 'end' ? null : 'end');
                          setShowMobileSidebar(false);
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
                        {endSuggestions.map((feature, index) => (
                          <div
                            key={`end-${feature.id}-${index}`}
                            className="suggestion-item"
                            onClick={() => selectSuggestion(feature, 'end')}
                          >
                            <IonIcon icon={locationOutline} className="suggestion-icon" />
                            <div className="suggestion-text">
                              <div className="suggestion-main">{feature.text}</div>
                              <div className="suggestion-secondary">{feature.place_name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {endPoint && (
                    <IonText color="success" className="point-set-text">
                      ✓ Location set
                    </IonText>
                  )}
                </div>
              )}

              {/* Generate Route Button */}
              {!showActions && (
                <IonButton
                  expand="block"
                  className="next-button"
                  onClick={() => {
                    setShowMobileSidebar(false);
                    handleGenerateRoute();
                  }}
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

              {/* Action Buttons (Save/Cancel) - shown after route generation */}
              {showActions && generatedRoute && (
                <div className="action-buttons">
                  <IonCard className="route-info-card">
                    <IonCardContent>
                      <h3>{generatedRoute.route_name}</h3>
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

                  <div className="action-button-group">
                    <IonButton
                      expand="block"
                      className="save-button"
                      onClick={handleSaveRoute}
                    >
                      <IonIcon icon={saveOutline} slot="start" />
                      Save Route
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
          </IonContent>
        </IonModal>

        {/* Toast for notifications */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={5000}
          position="top"
        />

        {/* Hazard Detail Modal */}
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
                {selectedHazard.image_url && selectedHazard.image_url.trim() !== '' && (
                  <div className="hazard-image-container" id={`hazard-img-container-${selectedHazard.report_id}`}>
                    <img
                      src={selectedHazard.image_url}
                      alt={selectedHazard.title}
                      className="hazard-image"
                      onError={() => {
                        console.warn('[CreateRoute Web] Hazard image failed to load:', selectedHazard.image_url);
                        // Hide the entire image container, not just the img
                        const container = document.getElementById(`hazard-img-container-${selectedHazard.report_id}`);
                        if (container) {
                          container.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                )}

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
                        <span className="stat-value" title={`${selectedHazard.lat.toFixed(4)}, ${selectedHazard.lng.toFixed(4)}`}>
                          {selectedHazard.cached_address || `${selectedHazard.lat.toFixed(4)}, ${selectedHazard.lng.toFixed(4)}`}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {selectedHazard && (
                      <div className="hazard-actions">
                        <IonButton
                          expand="block"
                          fill={userConfirmations.has(selectedHazard.report_id) ? 'solid' : 'outline'}
                          color={userConfirmations.has(selectedHazard.report_id) ? 'success' : 'primary'}
                          onClick={handleConfirmToggle}
                        >
                          <IonIcon
                            slot="start"
                            icon={userConfirmations.has(selectedHazard.report_id) ? checkmarkCircle : checkmarkCircleOutline}
                          />
                          {userConfirmations.has(selectedHazard.report_id) ? 'Confirmed' : 'Confirm Hazard'}
                        </IonButton>

                        <IonButton expand="block" color="danger" onClick={handleDeleteHazard}>
                          <IonIcon icon={trashOutline} slot="start" />
                          Remove Hazard
                        </IonButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Unified Map Panel (Legend + Hazard List) */}
        <UnifiedMapPanel
          hazards={hazards}
          mode="create-route"
          onRecenter={handleRecenterFromPanel}
          userToken={userToken}
        />
      </IonContent>
    </IonPage>
  );
};

export default CreateRouteMap;
