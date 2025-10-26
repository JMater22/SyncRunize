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
  IonInput,
  IonFab,
  IonFabButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonLabel,
  IonAccordion,
  IonAccordionGroup,
  IonItem
} from "@ionic/react";
import { arrowBack, bookmark, pencil, pin } from "ionicons/icons";
import Map from '../components/assets/map.png';
import '../theme/Routes.css';

const RouteSuggestion: React.FC = () => {
  return (
    <IonPage>
      {/* Top Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton
              defaultHref="/HomeModule/homeM1/index.html"
              icon={arrowBack}
            />
          </IonButtons>
          <IonTitle>Route Suggestion Map</IonTitle>
          <IonButtons slot="end">
            <IonButton routerLink="/saved-routes">
              <IonIcon  icon={bookmark} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
      <IonContent fullscreen>
        {/* Search Bar */}
        <div className="search-bar" style={{ padding: "10px" }}>
          <IonInput placeholder="Search locations"></IonInput>
        </div>

        {/* Map Area */}
        <div className="map-area" style={{ position: "relative" }}>
          <IonImg src={Map} alt="Map of current location" />
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton color="success" routerLink="/create-route">
              <IonIcon  icon={pencil} />
            </IonFabButton>
          </IonFab>
        </div>

        {/* Suggested Routes Panel using IonAccordion */}
        <IonAccordionGroup value="routes">
  <IonAccordion value="routes">
    <IonItem slot="header" lines="none">
      <IonLabel ><IonIcon className="custom-size" color="success" icon={pin} /> Suggested Routes For You</IonLabel>
    </IonItem>

    <div slot="content" style={{ padding: "12px" }}>
      {/* Route cards... */}
      {/* Route Card 1 */}
              <IonCard>
  <div style={{ display: "flex", alignItems: "stretch" }}>
    {/* Left: Map Thumbnail */}
    <IonImg
      src={Map}
      alt="Map thumbnail"
      className="map-img"
    />

    {/* Right: Details */}
    <div style={{ flex: 1, padding: "10px" }}>
      <IonCardHeader>
        <IonCardTitle>FL Running Route</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <div className="route-meta" style={{ marginBottom: "6px" }}>
          <IonLabel color="success">Easy</IonLabel>
          <span> 🏃 5.21 km : 5m : 1h 12m</span>
        </div>
        <p style={{ marginBottom: "10px" }}>Capas, Tarlac, Philippines</p>

        <div style={{ display: "flex", gap: "10px" }}>
          <IonButton size="small" color="success">Save</IonButton>
          <IonButton size="small" color="success">
            From your location
          </IonButton>
        </div>
      </IonCardContent>
    </div>
  </div>
</IonCard>

              {/* Route Card 2 */}
              <IonCard>
  <div style={{ display: "flex", alignItems: "stretch" }}>
    {/* Left: Map Thumbnail */}
    <IonImg
      src={Map}
      alt="Map thumbnail"
      className="map-img"
    />

    {/* Right: Details */}
    <div style={{ flex: 1, padding: "10px" }}>
      <IonCardHeader>
        <IonCardTitle>FL Running Route</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <div className="route-meta" style={{ marginBottom: "6px" }}>
          <IonLabel color="success">Medium</IonLabel>
          <span> 🏃 5.21 km : 5m : 1h 12m</span>
        </div>
        <p style={{ marginBottom: "10px" }}>Capas, Tarlac, Philippines</p>

        <div style={{ display: "flex", gap: "10px" }}>
          <IonButton size="small" color="success">Save</IonButton>
          <IonButton size="small" color="success">
            From your location
          </IonButton>
        </div>
      </IonCardContent>
    </div>
  </div>
</IonCard>

    </div>
  </IonAccordion>
</IonAccordionGroup>
      </IonContent>
    </IonPage>
  );
};

export default RouteSuggestion;
