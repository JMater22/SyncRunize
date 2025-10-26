import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonImg,
} from "@ionic/react";
import Map from "../components/assets/map.png";
import '../theme/Routes.css';

const SavedRoutes: React.FC = () => {
  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/RouteModule/routeM3/index.html" />
          </IonButtons>
          <IonTitle>Saved Routes</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
      <IonContent>
        {/* Search Bar */}
        <IonSearchbar placeholder="Search by keywords"></IonSearchbar>

        {/* Filter Buttons */}
        <IonSegment value="all" scrollable>
          <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="length">
            <IonLabel>Length</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="difficulty">
            <IonLabel>Difficulty</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="elevation">
            <IonLabel>Elevation</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Route List */}
        <div style={{ padding: "12px" }}>
          {/* Route Card 1 */}
          <IonCard>
            <div style={{ display: "flex" }}>
              <IonImg className="custom-map"
                src={Map}
                alt="Map thumbnail"
                style={{ width: "120px", borderRadius: "8px" }}
              />
              <div style={{ flex: 1, padding: "10px" }}>
                <IonCardHeader>
                  <IonCardTitle>McArthur Highway</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ marginBottom: "6px" }}>
                    <IonLabel color="medium">Med</IonLabel>
                    <span> 🏃 10.1 km : 14m : 2h 4m</span>
                  </div>
                  <p>Capas, Tarlac, Philippines</p>
                  <IonLabel color="success">From your location</IonLabel>
                </IonCardContent>
              </div>
            </div>
          </IonCard>

          {/* Route Card 2 */}
          <IonCard>
            <div style={{ display: "flex" }}>
              <IonImg className="custom-map"
                src={Map}
                alt="Map thumbnail"
                style={{ width: "120px", borderRadius: "8px" }}
              />
              <div style={{ flex: 1, padding: "10px" }}>
                <IonCardHeader>
                  <IonCardTitle>FL Running Route</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ marginBottom: "6px" }}>
                    <IonLabel color="success">Easy</IonLabel>
                    <span> 🏃 5.21 km : 5m : 1h 12m</span>
                  </div>
                  <p>Capas, Tarlac, Philippines</p>
                  <IonLabel color="success">From your location</IonLabel>
                </IonCardContent>
              </div>
            </div>
          </IonCard>

          {/* You can repeat more cards here just like above */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SavedRoutes;
