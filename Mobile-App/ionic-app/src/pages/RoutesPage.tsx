import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSearchbar,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonIcon,
  IonSpinner,
  IonModal,
  IonLabel,
  IonToast,
} from '@ionic/react';
import { bookmark, pencil, navigateOutline, informationCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { RoutesApi, Route } from '../services/routes';
import { SavedRoutesApi } from '../services/saved-routes';
import { buildGuidedRoutePayload, normalizeRoutePath } from '../lib/routeGuides';
import { formatDurationShort, formatPace } from '../lib/utils';
import '../theme/Routes.css';

const RoutesPage: React.FC = () => {
  const history = useHistory();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [savingRouteId, setSavingRouteId] = useState<number | null>(null);
  const [usingRouteId, setUsingRouteId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; color: 'success' | 'danger' | 'primary' }>({
    open: false,
    message: '',
    color: 'success',
  });

  const showToast = (message: string, color: 'success' | 'danger' | 'primary' = 'success') => {
    setToast({ open: true, message, color });
  };

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await RoutesApi.getPublicRoutes();
      setRoutes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load routes:', err);
      showToast(err?.message || 'Unable to load public routes', 'danger');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const query = searchQuery.toLowerCase();
    return routes.filter(
      (route) =>
        route.route_name.toLowerCase().includes(query) ||
        (route.description ? route.description.toLowerCase().includes(query) : false),
    );
  }, [routes, searchQuery]);

  const handleSaveRoute = async (routeId: number) => {
    try {
      setSavingRouteId(routeId);
      await SavedRoutesApi.saveRouteToLibrary({ route_id: routeId });
      showToast('Route saved to your library');
    } catch (err: any) {
      console.error('Failed to save route:', err);
      showToast(err?.message || 'Unable to save route', 'danger');
    } finally {
      setSavingRouteId(null);
    }
  };

  const handleUseRoute = async (route: Route) => {
    try {
      setUsingRouteId(route.route_id);
      let hydrated = route;
      let path = normalizeRoutePath(route.chosen_path, []);
      if (!path.length) {
        hydrated = await RoutesApi.getRoute(route.route_id);
        path = normalizeRoutePath(hydrated.chosen_path, []);
      }
      if (!path.length) {
        throw new Error('This route does not have a path yet.');
      }
      const payload = buildGuidedRoutePayload(hydrated, path);
      history.push('/run-tracking', { guidedRoute: payload });
    } catch (err: any) {
      console.error('Failed to use route:', err);
      showToast(err?.message || 'Unable to load this route', 'danger');
    } finally {
      setUsingRouteId(null);
    }
  };

  const openDetails = (route: Route) => {
    setSelectedRoute(route);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedRoute(null);
  };

  const renderRouteMeta = (route: Route) => {
    const stats: string[] = [];
    stats.push(`${route.distance_km.toFixed(2)} km`);
    stats.push(formatDurationShort(route.duration_seconds));
    if (route.average_pace) {
      stats.push(formatPace(route.average_pace));
    }
    return stats.join(' · ');
  };

  return (
    <IonPage>
      <IonHeader className="route-header">
        <IonToolbar className="route-toolbar">
          <IonTitle>Routes</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => history.push('/saved-routes')}>
              <IonIcon icon={bookmark} slot="icon-only" />
            </IonButton>
            <IonButton fill="clear" onClick={() => history.push('/create-route')}>
              <IonIcon icon={pencil} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="routes-search-bar">
          <IonSearchbar
            placeholder="Search public routes"
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value || '')}
          />
        </div>

        {loading ? (
          <div className="routes-empty">
            <IonSpinner name="crescent" />
            <p>Loading public routes...</p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="routes-empty">
            <IonIcon icon={informationCircleOutline} />
            <p>{searchQuery ? 'No routes match your search.' : 'No public routes available yet.'}</p>
          </div>
        ) : (
          filteredRoutes.map((route) => (
            <IonCard key={route.route_id} className="route-card" onClick={() => openDetails(route)}>
              {route.snapshot_url && (
                <div className="route-card-media">
                  <img src={route.snapshot_url} alt={`${route.route_name} map`} />
                </div>
              )}
              <IonCardHeader>
                <IonCardTitle>{route.route_name}</IonCardTitle>
                <p className="route-card-meta">{renderRouteMeta(route)}</p>
              </IonCardHeader>
              <IonCardContent>
                {route.description && <p className="route-card-description">{route.description}</p>}
                <div className="route-card-actions">
                  <IonButton
                    size="small"
                    color="success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveRoute(route.route_id);
                    }}
                    disabled={savingRouteId === route.route_id}
                  >
                    {savingRouteId === route.route_id && <IonSpinner slot="start" name="crescent" />}
                    Save
                  </IonButton>
                  <IonButton
                    size="small"
                    fill="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseRoute(route);
                    }}
                    disabled={usingRouteId === route.route_id}
                  >
                    {usingRouteId === route.route_id ? (
                      <IonSpinner slot="start" name="crescent" />
                    ) : (
                      <IonIcon slot="start" icon={navigateOutline} />
                    )}
                    Use route
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}

        <IonModal isOpen={showDetails && !!selectedRoute} onDidDismiss={closeDetails}>
          {selectedRoute && (
            <div className="route-detail-modal">
              <IonHeader>
                <IonToolbar>
                  <IonTitle>{selectedRoute.route_name}</IonTitle>
                  <IonButtons slot="end">
                    <IonButton onClick={closeDetails}>Close</IonButton>
                  </IonButtons>
                </IonToolbar>
              </IonHeader>
              <IonContent>
                {selectedRoute.snapshot_url && (
                  <div className="route-detail-image">
                    <img src={selectedRoute.snapshot_url} alt={`${selectedRoute.route_name} snapshot`} />
                  </div>
                )}
                <div className="route-detail-body">
                  <div className="route-detail-stats">
                    <div>
                      <IonLabel>Distance</IonLabel>
                      <strong>{selectedRoute.distance_km.toFixed(2)} km</strong>
                    </div>
                    <div>
                      <IonLabel>Duration</IonLabel>
                      <strong>{formatDurationShort(selectedRoute.duration_seconds)}</strong>
                    </div>
                    <div>
                      <IonLabel>Avg pace</IonLabel>
                      <strong>{formatPace(selectedRoute.average_pace || 0)}</strong>
                    </div>
                    <div>
                      <IonLabel>Calories</IonLabel>
                      <strong>{Math.round(selectedRoute.estimated_calories || 0)} kcal</strong>
                    </div>
                  </div>
                  {selectedRoute.description && (
                    <p className="route-detail-description">{selectedRoute.description}</p>
                  )}
                  <div className="route-card-actions">
                    <IonButton
                      expand="block"
                      color="success"
                      onClick={() => handleSaveRoute(selectedRoute.route_id)}
                      disabled={savingRouteId === selectedRoute.route_id}
                    >
                      {savingRouteId === selectedRoute.route_id && <IonSpinner slot="start" name="crescent" />}
                      Save to my routes
                    </IonButton>
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={() => handleUseRoute(selectedRoute)}
                      disabled={usingRouteId === selectedRoute.route_id}
                    >
                      {usingRouteId === selectedRoute.route_id ? (
                        <IonSpinner slot="start" name="crescent" />
                      ) : (
                        <IonIcon slot="start" icon={navigateOutline} />
                      )}
                      Use this route
                    </IonButton>
                  </div>
                </div>
              </IonContent>
            </div>
          )}
        </IonModal>

        <IonToast
          isOpen={toast.open}
          message={toast.message}
          onDidDismiss={() => setToast((prev) => ({ ...prev, open: false }))}
          duration={2500}
          color={toast.color}
        />
      </IonContent>
    </IonPage>
  );
};

export default RoutesPage;
