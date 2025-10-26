import React from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon
} from "@ionic/react";
import { locationSharp } from "ionicons/icons";
import "../theme/Notice.css"; // custom styles if needed
import Map from '../components/assets/map.png';


const InRunActivity: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen className="inrun-container">
        {/* Background Map */}
        <img
          src={Map}
          alt="Running Map Background"
          className="map-background"
        />

        {/* Overlay Content */}
        <div className="overlay">
          {/* Metrics */}
          <div className="metrics">
            <div className="metric-item">
              <span className="metric-label time">TIME</span>
              <span className="metric-value">02:43:51</span>
            </div>
            <div className="metric-item">
              <span className="metric-label pace">AVERAGE PACE</span>
              <span className="metric-value">5:42</span>
              <span className="metric-unit">/KM</span>
            </div>
            <div className="metric-item">
              <span className="metric-label distance">DISTANCE</span>
              <span className="metric-value">16.3</span>
              <span className="metric-unit">KM</span>
            </div>
          </div>

          {/* Notice Buttons */}
          <div className="notice-buttons">
            <IonButton routerLink="/traffic-notice" expand="block" className="notice-btn red">
              TRAFFIC NOTICE
            </IonButton>
            <IonButton routerLink="/hazard-notice" expand="block" className="notice-btn orange">
              HAZARD NOTICE
            </IonButton>
            <IonButton routerLink="/hazard-report" expand="block" className="notice-btn green">
              REPORT HAZARD
            </IonButton>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="bottom-actions">
          <IonButton routerLink="/paused" shape="round" className="stop-btn">
            STOP
          </IonButton>
          <IonButton shape="round" className="map-btn">
            <IonIcon icon={locationSharp} />
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default InRunActivity;
