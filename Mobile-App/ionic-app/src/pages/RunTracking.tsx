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
import '../theme/global.css';
import '../theme/Run-Main.css';

export default function RunMap() {
  return (
    <IonPage>
      {/* Top Header */}
      <IonHeader className="dark-header">
        <IonToolbar >
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1" icon={arrowBack} />
          </IonButtons>
          <IonTitle className="header-title">
            <div className="title-container">
            <IonIcon className="run-icon" icon={walk}></IonIcon>
              <span>Run</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
      <IonContent fullscreen className="run-map-content">
        {/* Map container */}
        <div className="map-container">
          <IonImg src={Map} alt="Running Map" className="map-image" />

          {/* Start Button */}
          <IonButton 
            className="start-button"
            color="success"
            size="large"
            routerLink="/notice"
          >
            START
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}