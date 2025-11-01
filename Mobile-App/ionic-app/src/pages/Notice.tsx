import React from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon
} from "@ionic/react";
import { useHideTabBar } from "../hooks/useHideTabBar";
import Recenter from "../components/assets/recenter.svg";
import "../theme/Notice.css";

const InRunActivity: React.FC = () => {
  useHideTabBar();

  return (
    <IonPage>
      <IonContent fullscreen className="inrun-container">
        {/* Google Maps Iframe */}
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
          className="map-iframe"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Running Map"
        />

        {/* Dark Overlay for Better Readability */}
        <div className="map-overlay"></div>

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
            <IonButton
              routerLink="/traffic-notice"
              expand="block"
              className="notice-btn red"
            >
              TRAFFIC NOTICE
            </IonButton>
            <IonButton
              routerLink="/hazard-notice"
              expand="block"
              className="notice-btn orange"
            >
              HAZARD NOTICE
            </IonButton>
            <IonButton
              routerLink="/hazard-report"
              expand="block"
              className="notice-btn green"
            >
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
            <IonIcon icon={Recenter} />
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default InRunActivity;