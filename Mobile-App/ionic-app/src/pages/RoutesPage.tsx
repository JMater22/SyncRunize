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
  IonLabel,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonSearchbar,
  IonSpinner,
  IonToast
} from "@ionic/react";
import { arrowBack, bookmark, pencil, pin, locate } from "ionicons/icons";
import { Geolocation } from "@capacitor/geolocation";
import { usePushNotifications } from "../components/push-notification";
import "../theme/Routes.css";

interface Position {
  latitude: number;
  longitude: number;
}

const RouteSuggestion: React.FC = () => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "primary">("danger");
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);

  // Initialize push notifications
  usePushNotifications({
    onNotificationReceived: (notification) => {
      console.log('Notification received on Routes:', notification);
      
      const notifType = notification.data?.type;
      
      if (notifType === 'route') {
        setToastMessage(`📍 ${notification.title || 'New Route Available'}`);
        setToastColor("primary");
      } else if (notifType === 'saved-route') {
        setToastMessage(`⭐ ${notification.title || 'Route Saved Successfully'}`);
        setToastColor("success");
      } else if (notifType === 'nearby') {
        setToastMessage(`📌 ${notification.title || 'Nearby Route Suggestion'}`);
        setToastColor("primary");
      } else {
        setToastMessage(notification.title || 'New notification');
        setToastColor("primary");
      }
      
      setShowToast(true);
    },
    onNotificationActionPerformed: (notification) => {
      console.log('Notification tapped on Routes:', notification);
      
      const data = notification.notification.data;
      
      if (data?.type === 'route' || data?.type === 'nearby') {
        // Expand the suggested routes accordion
        setAccordionValue('routes');
        
        // Scroll to suggested routes
        setTimeout(() => {
          const routesAccordion = document.querySelector('.accordion-content');
          routesAccordion?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else if (data?.type === 'saved-route') {
        // Navigate to saved routes page
        window.location.href = '/saved-routes';
      }
    }
  });

  useEffect(() => {
    getCurrentPosition();
  }, []);

  const getCurrentPosition = async () => {
    setLoading(true);
    setError("");

    try {
      const permission = await Geolocation.checkPermissions();

      if (permission.location !== "granted") {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== "granted") {
          setError("Location permission denied");
          setToastColor("danger");
          setToastMessage("Location permission denied");
          setShowToast(true);
          setLoading(false);
          return;
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      setCurrentPosition({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      console.log("Current position:", position.coords);
    } catch (err: any) {
      console.error("Error getting location:", err);
      setError(err.message || "Failed to get location");
      setToastColor("danger");
      setToastMessage(err.message || "Failed to get location");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      {/* Header */}
        <IonHeader className="route-header">
          <IonToolbar className="route-toolbar">
            <IonButtons slot="start" className="route-back-buttons">
              <IonBackButton
                defaultHref="/HomeModule/homeM1/index.html"
                className="route-back-button"
                text=""
              />
            </IonButtons>

            <IonTitle className="route-title">Route Suggestion</IonTitle>

            <IonButtons slot="end" className="route-action-buttons">
              <IonButton
                onClick={getCurrentPosition}
                disabled={loading}
                className="route-locate-button"
              >
                {loading ? (
                  <IonSpinner name="crescent" className="route-loading-spinner" />
                ) : (
                  <IonIcon icon={locate} className="route-locate-icon" />
                )}
              </IonButton>

              <IonButton
                routerLink="/saved-routes"
                className="route-bookmark-button"
              >
                <IonIcon icon={bookmark} className="route-bookmark-icon" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

      {/* Main Content */}
      <IonContent fullscreen>
        {/* Search */}
        <div className="search-bar">
          <IonSearchbar placeholder="Search location" className="challenge-search" />
        </div>

        {/* Current Location Info */}
        {currentPosition && (
          <div className="current-location-info">
            <small>
               Lat: {currentPosition.latitude.toFixed(6)}, Lng: {currentPosition.longitude.toFixed(6)}
            </small>
          </div>
        )}

        {/* Map Area - hides when accordion is expanded */}
        {accordionValue !== "routes" && (
          <div className="map-area">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
              className="map-iframe"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Main Map" 
            ></iframe>

          <IonFab vertical="bottom" horizontal="end" slot="fixed" className="create-route-fab">
            <IonFabButton  routerLink="/create-route" className="create-route-fab-button">
              <IonIcon icon={pencil} className="create-route-fab-icon" />
            </IonFabButton>
          </IonFab>
          </div>
        )}

        {/* Suggested Routes - positioned at bottom, expands on click */}
        <IonAccordionGroup value={accordionValue} onIonChange={(e) => setAccordionValue(e.detail.value)}>
          <IonAccordion value="routes">
            <IonItem slot="header" lines="none" className="accordion-header">
              <IonLabel className="custom-size">
                   Suggested Routes For You
              </IonLabel>
            </IonItem>

            <div slot="content" className="accordion-content">
              {/* Route Card 1 */}
              <IonCard className="route-card">
                <div className="route-card-inner">
                  <IonCardHeader>
                    <IonCardTitle className="route-card-title">Capas Route</IonCardTitle>
                  </IonCardHeader>

                  <IonCardContent>
                    <div className="route-meta">
                      <span>5.21 km : 1h 12m</span>
                    </div>
                    <p className="route-location">Capas, Tarlac, Philippines</p>

                    <div className="route-buttons">
                      <IonButton 
                        size="small" 
                        color="success" 
                        className="route-action-btn"
                        onClick={() => {
                          setToastMessage("Route saved successfully!");
                          setToastColor("success");
                          setShowToast(true);
                        }}
                      >
                        Save
                      </IonButton>
                      <IonButton size="small" color="success" disabled={!currentPosition} className="route-action-btn">
                        From your location
                      </IonButton>
                    </div>
                  </IonCardContent>

                  <div className="route-map-container">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
                      className="route-map-iframe"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Route Map 1"
                    ></iframe>
                  </div>
                </div>
              </IonCard>

              {/* Route Card 2 */}
              <IonCard className="route-card">
                <div className="route-card-inner">
                  <IonCardHeader>
                    <IonCardTitle className="route-card-title">San. Roque Route </IonCardTitle>
                  </IonCardHeader>

                  <IonCardContent>
                    <div className="route-meta">
                      <span>7.5 km : 1h 45m</span>
                    </div>
                    <p className="route-location">Tarlac City, Tarlac, Philippines</p>

                    <div className="route-buttons">
                      <IonButton 
                        size="small" 
                        color="success" 
                        className="route-action-btn"
                        onClick={() => {
                          setToastMessage("Route saved successfully!");
                          setToastColor("success");
                          setShowToast(true);
                        }}
                      >
                        Save
                      </IonButton>
                      <IonButton size="small" color="success" disabled={!currentPosition} className="route-action-btn">
                        From your location
                      </IonButton>
                    </div>
                  </IonCardContent>

                  <div className="route-map-container">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
                      className="route-map-iframe"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Route Map 2"
                    ></iframe>
                  </div>
                </div>
              </IonCard>
            </div>
          </IonAccordion>
        </IonAccordionGroup>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default RouteSuggestion;