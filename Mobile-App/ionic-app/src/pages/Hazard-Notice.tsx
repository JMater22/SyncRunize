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
  IonChip
} from "@ionic/react";
import "../theme/Hazard-Notice.css"; // custom styles if needed
import Map from "../components/assets/map.png";
import { useHideTabBar } from "../hooks/useHideTabBar";

export default function HazardNotice() {
  useHideTabBar();

  return (
    <IonPage>
      {/* Top Header */}
      <IonHeader translucent={true}>
        <IonToolbar color="warning">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/RunTracking/runT2/index.html" text=""  />
          </IonButtons>
          <IonTitle>HAZARD NOTICE</IonTitle>
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
                  <IonChip color="warning" className="status-chip">
                    <div className="pulse-dot" />
                    <span className="status-text">Hazard Detected</span>
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
                  <span className="label">Hazard Notice:</span>
                </div>
                <p className="notice-text">
                  A potential running hazard has been reported: uneven pavement
                  and shallow flooding. Exercise caution and reduce pace when
                  approaching the area.
                </p>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
}
