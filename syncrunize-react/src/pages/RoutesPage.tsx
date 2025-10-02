import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonFooter
} from "@ionic/react";

import MapImage from "../assets/MAP 1.png";
import '../components/Routes/RoutesPage.css';
import CustomCard from "../components/Routes/CustomCard";

const RoutesPage: React.FC = () => {
  return (
    <IonPage>
      <IonContent>
        {/* Header Title */}
        <IonRow className="routes-header ion-align-items-center">
          <IonCol size="12">
            <h1 className="my-routes-title">My Routes</h1>
          </IonCol>
        </IonRow>
        {/* Search + Button */}
        <IonRow className="ion-align-items-center ion-justify-content-between">
          {/* Searchbar Column */}
          <IonCol size="" className="searchbar-container">
            <IonSearchbar 
              placeholder="Search for keywords" 
              className="custom-searchbar"/>
          </IonCol>

          {/* Button Column */}
          <IonCol size="4" className="button-col ion-text-right">
            <IonButton 
              expand="block" 
              className="create-route-btn">
              Create New Route
            </IonButton>
          </IonCol>
        </IonRow>

        {/* Routes Grid */}
        <IonGrid className="routes-container">
          <IonRow>
            {/* Example Routes */}
            {[
              { title: "Tarlac", dist: "27.6 km", time: "1:33:44", date: "April 5, 2025" },
              { title: "San Manuel", dist: "6 km", time: "33:44", date: "April 13, 2025" },
              { title: "Capas", dist: "2 km", time: "13:24", date: "March 19, 2025" },
              { title: "San Vicente", dist: "7.6 km", time: "1:13:44", date: "March 1, 2025" },
              { title: "Tarlac", dist: "27.6 km", time: "1:33:44", date: "April 5, 2025" },
              { title: "San Manuel", dist: "6 km", time: "33:44", date: "April 13, 2025" },
              { title: "Capas", dist: "2 km", time: "13:24", date: "March 19, 2025" },
              { title: "San Vicente", dist: "7.6 km", time: "1:13:44", date: "March 1, 2025" },
              { title: "Tarlac", dist: "27.6 km", time: "1:33:44", date: "April 5, 2025" },
              { title: "San Manuel", dist: "6 km", time: "33:44", date: "April 13, 2025" },
              { title: "Capas", dist: "2 km", time: "13:24", date: "March 19, 2025" },
              { title: "San Vicente", dist: "7.6 km", time: "1:13:44", date: "March 1, 2025" },
            ].map((route, index) => (
              <IonCol key={index} size="12" sizeMd="6" sizeLg="3">
                <CustomCard>
                  <IonImg src={MapImage} alt={`Map of ${route.title} Route`} />
                  <IonCardHeader>
                    <IonCardTitle>{route.title}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p>
                      <strong>{route.dist}</strong> Distance
                    </p>
                    <p>
                      Est Moving Time <strong>{route.time}</strong>
                    </p>
                    <p>Created on {route.date}</p>
                  </IonCardContent>
                </CustomCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>


    </IonPage>
  );
};

export default RoutesPage;
