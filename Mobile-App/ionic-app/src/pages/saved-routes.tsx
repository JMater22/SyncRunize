import React, { useState, useEffect } from "react";
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
} from "@ionic/react";
import { SavedRoutesApi } from "../services/saved-routes";
import { Route } from "../services/routes";
import { useUser } from "../contexts/UserContext";
import { useHistory } from "react-router-dom";
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

  useEffect(() => {
    if (currentUser) {
      fetchSavedRoutes();
    }
  }, [currentUser]);

  useEffect(() => {
    // Filter routes based on search query
    if (searchQuery.trim()) {
      const filtered = savedRoutes.filter(route =>
        route.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRoutes(filtered);
    } else {
      setFilteredRoutes(savedRoutes);
    }
  }, [searchQuery, savedRoutes]);

  const fetchSavedRoutes = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const routes = await SavedRoutesApi.getSavedRoutes(currentUser.user_id);
      setSavedRoutes(Array.isArray(routes) ? routes : []);
      setFilteredRoutes(Array.isArray(routes) ? routes : []);
    } catch (err: any) {
      console.error('Failed to fetch saved routes:', err);
      setSavedRoutes([]);
      setFilteredRoutes([]);
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
      // Refresh the list
      fetchSavedRoutes();
    } catch (err: any) {
      console.error('Failed to unsave route:', err);
      setToastMessage(err.message || 'Failed to remove route');
      setToastColor('danger');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
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
        {/* Search Bar */}
        <IonSearchbar
          placeholder="Search saved routes"
          value={searchQuery}
          onIonInput={(e) => setSearchQuery(e.detail.value || '')}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <IonSpinner name="crescent" />
            <p style={{ marginTop: '16px', color: '#666' }}>Loading saved routes...</p>
          </div>
        ) : !currentUser ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: '#666' }}>Please log in to view saved routes.</p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: '#666' }}>
              {searchQuery ? 'No saved routes found matching your search.' : 'No saved routes yet. Browse public routes to save your favorites!'}
            </p>
            <IonButton routerLink="/routes" style={{ marginTop: '16px' }}>
              Browse Routes
            </IonButton>
          </div>
        ) : (
          filteredRoutes.map((route) => (
            <IonCard key={route.route_id} className="route-card">
              <div className="route-card-inner">
                <IonCardHeader>
                  <IonCardTitle className="route-card-title">{route.route_name}</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <div className="route-meta">
                    <span>
                      {route.distance_km.toFixed(2)} km : {Math.floor(route.duration_seconds / 60)}m {route.duration_seconds % 60}s
                    </span>
                    <span style={{ marginLeft: '8px', textTransform: 'capitalize' }}>
                      • {route.route_type}
                    </span>
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
                      onClick={() => history.push(`/run-tracking`, { guidedRoute: route })}
                    >
                      Start Guided Run
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
          ))
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
