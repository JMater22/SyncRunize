import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonLabel,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonSearchbar,
  IonSpinner,
  IonToast
} from "@ionic/react";
import { arrowBack, bookmark, pencil, pin, locate } from "ionicons/icons";
import { Geolocation } from '@capacitor/geolocation';
import Map from '../components/assets/map.png';
import '../theme/Routes.css';

interface Position {
  latitude: number;
  longitude: number;
}

const RouteSuggestion: React.FC = () => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showToast, setShowToast] = useState(false);

  // Get current position on component mount
  useEffect(() => {
    getCurrentPosition();
  }, []);

  // Request permission and get current position
  const getCurrentPosition = async () => {
    setLoading(true);
    setError("");

    try {
      // Check and request permissions
      const permission = await Geolocation.checkPermissions();
      
      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') {
          setError("Location permission denied");
          setShowToast(true);
          setLoading(false);
          return;
        }
      }

      // Get current position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      setCurrentPosition({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });

      console.log('Current position:', position.coords);
    } catch (err: any) {
      console.error('Error getting location:', err);
      setError(err.message || "Failed to get location");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Watch position (continuous tracking)
  const watchPosition = async () => {
    try {
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        },
        (position, err) => {
          if (err) {
            console.error('Watch position error:', err);
            return;
          }
          if (position) {
            setCurrentPosition({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            console.log('Position updated:', position.coords);
          }
        }
      );

      // To stop watching, you would call:
      // await Geolocation.clearWatch({ id: watchId });
      
      return watchId;
    } catch (err) {
      console.error('Error watching position:', err);
    }
  };

  return (
    <IonPage>
      {/* Top Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton
              defaultHref="/HomeModule/homeM1/index.html"
              icon={arrowBack}
            />
          </IonButtons>
          <IonTitle>Route Suggestion Map</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={getCurrentPosition} disabled={loading}>
              {loading ? <IonSpinner name="crescent" /> : <IonIcon icon={locate} />}
            </IonButton>
            <IonButton routerLink="/saved-routes">
              <IonIcon icon={bookmark} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
      <IonContent fullscreen>
        {/* Search Bar */}
        <div className="search-bar" style={{ padding: "10px" }}>
          <IonSearchbar
            placeholder="Search location"
            className="challenge-search"
          />
        </div>

        {/* Current Location Display */}
        {currentPosition && (
          <div style={{ padding: "10px", backgroundColor: "#f0f0f0", textAlign: "center" }}>
            <small>
              📍 Lat: {currentPosition.latitude.toFixed(6)}, 
              Lng: {currentPosition.longitude.toFixed(6)}
            </small>
          </div>
        )}

        {/* Map Area */}
        <div className="map-area" style={{ position: "relative" }}>
          <IonImg src={Map} alt="Map of current location" />
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton color="success" routerLink="/create-route">
              <IonIcon icon={pencil} />
            </IonFabButton>
          </IonFab>
        </div>

        {/* Suggested Routes Panel using IonAccordion */}
        <IonAccordionGroup value="routes">
          <IonAccordion value="routes">
            <IonItem slot="header" lines="none">
              <IonLabel>
                <IonIcon className="custom-size" color="success" icon={pin} /> 
                Suggested Routes For You
              </IonLabel>
            </IonItem>

            <div slot="content" style={{ padding: "12px" }}>
              {/* Route Card 1 */}
              <IonCard>
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  {/* Left: Map Thumbnail */}
                  <IonImg
                    src={Map}
                    alt="Map thumbnail"
                    className="map-img"
                  />

                  {/* Right: Details */}
                  <div style={{ flex: 1, padding: "10px" }}>
                    <IonCardHeader>
                      <IonCardTitle>FL Running Route</IonCardTitle>
                    </IonCardHeader>

                    <IonCardContent>
                      <div className="route-meta" style={{ marginBottom: "6px" }}>
                        <IonLabel color="success">Easy</IonLabel>
                        <span> 🏃 5.21 km : 5m : 1h 12m</span>
                      </div>
                      <p style={{ marginBottom: "10px" }}>Capas, Tarlac, Philippines</p>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <IonButton size="small" color="success">Save</IonButton>
                        <IonButton 
                          size="small" 
                          color="success"
                          disabled={!currentPosition}
                        >
                          From your location
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </div>
                </div>
              </IonCard>

              {/* Route Card 2 */}
              <IonCard>
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  {/* Left: Map Thumbnail */}
                  <IonImg
                    src={Map}
                    alt="Map thumbnail"
                    className="map-img"
                  />

                  {/* Right: Details */}
                  <div style={{ flex: 1, padding: "10px" }}>
                    <IonCardHeader>
                      <IonCardTitle>FL Running Route</IonCardTitle>
                    </IonCardHeader>

                    <IonCardContent>
                      <div className="route-meta" style={{ marginBottom: "6px" }}>
                        <IonLabel color="success">Medium</IonLabel>
                        <span> 🏃 5.21 km : 5m : 1h 12m</span>
                      </div>
                      <p style={{ marginBottom: "10px" }}>Capas, Tarlac, Philippines</p>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <IonButton size="small" color="success">Save</IonButton>
                        <IonButton 
                          size="small" 
                          color="success"
                          disabled={!currentPosition}
                        >
                          From your location
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </div>
                </div>
              </IonCard>
            </div>
          </IonAccordion>
        </IonAccordionGroup>

        {/* Toast for errors */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={error}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default RouteSuggestion;