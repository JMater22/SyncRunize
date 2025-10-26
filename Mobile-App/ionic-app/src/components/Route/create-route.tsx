import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonImg,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonSegment,
  IonSegmentButton,
  IonButton,
} from "@ionic/react";
import Map from "../components/assets/map.png";
import '../theme/Routes.css';
import '../theme/global.css';

const CreateRoute: React.FC = () => {
  const [isPublic, setIsPublic] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [unit, setUnit] = useState("km");

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="dark-header">
        <IonToolbar >
          <IonButtons slot="start">
            <IonBackButton defaultHref="/RouteModule/routeM1/index.html" />
          </IonButtons>
          <IonTitle>Create Route</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
      <IonContent fullscreen>
        <div className="map-container">
          <IonImg src={Map} alt="Map with green route" />
          <div className="runner-icon">🏃</div>

          {/* Floating Form Panel */}
          <div className="route-panel">
            {/* Route Summary Bar */}
            <div className="summary-bar">
              <div>
                <div className="summary-label">Distance</div>
                <div className="summary-value">23 KM</div>
              </div>
              <div>
                <div className="summary-label">Estimated Time</div>
                <div className="summary-value">1:42:22</div>
              </div>
            </div>

            {/* Route Details */}
            <div className="route-details-header">
              <h3>Route Details</h3>
              <div className="public-toggle">
                <span>Public</span>
                <IonToggle
                  checked={isPublic}
                  onIonChange={(e) => setIsPublic(e.detail.checked)}
                  color="success"
                />
              </div>
            </div>

            {/* Route Name */}
            <IonItem  lines="none">
              <IonLabel position="stacked">Name</IonLabel>
              <IonInput placeholder="Enter route name" />
            </IonItem>

            {/* Start Point */}
            <IonItem  lines="none">
              <IonLabel position="stacked">▶️ Start Point</IonLabel>
              <IonInput placeholder="Start Point" />
            </IonItem>

            {/* End Point */}
            <IonItem  lines="none">
              <IonLabel position="stacked">⏹️ End Point</IonLabel>
              <IonInput placeholder="End Point" />
            </IonItem>

            {/* Map Preferences */}
            <h3 className="section-title">Map Preferences</h3>
            <IonItem  lines="none">
              <IonLabel>🌐 Show Heatmap</IonLabel>
              <IonToggle
                checked={showHeatmap}
                onIonChange={(e) => setShowHeatmap(e.detail.checked)}
                color="success"
              />
            </IonItem>

            {/* Routing Preferences */}
            <h3 className="section-title">Routing Preferences</h3>
            <IonItem  lines="none">
              <IonLabel>🔢 Unit</IonLabel>
            </IonItem>
            <IonSegment
              value={unit}
              onIonChange={(e) => setUnit(e.detail.value as "km" | "mi")}
              
            >
              <IonSegmentButton value="km">
                <IonLabel>km</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="mi">
                <IonLabel>mi</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* Action Buttons */}
            <div className="action-buttons">
              <IonButton
                expand="block"
                color="medium"
                routerLink="/RouteModule/routeM1/index.html"
                className="cancel-btn"
              >
                Cancel
              </IonButton>
              <IonButton
                expand="block"
                color="success"
                routerLink="/RouteModule/routeM4/index.html"
                className="save-btn"
              >
                Save
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreateRoute;
