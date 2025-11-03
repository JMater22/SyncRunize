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
} from "@ionic/react";
import "../theme/saved-routes.css";

const SavedRoutes: React.FC = () => {
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);

  useEffect(() => {
    // ✅ Try to get current location once
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentPosition(position),
        (error) => console.warn("Error getting location:", error)
      );
    }
  }, []);

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
        <IonSearchbar placeholder="Search by keywords"></IonSearchbar>

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
                <IonButton size="small" color="success" className="route-action-btn">
                  Save
                </IonButton>
                <IonButton
                  size="small"
                  color="success"
                  disabled={!currentPosition}
                  className="route-action-btn"
                >
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
              <IonCardTitle className="route-card-title">San Roque Route</IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
              <div className="route-meta">
                <span>7.5 km : 1h 45m</span>
              </div>
              <p className="route-location">Tarlac City, Tarlac, Philippines</p>

              <div className="route-buttons">
                <IonButton size="small" color="success" className="route-action-btn">
                  Save
                </IonButton>
                <IonButton
                  size="small"
                  color="success"
                  disabled={!currentPosition}
                  className="route-action-btn"
                >
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
      </IonContent>
    </IonPage>
  );
};

export default SavedRoutes;
