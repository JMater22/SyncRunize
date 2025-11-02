import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonChip,
  IonIcon
} from "@ionic/react";
import { location, warning } from 'ionicons/icons';
import "../theme/TrafficNotice.css";
import { useHideTabBar } from "../hooks/useHideTabBar";

export default function TrafficNotice() {
  useHideTabBar();
  
  return (
    <IonPage>
      <IonHeader translucent={true} className="traffic-header">
        <IonToolbar color="danger">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/RunTracking/runT1/index.html" text="" />
          </IonButtons>
          <IonTitle className="ion-text-center header-title">
            <IonIcon icon={warning} className="header-icon" />
            TRAFFIC ALERT
          </IonTitle>
        </IonToolbar>
      </IonHeader> 

      <IonContent fullscreen className="traffic-content">
        {/* Map Background Container */}
        <div className="map-container">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
            className="map-iframe"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Traffic Map Location"
          />
          <div className="map-overlay" />
          <div className="map-vignette" />
        </div>

        {/* Status Indicator */}
        <div className="status-indicator">
          <IonChip color="danger" className="status-chip">
            <div className="pulse-dot" />
            <span className="status-text">Heavy Traffic Detected</span>
          </IonChip>
        </div>

       {/* Notice Card Overlay */}
        <div className="notice-card">
          {/* Location Section */}
          <IonCard>
            <IonCardContent>
              <div className="notice-section">
                <div className="notice-icon-label">
                  <span className="label">Location:</span>
                </div>
                <p className="notice-text">
                  Around 500m from your current position, near Dalisay Store
                </p>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Hazard Section */}
          <IonCard>
            <IonCardContent>
              <div className="notice-section">
                <div className="notice-icon-label">
                  <span className="label">Traffic Notice:</span>
                </div>
                <p className="notice-text">
                  Heavy traffic and road congestion reported ahead. Expect delays and proceed
                  carefully when navigating through the area.
                </p>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
}