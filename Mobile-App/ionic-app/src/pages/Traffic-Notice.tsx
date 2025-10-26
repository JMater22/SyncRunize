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
import "../theme/TrafficNotice.css"; // custom styles if needed
import Map from '../components/assets/map.png';

export default function TrafficNotice() {
  return (
    <IonPage>
      {/* Top Header */}
      <IonHeader translucent={true}>
        <IonToolbar color="danger">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/RunTracking/runT1/index.html" />
          </IonButtons>
          <IonTitle>TRAFFIC NOTICE</IonTitle>
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
                  Near Dalisay Store, Talaga, Capas, Tarlac
                </p>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Traffic Section */}
          <IonCard>
            <IonCardContent>
              <div className="notice-section">
                <div className="notice-icon-label">
                  <span className="icon traffic-light">🚦</span>
                  <span className="label">Traffic Notice:</span>
                </div>
                <p className="notice-text">
                  Heavy roadside traffic detected about 500 meters ahead near
                  Dalisay Store. Increased vehicle presence may affect shoulder
                  space — stay alert and consider adjusting your route.
                </p>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
}
