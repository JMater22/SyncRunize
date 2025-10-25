import React, { useState } from "react";
import {
  IonPage,
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
  IonIcon
} from "@ionic/react";
import { trashOutline, arrowBack } from 'ionicons/icons';

import MapImage from "../../assets/MAP 1.png";
import './SavedRoutesPage.css';
import CustomCard from "./CustomCard";
import { useHistory } from 'react-router-dom';

interface Route {
  id: number;
  title: string;
  dist: string;
  time: string;
  date: string;
}

const SavedRoutesPage: React.FC = () => {
  const history = useHistory();

  const [savedRoutes, setSavedRoutes] = useState<Route[]>([
    { id: 1, title: "Tarlac", dist: "27.6 km", time: "1:33:44", date: "April 5, 2025" },
    { id: 2, title: "San Manuel", dist: "6 km", time: "33:44", date: "April 13, 2025" },
    { id: 3, title: "Capas", dist: "2 km", time: "13:24", date: "March 19, 2025" },
    { id: 4, title: "San Vicente", dist: "7.6 km", time: "1:13:44", date: "March 1, 2025" },
    { id: 5, title: "Tarlac", dist: "27.6 km", time: "1:33:44", date: "April 5, 2025" },
    { id: 6, title: "San Manuel", dist: "6 km", time: "33:44", date: "April 13, 2025" },
  ]);

  const handleBack = () => {
    history.push('/routes');
  };

  const handleRemoveRoute = (id: number) => {
    setSavedRoutes(savedRoutes.filter(route => route.id !== id));
  };

  return (
    <IonPage> 
      <IonContent> 
        {/* Header Title */}
        <IonRow className="routes-header ion-align-items-center">
          <IonCol size="12">
            <IonButton  
              className="back-btn"
              onClick={handleBack}>
              Back
            </IonButton>
            <h1 className="my-routes-title">Saved Routes</h1>
          </IonCol>
        </IonRow>

        {/* Search */}
        <IonRow className="ion-align-items-center ion-justify-content-between">
          {/* Searchbar Column */}
          <IonCol size="" className="searchbar-container">
            <IonSearchbar 
              placeholder="Search saved routes" 
              className="custom-searchbar"/>
          </IonCol>
        </IonRow>

        {/* Routes Grid */}
        <IonGrid className="routes-container">
          <IonRow>
            {savedRoutes.length === 0 ? (
              <IonCol size="12" className="ion-text-center">
                <p style={{ fontSize: '18px', color: '#666', marginTop: '40px' }}>
                  No saved routes yet
                </p>
              </IonCol>
            ) : (
              savedRoutes.map((route) => (
                <IonCol key={route.id} size="12" sizeMd="6" sizeLg="3">
                  <CustomCard className="saved-route-card">
                    <div className="card-image-wrapper">
                      <IonImg src={MapImage} alt={`Map of ${route.title} Route`} />
                      <button 
                        className="remove-icon-btn"
                        onClick={() => handleRemoveRoute(route.id)}
                        aria-label="Remove route">
                        <IonIcon icon={trashOutline} />
                      </button>
                    </div>
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
              ))
            )}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default SavedRoutesPage;