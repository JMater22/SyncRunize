import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonSearchbar,
  IonButton,
  IonCard,
  IonCardContent,
  IonAlert,
  IonIcon,
} from "@ionic/react";

import '../components/Activities/Activities.css'; 
import { supabase } from "../supabaseClient";
import axios from "axios";
import { arrowDownOutline, arrowUpOutline } from "ionicons/icons";

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
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Activity; direction: 'asc' | 'desc' } | null>(null);

  const handleDeleteClick = (index: number) => {
    setActivityToDelete(index);
    setShowAlert(true);
  };

  const handleConfirmDelete = async () => {
    if (activityToDelete === null) return;

    try {
      // Get the route object to delete
      const route = filteredActivities[activityToDelete];

      // Call the backend DELETE API
      await axios.delete(`${import.meta.env.VITE_API_URL}/routes/${route.id}`);

      // Remove from local state only after successful deletion
      const updatedActivities = activityList.filter((activity) => activity.id !== route.id);
      setActivityList(updatedActivities);

    } catch (error) {
      console.error("Failed to delete route:", error);
      alert("Failed to delete activity. Please try again.");
    } finally {
      setActivityToDelete(null);
      setShowAlert(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSort = (key: keyof Activity) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
            activities_only: true // Only fetch completed routes for activities view
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

  // Filter and sort activities
  useEffect(() => {
    let filtered = [...activityList];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((activity) =>
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.distance.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Handle numeric comparisons for calories
        if (sortConfig.key === 'calories') {
          return sortConfig.direction === 'asc'
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number);
        }

        // Handle string comparisons
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredActivities(filtered);
  }, [activityList, searchQuery, sortConfig]);

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="activities-header">
          <h2>My Activities</h2>
          <div className="search-and-button">
            <IonSearchbar
              placeholder="Search by title, date, or distance"
              className="activities-searchbar"
              value={searchQuery}
              onIonInput={(e) => handleSearch(e.detail.value!)}
              debounce={300}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="activities-summary">
          <h3>
            Total Activities: <span className="activity-count">{filteredActivities.length} of {activityList.length}</span>
          </h3>
        </div>

        {/* Desktop Table View - Hidden on Mobile */}
                <div className="desktop-only">
          <div className="table-container">
            <table className="activities-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('date')} className="sortable-header">
                    <span>Date</span>
                    {sortConfig?.key === 'date' && (
                      <IonIcon
                        className="sort-icon"
                        icon={sortConfig.direction === 'asc' ? arrowUpOutline : arrowDownOutline}
                      />
                    )}
                  </th>
                  <th onClick={() => handleSort('title')} className="sortable-header">
                    <span>Title</span>
                    {sortConfig?.key === 'title' && (
                      <IonIcon
                        className="sort-icon"
                        icon={sortConfig.direction === 'asc' ? arrowUpOutline : arrowDownOutline}
                      />
                    )}
                  </th>
                  <th onClick={() => handleSort('distance')} className="sortable-header">
                    <span>Distance</span>
                    {sortConfig?.key === 'distance' && (
                      <IonIcon
                        className="sort-icon"
                        icon={sortConfig.direction === 'asc' ? arrowUpOutline : arrowDownOutline}
                      />
                    )}
                  </th>
                  <th onClick={() => handleSort('time')} className="sortable-header">
                    <span>Time</span>
                    {sortConfig?.key === 'time' && (
                      <IonIcon
                        className="sort-icon"
                        icon={sortConfig.direction === 'asc' ? arrowUpOutline : arrowDownOutline}
                      />
                    )}
                  </th>
                  <th onClick={() => handleSort('pace')} className="sortable-header">
                    <span>Pace</span>
                    {sortConfig?.key === 'pace' && (
                      <IonIcon
                        className="sort-icon"
                        icon={sortConfig.direction === 'asc' ? arrowUpOutline : arrowDownOutline}
                      />
                    )}
                  </th>
                  <th onClick={() => handleSort('calories')} className="sortable-header">
                    <span>Calories</span>
                    {sortConfig?.key === 'calories' && (
                      <IonIcon
                        className="sort-icon"
                        icon={sortConfig.direction === 'asc' ? arrowUpOutline : arrowDownOutline}
                      />
                    )}
                  </th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity, index) => (
                  <tr key={activity.id}>
                    <td>{activity.date}</td>
                    <td>{activity.title}</td>
                    <td>{activity.distance}</td>
                    <td>{activity.time}</td>
                    <td>{activity.pace}</td>
                    <td>{activity.calories} kcal</td>
                    <td className="actions-cell">
                      <IonButton
                        fill="clear"
                        color="danger"
                        size="small"
                        className="delete-button"
                        onClick={() => handleDeleteClick(index)}
                      >
                        Delete
                      </IonButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="activities-cards mobile-only">
          {filteredActivities.map((activity, index) => (
            <IonCard key={activity.id} className="activity-card">
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
                    color="danger"
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



