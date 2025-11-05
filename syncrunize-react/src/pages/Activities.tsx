import React, { useState, useEffect } from "react";
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
import { supabase } from "../supabaseClient";
import axios from "axios";

 interface Activity {
  id: number;
  date: string;
  title: string;
  distance: string;
  pace: string;
  time: string;
  calories: number;
}

const Activities: React.FC = () => {
 
  const [userRoutes, setUserRoutes] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<number | null>(null);
  const [activityList, setActivityList] = useState<Activity[]>([]);

  const handleDeleteClick = (index: number) => {
    setActivityToDelete(index);
    setShowAlert(true);
  };

  const handleConfirmDelete = async () => {
    if (activityToDelete === null) return;

    try {
      // Get the route object to delete
      const route = activityList[activityToDelete];

      // Call the backend DELETE API
      await axios.delete(`${import.meta.env.VITE_API_URL}/routes/${route.id}`);

      // Remove from local state only after successful deletion
      const updatedActivities = activityList.filter((_, index) => index !== activityToDelete);
      setActivityList(updatedActivities);

    } catch (error) {
      console.error("Failed to delete route:", error);
      alert("Failed to delete activity. Please try again.");
    } finally {
      setActivityToDelete(null);
      setShowAlert(false);
    }
  };
  useEffect(() => {
    const fetchUserRoutes = async () => {
      try {
        // 1. Get Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) return;

        const token = session.access_token;

        // 2. Get current user info
        const { data: user } = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userId = user.user_id;
        setCurrentUserId(userId);

        // 3. Fetch user routes (only completed activities)
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/routes/user/${userId}`, {
          params: {
            limit: 20,
            offset: 0,
            activities_only: true // ✅ NEW: Only fetch completed routes for activities view
          }
        });

        const routes = Array.isArray(response.data) ? response.data : [];

        setUserRoutes(routes);

        // 4. Map API data to activityList shape
        const mappedActivities: Activity[] = routes.map((route: any) => ({
          id: route.route_id,
          date: new Date(route.created_at).toDateString(),
          title: route.route_name,
          distance: `${route.distance_km.toFixed(2)} km`,
          pace: route.average_pace,
          time: route.duration_seconds,
          calories: route.estimated_calories
        }));

        setActivityList(mappedActivities);

       
      } catch (error) {
        console.error("Error fetching user routes:", error);
      }
    };

    fetchUserRoutes();
  }, []);

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