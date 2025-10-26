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
        routerLink="/run-tracking"
      >
        RESUME
      </IonButton>
      <IonButton
        className="finish-btn"
        shape="round"
        routerLink="/activity-summary"
      >
        FINISH
      </IonButton>
    </div>
  </div>
</IonContent>

    </IonPage>
  );
}
