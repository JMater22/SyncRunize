import React from "react";
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
  IonImg,
} from "@ionic/react";
import { arrowBack, walk } from "ionicons/icons";
import Map from '../components/assets/map.png';
import '../theme/variables.css';

export default function RunMap() {
  return (
    <IonPage>
      {/* Top Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1" icon={arrowBack} />
          </IonButtons>
          <div className="flex items-center gap-2">
            <IonIcon icon={walk} />
            <IonTitle>Run</IonTitle>
          </div>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
     <IonContent fullscreen className="ion-padding">
  {/* Map container */}
  <div className="map-container">
    <IonImg src={Map} alt="Running Map" className="map-image" />

    {/* Start Button */}
    <IonButton
      className="start-btn"
      color="success"
      routerLink="/RunTracking/runT2"
    >
      START
    </IonButton>
  </div>
</IonContent>
    </IonPage>
  );
}
