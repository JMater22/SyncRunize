import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonSearchbar,
  IonButton,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol
} from "@ionic/react";
import '../components/Activities/RecentlyDeleted.css'; 

const RecentlyDeleted = () => {
  const [searchText, setSearchText] = useState("");
  const [isMobile, setIsMobile] = useState(false);
   
  const activities = [
    { id: 1, date: "Fri, 4/4/2025", title: "Afternoon Run", distance: "4.11 km ", time: "49:14", calories: 312 },
    { id: 2, date: "Sat, 4/5/2025", title: "Morning Run", distance: "13.11 km", time: "1:49:14", calories: 892 },
    { id: 3, date: "Tues, 4/1/2025", title: "Evening Run", distance: "2.11 km", time: "9:54", calories: 156 },
    { id: 4, date: "Mon, 3/31/2025", title: "5K Run", distance: "5.12 km", time: "29:23", calories: 387 },
    { id: 5, date: "Fri, 4/4/2025", title: "Afternoon Run", distance: "4.11 km", time: "49:14", calories: 312 },
    { id: 6, date: "Sat, 4/5/2025", title: "Morning Run", distance: "13.11 km", time: "1:49:14", calories: 892 },
    { id: 7, date: "Tues, 4/1/2025", title: "Evening Run", distance: "2.11 km", time: "9:54", calories: 156 },
    { id: 8, date: "Mon, 3/31/2025", title: "5K Run", distance: "5.12 km", time: "29:23", calories: 387 }
  ];

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchText.toLowerCase()) ||
    activity.date.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleRestore = (id: number) => {
    console.log(`Restoring activity ${id}`);
  };

  const handleDelete = (id: number) => {
    console.log(`Permanently deleting activity ${id}`);
  };

  // Desktop Table View
  const renderTableView = () => (
    <div className="desktop-only">
      <IonGrid className="activities-table">
        <IonRow>
          <IonCol size="2">Date</IonCol>
          <IonCol size="2.5">Activity</IonCol>
          <IonCol size="1.5">Distance</IonCol>
          <IonCol size="1.5">Time</IonCol>
          <IonCol size="1.5">Calories</IonCol>
          <IonCol size="3">Actions</IonCol>
        </IonRow>
        {filteredActivities.map((activity) => (
          <IonRow key={activity.id}>
            <IonCol size="2">{activity.date}</IonCol>
            <IonCol size="2.5">{activity.title}</IonCol>
            <IonCol size="1.5">{activity.distance}</IonCol>
            <IonCol size="1.5">{activity.time}</IonCol>
            <IonCol size="1.5">{activity.calories} kcal</IonCol>
            <IonCol size="3">
              <IonButton 
                fill="clear" 
                size="small"
                onClick={() => handleRestore(activity.id)}
                className="restore-btn"
              >
                Restore
              </IonButton>
              <IonButton 
                fill="clear" 
                size="small"
                onClick={() => handleDelete(activity.id)}
                className="delete-btn"
              >
                Delete Permanently
              </IonButton>
            </IonCol>
          </IonRow>
        ))}
      </IonGrid>
    </div>
  );

  // Mobile Card View
  const renderCardView = () => (
    <div className="mobile-only">
      <div className="cards-container">
        {filteredActivities.map((activity) => (
          <IonCard key={activity.id} className="activity-card">
            <IonCardContent>
              <div className="card-header">
                <h2 className="activity-title">{activity.title}</h2>
                <span className="activity-date">{activity.date}</span>
              </div>
              
              <div className="activity-stats">
                <div className="stat-item">
                  <span className="stat-label">DISTANCE</span>
                  <span className="stat-value">{activity.distance}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">TIME</span>
                  <span className="stat-value">{activity.time}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">CALORIES</span>
                  <span className="stat-value">{activity.calories} kcal</span>
                </div>
              </div>

              <div className="card-actions">
                <IonButton 
                  fill="outline" 
                  size="small"
                  onClick={() => handleRestore(activity.id)}
                  className="restore-btn"
                >
                  Restore
                </IonButton>
                <IonButton 
                  fill="outline" 
                  color="danger" 
                  size="small"
                  onClick={() => handleDelete(activity.id)}
                  className="delete-btn"
                >
                  Delete Permanently
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        ))}
      </div>
    </div>
  );

  return (
    <IonPage>
      <IonContent className={`recently-deleted-content ${!isMobile ? 'ion-padding' : ''}`}>
        {/* Header Section */}
        <div className="deleted-header">
          <h2>Recently Deleted</h2>
          <div className="search-and-link">
            <IonSearchbar 
              value={searchText}
              onIonInput={(e) => setSearchText(e.detail.value!)}
              placeholder="Search for keywords" 
              className="RecentlyDeleted-searchbar"
            />
            <IonButton
              routerLink="/activities"
              className="go-back-link"
              fill="solid"
            >
              Go Back
            </IonButton>
          </div>
        </div>


        {/* Summary Section */}
        <div className="activity-count">
          <p className="activity-count-text">
            Total <span>Activities</span>: <span className="count-number">{filteredActivities.length}</span> <span className="bold-text">Activities</span>
          </p>
        </div>

        {/* Responsive Content */}
        {renderTableView()}
        {renderCardView()}

        {filteredActivities.length === 0 && (
          <div className="no-results">
            <p>No activities found matching your search.</p>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default RecentlyDeleted;