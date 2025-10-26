import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton
} from "@ionic/react";
import { arrowBack, walk } from "ionicons/icons";
import "../theme/Paused-Run.css";
import Map from '../components/assets/map.png';

export default function PausedRun() {
  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="paused-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/RunTracking/runT1/index.html" icon={arrowBack} />
          </IonButtons>
          <div className="header-title-group">
            <IonIcon icon={walk} className="run-icon" />
            <IonTitle>Run</IonTitle>
          </div>
        </IonToolbar>
      </IonHeader>

      {/* Content */}
      <IonContent fullscreen>
  {/* Map Background */}
  <img
    src={Map}
    alt="Running Map Background"
    className="map-background-image"
  />

  {/* Bottom Overlay */}
  <div className="bottom-overlay">
    {/* Metrics */}
    <div className="metrics-row">
      <div className="metric-item">
        <span className="metric-label">TIME</span>
        <span className="metric-value">02:43:51</span>
      </div>
      <div className="metric-item">
        <span className="metric-label">DISTANCE (km)</span>
        <span className="metric-value">16.3</span>
      </div>
    </div>

    <div className="metric-item center">
      <span className="metric-label">AVG PACE (/km)</span>
      <span className="metric-value">5:42</span>
    </div>

    {/* Buttons */}
    <div className="action-buttons-row">
      <IonButton
        className="resume-btn"
        shape="round"
        routerLink="/RunTracking/runT1/index.html"
      >
        RESUME
      </IonButton>
      <IonButton
        className="finish-btn"
        shape="round"
        routerLink="/RunTracking/runT9/index.html"
      >
        FINISH
      </IonButton>
    </div>
  </div>
</IonContent>

    </IonPage>
  );
}
