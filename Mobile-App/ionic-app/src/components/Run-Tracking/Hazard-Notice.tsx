import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent
} from "@ionic/react";
import "../theme/Hazard-Notice.css"; // custom styles if needed
import Map from '../components/assets/map.png';

export default function HazardNotice() {
  return (
    <IonPage>
      {/* Top Header */}
      <IonHeader translucent={true}>
        <IonToolbar color="warning">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/RunTracking/runT2/index.html" />
          </IonButtons>
          <IonTitle>HAZARD NOTICE</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Map Background */}
        <img
          src={Map}
          alt="Running Map Background"
          className="map-background-image"
        />

        {/* Notice Card Overlay */}
        <div className="notice-card">
          {/* Location Section */}
          <IonCard>
            <IonCardContent>
              <div className="notice-section">
                <div className="notice-icon-label">
                  <span className="icon">📍</span>
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
                  <span className="icon warning">⚠️</span>
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
