import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonButton
} from "@ionic/react";
import "../theme/Estimated-time.css"; // custom styles if needed
import Map from '../components/assets/map.png';

export default function FLRunningRoute() {
  return (
    <IonPage>
      {/* Top Header */}
      <IonHeader translucent={true}>
        <IonToolbar className="custom-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>FL Running Route</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="map-content">
        {/* Map Background */}
        <div className="map-container">
          <img
            src={Map}
            alt="Running Map"
            className="map-background-image"
          />
        </div>

        {/* Floating Card */}
        <div className="floating-card">
          
          <div className="card-content">
            <div className="card-section">
              <div >
                 <p className="label">Estimated Time</p>
               
              <h2 className="time-value">01:12:15</h2>
            </div>

            <div className="card-section distance-section">
              <p className="label">Distance</p>
              <h2 className="distance-value">5.21km</h2>
            </div>
 <IonButton  className="start-btn-container">
              START
            </IonButton>
            </div>
             
            
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}