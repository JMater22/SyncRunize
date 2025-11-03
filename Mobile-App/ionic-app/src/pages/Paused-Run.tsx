import React from "react";
import {
  IonPage,
  IonContent,
  IonIcon,
  IonButton
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import "../theme/Paused-Run.css";
import { useHideTabBar } from "../hooks/useHideTabBar";


export default function PausedRun() {

  useHideTabBar();
  
  return (
    <IonPage>
      {/* Content */}
      <IonContent fullscreen>
        {/* Back Button - Icon Only */}
        <button
          onClick={() => window.history.back()}
          className="back-button-icon"
        >
          <IonIcon icon={arrowBack} className="back-icon" />
        </button>

        {/* Google Maps Iframe */}
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
          className="map-iframe"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Running Map"
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