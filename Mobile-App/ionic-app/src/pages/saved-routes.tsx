import React, { useState, useEffect, useRef } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonBackButton,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonToast,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react";
import type { RefresherEventDetail } from "@ionic/react";
import { SavedRoutesApi } from "../services/saved-routes";
import { Route, RoutesApi } from "../services/routes";
import { useUser } from "../contexts/UserContext";
import { useHistory } from "react-router-dom";
import { buildGuidedRoutePayload, normalizeRoutePath } from "../lib/routeGuides";
import { navigateOutline } from "ionicons/icons";
import "../theme/saved-routes.css";

const SavedRoutes: React.FC = () => {
  const { currentUser } = useUser();
  const history = useHistory();
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [usingRouteId, setUsingRouteId] = useState<number | null>(null);
  const hasLoadedRef = useRef(false);

  // Filter routes based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = savedRoutes.filter(route => {
        const routeName = route.route_name?.toLowerCase() || '';
        const description = route.description?.toLowerCase() || '';
        return routeName.includes(query) || description.includes(query);
      });
      setFilteredRoutes(filtered);
    } else {
      setFilteredRoutes(savedRoutes);
    }
  }, [searchQuery, savedRoutes]);

  // Initial load with caching
  useEffect(() => {
    if (!currentUser) return;

    // Try to restore saved routes from sessionStorage first
    const cachedRoutesKey = `saved_routes_${currentUser.user_id}`;
    const cachedRoutes = sessionStorage.getItem(cachedRoutesKey);

    if (cachedRoutes && savedRoutes.length === 0) {
      try {
        const parsedRoutes = JSON.parse(cachedRoutes);
        console.log('[SavedRoutes] Restoring', parsedRoutes.length, 'routes from cache');
        setSavedRoutes(parsedRoutes);
        setFilteredRoutes(parsedRoutes);
        hasLoadedRef.current = true;
        return; // Skip fetch, use cached data
      } catch (err) {
        console.error('[SavedRoutes] Failed to parse cached routes:', err);
        sessionStorage.removeItem(cachedRoutesKey);
      }
    }

    // Skip fetch if we already have routes in state
    if (savedRoutes.length > 0 && hasLoadedRef.current) {
      console.log('[SavedRoutes] Routes already in state, skipping fetch');
      return;
    }

    // Only fetch if we don't have cached data
    if (!hasLoadedRef.current) {
      console.log('[SavedRoutes] No cache found, fetching saved routes');
      fetchSavedRoutes();
    }
  }, [currentUser, savedRoutes.length]);

  const fetchSavedRoutes = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      console.log('[SavedRoutes] Fetching saved routes');
      const routes = await SavedRoutesApi.getSavedRoutes();

      // Ensure routes is an array
      const routesArray = Array.isArray(routes) ? routes : [];
      console.log('[SavedRoutes] Fetched', routesArray.length, 'routes');

      setSavedRoutes(routesArray);
      setFilteredRoutes(routesArray);
      hasLoadedRef.current = true;

      // Cache routes to sessionStorage for instant restore on remount
      sessionStorage.setItem(`saved_routes_${currentUser.user_id}`, JSON.stringify(routesArray));
      console.log('[SavedRoutes] Cached', routesArray.length, 'routes');
    } catch (err: any) {
      console.error('Failed to fetch saved routes:', err);
      setSavedRoutes([]);
      setFilteredRoutes([]);
      setToastMessage(err.response?.data?.error || 'Failed to load saved routes');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveRoute = async (routeId: number) => {
    try {
      await SavedRoutesApi.unsaveRoute(routeId);
      setToastMessage('Route removed from saved routes');
      setToastColor('success');
      setShowToast(true);

      // Optimistically remove from UI
      const updatedRoutes = savedRoutes.filter(route => route.route_id !== routeId);
      setSavedRoutes(updatedRoutes);
      setFilteredRoutes(updatedRoutes.filter(route => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const routeName = route.route_name?.toLowerCase() || '';
        const description = route.description?.toLowerCase() || '';
        return routeName.includes(query) || description.includes(query);
      }));

      // Update cache
      if (currentUser) {
        sessionStorage.setItem(`saved_routes_${currentUser.user_id}`, JSON.stringify(updatedRoutes));
      }
    } catch (err: any) {
      console.error('Failed to unsave route:', err);
      setToastMessage(err.message || 'Failed to remove route');
      setToastColor('danger');
      setShowToast(true);
      // Refetch on error to restore correct state
      fetchSavedRoutes();
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    console.log('[SavedRoutes] Pull-to-refresh triggered');
    await fetchSavedRoutes();
    event.detail.complete();
  };

  const handleUseRoute = async (route: Route) => {
    try {
      setUsingRouteId(route.route_id);
      let targetRoute = route;
      let path = normalizeRoutePath(route.chosen_path, []);

      if (!path.length) {
        targetRoute = await RoutesApi.getRoute(route.route_id);
        path = normalizeRoutePath(targetRoute.chosen_path, []);
      }

      if (!path.length) {
        throw new Error('This route does not have a saved path.');
      }

      const payload = buildGuidedRoutePayload(targetRoute, path);
      history.push('/run-tracking', { guidedRoute: payload });
    } catch (err: any) {
      console.error('Failed to load guided route:', err);
      setToastMessage(err?.message || 'Unable to load this route');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setUsingRouteId(null);
    }
  };

  return (
    <IonPage className="saved-routes-page">
      {/* Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/routes" text={''} />
          </IonButtons>
          <IonTitle>Saved Routes</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh} pullMin={90} pullMax={150}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Search Bar */}
        <IonSearchbar
          placeholder="Search saved routes"
          value={searchQuery}
          onIonInput={(e) => setSearchQuery(e.detail.value || '')}
        />

        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading saved routes...</p>
          </div>
        ) : !currentUser ? (
          <div className="empty-state">
            <p className="empty-state-text">Please log in to view saved routes.</p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">
              {searchQuery ? 'No saved routes found matching your search.' : 'No saved routes yet. Browse public routes to save your favorites!'}
            </p>
            <IonButton routerLink="/routes">
              Browse Routes
            </IonButton>
          </div>
        ) : (
          filteredRoutes.map((route) => {
            // Parse distance - handle both number and string formats
            let distanceKm = 0;
            if (route.distance_km !== null && route.distance_km !== undefined) {
              distanceKm = typeof route.distance_km === 'string'
                ? parseFloat(route.distance_km)
                : Number(route.distance_km);
            }

            // Parse duration
            const durationSeconds = Number(route.duration_seconds ?? 0);
            const durationLabel = durationSeconds > 0
              ? `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`
              : 'N/A';

            console.log(`Route ${route.route_id}:`, {
              name: route.route_name,
              distance_km: route.distance_km,
              distanceKm,
              duration_seconds: route.duration_seconds,
              durationSeconds
            });

            return (
              <IonCard key={route.route_id} className="route-card">
                <div className="route-card-inner">
                <IonCardHeader>
                  <IonCardTitle className="route-card-title">{route.route_name || 'Unnamed Route'}</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <div className="route-meta">
                    <span>
                      {distanceKm > 0 ? distanceKm.toFixed(2) : '0.00'} km / {durationLabel}
                    </span>
                    {route.route_type && (
                      <span style={{ marginLeft: '8px', textTransform: 'capitalize' }}>
                        • {route.route_type}
                      </span>
                    )}
                  </div>
                  {route.description && (
                    <p className="route-location">{route.description}</p>
                  )}

                  <div className="route-buttons">
                    <IonButton
                      size="small"
                      color="danger"
                      className="route-action-btn"
                      onClick={() => handleUnsaveRoute(route.route_id)}
                    >
                      Remove
                    </IonButton>
                    <IonButton
                      size="small"
                      color="success"
                      className="route-action-btn"
                      onClick={() => handleUseRoute(route)}
                      disabled={usingRouteId === route.route_id}
                    >
                      {usingRouteId === route.route_id ? (
                        <IonSpinner slot="start" name="crescent" />
                      ) : (
                        <IonIcon slot="start" icon={navigateOutline} />
                      )}
                      Use this route
                    </IonButton>
                  </div>
                </IonCardContent>

                {route.snapshot_url && (
                  <div className="route-map-container">
                    <img
                      src={route.snapshot_url}
                      alt={`${route.route_name} map`}
                      className="route-map-iframe"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>
              </IonCard>
            );
          })
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default SavedRoutes;
