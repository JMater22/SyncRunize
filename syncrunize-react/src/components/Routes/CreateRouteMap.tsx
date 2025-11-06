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
  locationOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import axios from 'axios';
import { supabase } from '../../supabaseClient';
import './CreateRouteMap.css';

// Google Maps configuration
const libraries: ("places" | "geometry")[] = ["places", "geometry"];
const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Default center (Tarlac, Philippines)
const defaultCenter = {
  lat: 15.4755,
  lng: 120.5963
};

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
    sidewalk_coverage: number;
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

const CreateRouteMap = () => {
  const history = useHistory();

  // Form states
  const [routeName, setRouteName] = useState('');
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [endPoint, setEndPoint] = useState<LatLng | null>(null);

  // Map states
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap');
  const [showTrafficLayer, setShowTrafficLayer] = useState(false);
  const [trafficLayer, setTrafficLayer] = useState<google.maps.TrafficLayer | null>(null);
  const [generatedPath, setGeneratedPath] = useState<LatLng[]>([]);
  const [generatedRoute, setGeneratedRoute] = useState<GeneratedRoute | null>(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null);

  // Hazard states
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [selectedHazard, setSelectedHazard] = useState<HazardReport | null>(null);
  const [showHazardModal, setShowHazardModal] = useState(false);

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
  const [startSuggestions, setStartSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

  // Services
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  // Initialize Google Maps services when map loads
  useEffect(() => {
    if (map && window.google) {
      geocoder.current = new google.maps.Geocoder();

      // Initialize traffic layer
      const traffic = new google.maps.TrafficLayer();
      setTrafficLayer(traffic);
    }
  }, [map]);

  // Toggle traffic layer visibility
  useEffect(() => {
    if (trafficLayer && map) {
      if (showTrafficLayer) {
        trafficLayer.setMap(map);
      } else {
        trafficLayer.setMap(null);
      }
    }
  }, [showTrafficLayer, trafficLayer, map]);

  // Enrich hazard with establishment info using Places API
  const enrichWithEstablishment = async (hazard: HazardReport): Promise<HazardReport> => {
    if (!window.google?.maps?.places) return hazard;

    try {
      // Create a nearby search request with required fields
      const request: any = {
        fields: ['places.id', 'places.displayName', 'places.formattedAddress', 'places.types', 'places.location'],
        locationRestriction: {
          circle: {
            center: { lat: hazard.lat, lng: hazard.lng },
            radius: 50 // 50 meters radius to find establishments at this location
          }
        }
      };

      // Use nearbySearch to find places
      const { places } = await google.maps.places.Place.searchNearby(request);

      if (places && places.length > 0) {
        // Get the closest place
        const place = places[0];

        // Check if it's actually an establishment (not just a generic location)
        const establishmentTypes = ['restaurant', 'cafe', 'store', 'school', 'hospital',
                                    'shopping_mall', 'supermarket', 'gas_station', 'bank',
                                    'pharmacy', 'gym', 'park', 'museum', 'library'];

        const placeTypes = (place as any).types || [];
        const isEstablishment = placeTypes.some((type: string) =>
          establishmentTypes.includes(type.toLowerCase())
        );

        if (isEstablishment) {
          const displayNameObj = (place as any).displayName;
          const displayNameText = typeof displayNameObj === 'string'
            ? displayNameObj
            : (displayNameObj?.text || 'Unknown Place');

          return {
            ...hazard,
            establishment: {
              place_id: (place as any).id || '',
              displayName: displayNameText,
              formattedAddress: (place as any).formattedAddress || '',
              types: placeTypes
            }
          };
        }
      }
    } catch (error) {
      console.error('Failed to enrich hazard with establishment info:', error);
    }

    return hazard;
  };

  // Get appropriate marker icon based on hazard type
  const getMarkerIcon = (hazard: HazardReport) => {
    const baseSize = new google.maps.Size(32, 32);
    const anchor = new google.maps.Point(16, 32);

    if (hazard.establishment) {
      // Use building/establishment icon for hazards at establishments
      return {
        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: baseSize,
        anchor: anchor
      };
    } else {
      // Use warning icon for general hazards
      return {
        url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
        scaledSize: baseSize,
        anchor: anchor
      };
    }
  };

  // Fetch all active hazards (no radius filtering for web version)
  const fetchHazardsInView = useCallback(async () => {
    if (!map) return;

    try {
      // For web version, fetch ALL active hazards without radius filtering
      // Pass a very large radius to get all hazards in the region
      const response = await axios.get<{ hazards: HazardReport[] }>(
        `${import.meta.env.VITE_API_URL}/hazards/nearby`,
        {
          params: {
            lat: map.getCenter()?.lat(),
            lng: map.getCenter()?.lng(),
            radius: 1000 // 1000km radius to effectively get all hazards
          }
        }
      );

      const fetchedHazards = response.data.hazards || [];

      // Enrich hazards with establishment information
      const enrichedHazards = await Promise.all(
        fetchedHazards.map((hazard: HazardReport) => enrichWithEstablishment(hazard))
      );

      setHazards(enrichedHazards);
    } catch (error) {
      console.error('Failed to fetch hazards:', error);
    }
  }, [map]);

  // Fetch hazards when map is loaded or moved
  useEffect(() => {
    if (map) {
      fetchHazardsInView();

      // Listen to map idle event (after pan/zoom)
      const listener = map.addListener('idle', fetchHazardsInView);

      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [map, fetchHazardsInView]);

  // Fetch autocomplete suggestions using new AutocompleteSuggestion API
  const fetchSuggestions = useCallback(async (query: string, type: 'start' | 'end') => {
    if (!query || query.length < 2 || !window.google) {
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
      const request = {
        input: query,
        includedRegionCodes: ['PH'],
      };

      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      if (suggestions && suggestions.length > 0) {
        if (type === 'start') {
          setStartSuggestions(suggestions);
          setShowStartSuggestions(true);
        } else {
          setEndSuggestions(suggestions);
          setShowEndSuggestions(true);
        }
      } else {
        if (type === 'start') {
          setStartSuggestions([]);
          setShowStartSuggestions(false);
        } else {
          setEndSuggestions([]);
          setShowEndSuggestions(false);
        }
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

  // Select suggestion and get coordinates using new Place API
  const selectSuggestion = useCallback(async (placePrediction: google.maps.places.PlacePrediction, description: string, type: 'start' | 'end') => {
    if (!map) return;

    try {
      // Use the new Place API to fetch place details
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ['location', 'displayName'] });

      const location = place.location;
      if (!location) {
        throw new Error('No location found for this place');
      }

      const point = {
        lat: location.lat(),
        lng: location.lng()
      };

      if (type === 'start') {
        setStartPoint(point);
        setStartSearchQuery(description);
        setShowStartSuggestions(false);
        setToastMessage(`✓ Start: ${description}`);
      } else {
        setEndPoint(point);
        setEndSearchQuery(description);
        setShowEndSuggestions(false);
        setToastMessage(`✓ End: ${description}`);
      }

      setShowToast(true);
      map.panTo(point);
      map.setZoom(15);
    } catch (error) {
      console.error('Place selection failed:', error);
      setToastMessage('Failed to select location');
      setShowToast(true);
    }
  }, [map]);

  // Handle map click for pinning locations
  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !geocoder.current) return;

    const clickedPoint = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };

    // Reverse geocode to get place name
    try {
      const result = await geocoder.current.geocode({ location: clickedPoint });
      const placeName = result.results[0]?.formatted_address || `${clickedPoint.lat.toFixed(4)}, ${clickedPoint.lng.toFixed(4)}`;

      if (pinMode === 'start') {
        setStartPoint(clickedPoint);
        setStartSearchQuery(placeName);
        setPinMode(null);
        setToastMessage(`✓ Start: ${placeName}`);
        setShowToast(true);
      } else if (pinMode === 'end' && routeMode === 'endpoint') {
        setEndPoint(clickedPoint);
        setEndSearchQuery(placeName);
        setPinMode(null);
        setToastMessage(`✓ End: ${placeName}`);
        setShowToast(true);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      if (pinMode === 'start') {
        setStartPoint(clickedPoint);
        setStartSearchQuery(`${clickedPoint.lat.toFixed(4)}, ${clickedPoint.lng.toFixed(4)}`);
        setPinMode(null);
      } else if (pinMode === 'end' && routeMode === 'endpoint') {
        setEndPoint(clickedPoint);
        setEndSearchQuery(`${clickedPoint.lat.toFixed(4)}, ${clickedPoint.lng.toFixed(4)}`);
        setPinMode(null);
      }
      setToastMessage('Point set!');
      setShowToast(true);
    }
  }, [pinMode, routeMode]);

  // Search for location using Geocoding API
  const searchLocation = async (query: string, type: 'start' | 'end') => {
    if (!query || !geocoder.current) {
      setToastMessage('Please enter a location to search');
      setShowToast(true);
      return;
    }

    if (!map) {
      setToastMessage('Map not ready. Please wait a moment.');
      setShowToast(true);
      return;
    }

    try {
      setToastMessage(`Searching for ${query}...`);
      setShowToast(true);

      const result = await geocoder.current.geocode({
        address: query,
        region: 'PH', // Bias to Philippines
        componentRestrictions: { country: 'PH' }
      });

      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        const point = {
          lat: location.lat(),
          lng: location.lng()
        };

        const placeName = result.results[0].formatted_address;

        if (type === 'start') {
          setStartPoint(point);
          setStartSearchQuery(placeName);
          setToastMessage(`✓ Start: ${placeName}`);
        } else {
          setEndPoint(point);
          setEndSearchQuery(placeName);
          setToastMessage(`✓ End: ${placeName}`);
        }

        setShowToast(true);

        // Pan and zoom to location
        map.panTo(point);
        map.setZoom(15);
      } else {
        setToastMessage(`No location found for "${query}". Try adding city or landmark.`);
        setShowToast(true);
      }
    } catch (error: any) {
      console.error('Geocoding failed:', error);
      setToastMessage(`Search failed: ${error.message || 'Unknown error'}`);
      setShowToast(true);
    }
  };

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

        algoResponse = await axios.post('http://localhost:8000/route-distance', {
          start: startPoint,
          target_distance_km: distanceInKm,
          alpha: 0.5 // Balance between distance and safety
        });
      } else {
        // Endpoint-based routing: find safest path to destination
        console.log('Calling algorithm engine with:', { start: startPoint, end: endPoint });
        algoResponse = await axios.post('http://localhost:8000/route-osm', {
          start: startPoint,
          end: endPoint,
          alpha: 0.5 // Balance between distance and safety
        });
      }

      const coordinates = algoResponse.data.coordinates;
      const safetyData = algoResponse.data.safety;

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
        if (Array.isArray(coord)) {
          return { lat: coord[0], lng: coord[1] };
        } else if (coord.lat !== undefined && coord.lng !== undefined) {
          return { lat: coord.lat, lng: coord.lng };
        } else {
          console.error('Invalid coordinate format:', coord);
          return { lat: 0, lng: 0 };
        }
      }).filter((p: LatLng) => p.lat !== 0 && p.lng !== 0);

      console.log('Converted to', pathPoints.length, 'path points');
      setGeneratedPath(pathPoints);

      // For distance mode, set the endpoint to the last point of the generated route
      if (routeMode === 'distance' && pathPoints.length > 0) {
        const lastPoint = pathPoints[pathPoints.length - 1];
        setEndPoint(lastPoint);
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
          end_lat: routeMode === 'endpoint' && endPoint ? endPoint.lat : pathPoints[pathPoints.length - 1].lat,
          end_lng: routeMode === 'endpoint' && endPoint ? endPoint.lng : pathPoints[pathPoints.length - 1].lng,
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
      setGeneratedRoute(routeResponse.data.route);
      setShowActions(true);

      // Fit map to show the route
      if (map && pathPoints.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        pathPoints.forEach(point => bounds.extend(point));
        map.fitBounds(bounds);
      }

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
            route_id: generatedRoute.route_id, // ✅ send here
          }),
        }
      );

      const responseData = await response.json();
      console.log('Route saved successfully:', responseData);

      setToastMessage('✓ Route saved successfully! Redirecting...');
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

  // Cancel route creation
  const handleCancel = () => {
    // Clear all route-related state
    setGeneratedPath([]);
    setGeneratedRoute(null);
    setSafetyAnalysis(null);
    setShowActions(false);

    // Clear markers - reset to selection stage
    setStartPoint(null);
    setEndPoint(null);

    // Clear input fields
    setRouteName('');
    setStartSearchQuery('');
    setEndSearchQuery('');

    // Reset pin mode
    setPinMode(null);

    setToastMessage('Route cancelled');
    setShowToast(true);
  };

  const handleBack = () => {
    history.push('/routes');
  };

  return (
    <IonPage>
      <IonContent className="route-builder-content">
        <div className="route-builder-container">
          {/* Left Sidebar */}
          <div className="sidebar">
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
                    {startSuggestions.map((suggestion, index) => {
                      const placePrediction = suggestion.placePrediction;
                      if (!placePrediction) return null;

                      // Helper to extract string from FormattableText or string
                      const getText = (value: any): string => {
                        if (typeof value === 'string') return value;
                        if (value?.text) return typeof value.text === 'string' ? value.text : '';
                        return '';
                      };

                      const mainText: string = getText(placePrediction.mainText) || getText(placePrediction.text) || '';
                      const secondaryText: string = getText(placePrediction.secondaryText);
                      const fullText: string = getText(placePrediction.text) || `${mainText} ${secondaryText}`.trim();

                      return (
                        <div
                          key={`start-${index}`}
                          className="suggestion-item"
                          onClick={() => selectSuggestion(placePrediction, fullText, 'start')}
                        >
                          <IonIcon icon={locationOutline} className="suggestion-icon" />
                          <div className="suggestion-text">
                            <div className="suggestion-main">{mainText}</div>
                            <div className="suggestion-secondary">{secondaryText}</div>
                          </div>
                        </div>
                      );
                    })}
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
              <div className="section-card">
                <div className="section-header">
                  <div className="step-number">4</div>
                  <div className="section-title-wrapper">
                    <span className="section-title">TARGET DISTANCE</span>
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
                      {endSuggestions.map((suggestion, index) => {
                        const placePrediction = suggestion.placePrediction;
                        if (!placePrediction) return null;

                        // Helper to extract string from FormattableText or string
                        const getText = (value: any): string => {
                          if (typeof value === 'string') return value;
                          if (value?.text) return typeof value.text === 'string' ? value.text : '';
                          return '';
                        };

                        const mainText: string = getText(placePrediction.mainText) || getText(placePrediction.text) || '';
                        const secondaryText: string = getText(placePrediction.secondaryText);
                        const fullText: string = getText(placePrediction.text) || `${mainText} ${secondaryText}`.trim();

                        return (
                          <div
                            key={`end-${index}`}
                            className="suggestion-item"
                            onClick={() => selectSuggestion(placePrediction, fullText, 'end')}
                          >
                            <IonIcon icon={locationOutline} className="suggestion-icon" />
                            <div className="suggestion-text">
                              <div className="suggestion-main">{mainText}</div>
                              <div className="suggestion-secondary">{secondaryText}</div>
                            </div>
                          </div>
                        );
                      })}
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
                    <div className="route-stats">
                      <div className="stat-item">
                        <span className="stat-label">Distance</span>
                        <span className="stat-value">{generatedRoute.distance_km.toFixed(2)} km</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Est. Time</span>
                        <span className="stat-value">{Math.round(generatedRoute.duration_seconds / 60)} min</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Sidewalk Coverage</span>
                        <span className="stat-value">
                          {safetyAnalysis ? `${(safetyAnalysis.stats.sidewalk_coverage * 100).toFixed(0)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>

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
              <button
                className={`map-tab ${mapType === 'roadmap' ? 'active' : ''}`}
                onClick={() => setMapType('roadmap')}
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
                className={`map-tab ${mapType === 'terrain' ? 'active' : ''}`}
                onClick={() => setMapType('terrain')}
              >
                Terrain
              </button>
              <button
                className={`map-tab ${showTrafficLayer ? 'active' : ''}`}
                onClick={() => setShowTrafficLayer(!showTrafficLayer)}
              >
                Traffic {showTrafficLayer ? '✓' : ''}
              </button>
            </div>

            <LoadScript
              googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              libraries={libraries}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={startPoint || defaultCenter}
                zoom={13}
                mapTypeId={mapType}
                onClick={handleMapClick}
                onLoad={setMap}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                }}
              >
                {/* Start Point Marker */}
                {startPoint && (
                  <Marker
                    position={startPoint}
                    label="S"
                    icon={{
                      url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    }}
                  />
                )}

                {/* End Point Marker */}
                {endPoint && (
                  <Marker
                    position={endPoint}
                    label="E"
                    icon={{
                      url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                    }}
                  />
                )}

                {/* Generated Route Path */}
                {generatedPath.length > 0 && (
                  <Polyline
                    path={generatedPath}
                    options={{
                      strokeColor: '#0080ff',
                      strokeOpacity: 0.8,
                      strokeWeight: 5,
                    }}
                  />
                )}

                {/* Hazard Markers */}
                {hazards.map((hazard) => (
                  <Marker
                    key={hazard.report_id}
                    position={{ lat: hazard.lat, lng: hazard.lng }}
                    icon={getMarkerIcon(hazard)}
                    title={hazard.establishment ? hazard.establishment.displayName : hazard.title}
                    onClick={() => {
                      setSelectedHazard(hazard);
                      setShowHazardModal(true);
                    }}
                  />
                ))}
              </GoogleMap>
            </LoadScript>

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
                  <div className="hazard-image-container">
                    <img
                      src={`${import.meta.env.VITE_API_URL}${selectedHazard.image_url}`}
                      alt={selectedHazard.title}
                      className="hazard-image"
                    />
                  </div>
                )}

                {/* Hazard Info */}
                <div className="hazard-info">
                  <div className="hazard-header">
                    <div className="hazard-user-info">
                      {selectedHazard.users?.profile_picture ? (
                        <img
                          src={selectedHazard.users.profile_picture}
                          alt={selectedHazard.users.username}
                          className="user-avatar"
                        />
                      ) : (
                        <div className="user-avatar-placeholder">
                          {selectedHazard.users?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
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
      </IonContent>
    </IonPage>
  );
};

export default CreateRouteMap;
