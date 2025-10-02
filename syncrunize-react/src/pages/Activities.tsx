import React from "react";
import {
  IonPage,
  IonContent,
  IonSearchbar,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
} from "@ionic/react";

import '../components/Activities/Activities.css'; 

const Activities: React.FC = () => {
  const activities = [
    { date: "Fri, 4/4/2025", title: "Afternoon Run", distance: "4.11 km", time: "49:14" },
    { date: "Sat, 4/5/2025", title: "Morning Run", distance: "13.11 km", time: "1:49:14" },
    { date: "Tues, 4/1/2025", title: "Evening Run", distance: "2.11 km", time: "9:54" },
    { date: "Mon, 3/31/2025", title: "5K Run", distance: "5.12 km", time: "29:23" },
    { date: "Sun, 3/30/2025", title: "Recovery Run", distance: "3.25 km", time: "22:45" },
    { date: "Fri, 3/28/2025", title: "Tempo Run", distance: "8.50 km", time: "42:30" },
    { date: "Wed, 3/26/2025", title: "Hill Training", distance: "6.75 km", time: "38:15" },
    { date: "Mon, 3/24/2025", title: "Long Run", distance: "15.00 km", time: "1:32:20" },
  ];

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="activities-header">
          <h2>My Activities</h2> 
          <div className="search-and-button">
            <IonSearchbar 
              placeholder="Search for keywords" 
              className="activities-searchbar" 
            />
            <IonButton
              routerLink="/recently-deleted"
              className="recently-deleted-btn">
              Recently Deleted
            </IonButton>
          </div>
        </div>

        {/* Summary */}
        <div className="activities-summary">
          <h3>
            Total Activities: <span className="activity-count">8 Activities</span>
          </h3>
        </div>

        {/* Desktop Table View - Hidden on Mobile */}
        <div className="desktop-only">
          <IonGrid className="activities-table">
          <IonRow>
            <IonCol>Date</IonCol>
            <IonCol>Title</IonCol>
            <IonCol>Distance</IonCol>
            <IonCol>Time</IonCol>
            <IonCol>Actions</IonCol>
          </IonRow>

          {activities.map((activity, index) => (
            <IonRow key={index}>
              <IonCol>{activity.date}</IonCol>
              <IonCol>{activity.title}</IonCol>
              <IonCol>{activity.distance}</IonCol>
              <IonCol>{activity.time}</IonCol>
              <IonCol>
                <IonButton fill="clear" size="small">Edit</IonButton>
                <IonButton fill="clear" size="small">Delete</IonButton>
              </IonCol>
            </IonRow>
          ))}
                  </IonGrid>
        </div>

        {/* Mobile Card View */}
        <div className="activities-cards mobile-only">
          {activities.map((activity, index) => (
            <IonCard key={index} className="activity-card">
              <IonCardContent>
                <div className="card-header">
                  <h3 className="activity-title">{activity.title}</h3>
                  <span className="activity-date">{activity.date}</span>
                </div>
                <div className="card-stats">
                  <div className="stat-item">
                    <span className="stat-label">Distance</span>
                    <span className="stat-value">{activity.distance}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Time</span>
                    <span className="stat-value">{activity.time}</span>
                  </div>
                </div>
                <div className="card-actions">
                  <IonButton fill="outline" size="small">Edit</IonButton>
                  <IonButton fill="outline" size="small" color="danger">Delete</IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Activities;