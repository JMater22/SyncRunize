import React, { useState } from "react";
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
  IonAlert,
} from "@ionic/react";

import '../components/Activities/Activities.css'; 

const Activities: React.FC = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<number | null>(null);
  const [activityList, setActivityList] = useState([
    { date: "Fri, 4/4/2025", title: "Afternoon Run", distance: "4.11 km", pace: "11:58", time: "49:14", calories: 312 },
    { date: "Sat, 4/5/2025", title: "Morning Run", distance: "13.11 km", pace: "8:20", time: "1:49:14", calories: 892 },
    { date: "Tues, 4/1/2025", title: "Evening Run", distance: "2.11 km", pace: "4:42", time: "9:54", calories: 156 },
    { date: "Mon, 3/31/2025", title: "5K Run", distance: "5.12 km", pace: "5:44", time: "29:23", calories: 387 },
    { date: "Sun, 3/30/2025", title: "Recovery Run", distance: "3.25 km", pace: "7:00", time: "22:45", calories: 245 },
    { date: "Fri, 3/28/2025", title: "Tempo Run", distance: "8.50 km", pace: "5:00", time: "42:30", calories: 612 },
    { date: "Wed, 3/26/2025", title: "Hill Training", distance: "6.75 km", pace: "5:40", time: "38:15", calories: 521 },
    { date: "Mon, 3/24/2025", title: "Long Run", distance: "15.00 km", pace: "6:09", time: "1:32:20", calories: 1043 },
  ]);

  const handleDeleteClick = (index: number) => {
    setActivityToDelete(index);
    setShowAlert(true);
  };

  const handleConfirmDelete = () => {
    if (activityToDelete !== null) {
      // Remove the activity from the list
      const updatedActivities = activityList.filter((_, index) => index !== activityToDelete);
      setActivityList(updatedActivities);
      setActivityToDelete(null);
    }
  };

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
            Total Activities: <span className="activity-count">{activityList.length} Activities</span>
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
              <IonCol>Pace</IonCol>
              <IonCol>Calories</IonCol>
              <IonCol>Actions</IonCol>
            </IonRow>

            {activityList.map((activity, index) => (
              <IonRow key={index}>
                <IonCol>{activity.date}</IonCol>
                <IonCol>{activity.title}</IonCol>
                <IonCol>{activity.distance}</IonCol>
                <IonCol>{activity.time}</IonCol>
                <IonCol>{activity.pace}</IonCol>
                <IonCol>{activity.calories} kcal</IonCol>
                <IonCol>
                  <IonButton 
                    fill="clear" 
                    color="danger" 
                    size="small"
                    className="delete-button"
                    onClick={() => handleDeleteClick(index)}
                  >
                    Delete
                  </IonButton>

                </IonCol>
              </IonRow>
            ))}
          </IonGrid>
        </div>

        {/* Mobile Card View */}
        <div className="activities-cards mobile-only">
          {activityList.map((activity, index) => (
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
                  <div className="stat-item">
                    <span className="stat-label">Pace</span>
                    <span className="stat-value">{activity.pace}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Calories</span>
                    <span className="stat-value">{activity.calories} kcal</span>
                  </div>
                </div>
                <div className="delete-actions">
                  <IonButton
                    onClick={() => handleDeleteClick(index)}
                  >
                    Delete
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </div>

        {/* Delete Confirmation Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          cssClass="delete-confirmation-alert"
          header="Delete Activity"
          message="Are you sure you want to delete this activity?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'alert-cancel-button',
              handler: () => {
                setActivityToDelete(null);
              }
            },
            {
              text: 'Delete',
              role: 'destructive',
              cssClass: 'alert-delete-button',
              handler: handleConfirmDelete
            }
          ]}
        />
      </IonContent>
    </IonPage>
  ); 
};

export default Activities;