import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonImg
} from "@ionic/react";
import { useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { RoutesApi, Route } from "../services/routes";
import { formatDate, formatDurationShort } from "../lib/utils";
import "./View-Activity.css";

// Fallback image for routes without map images
import MapImage from '../components/assets/istockphoto-143920084-612x612.jpg';

interface LocationState {
  userId?: number;
  userName?: string;
}

const ViewActivity: React.FC = () => {
  const { currentUser } = useUser();
  const location = useLocation<LocationState>();
  const [userRoutes, setUserRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Determine which user's activities to fetch
  const userId = location.state?.userId || currentUser?.user_id;
  const userName = location.state?.userName;
  const isViewingOtherUser = !!location.state?.userId;

  // Fetch user routes when component mounts
  useEffect(() => {
    const fetchUserRoutes = async () => {
      if (!userId) return;

      try {
        setLoadingRoutes(true);

        // Fetch routes with activities_only flag to get completed routes
        const routes = await RoutesApi.getUserRoutes(userId, true);
        setUserRoutes(Array.isArray(routes) ? routes : []);
      } catch (error) {
        console.error("Error fetching user routes:", error);
        setUserRoutes([]);
      } finally {
        setLoadingRoutes(false);
      }
    };

    fetchUserRoutes();
  }, [userId]);

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={isViewingOtherUser ? "/other-profile" : "/home"} />
          </IonButtons>
          <IonTitle>{isViewingOtherUser && userName ? `${userName}'s Activities` : "Activities"}</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Content */}
      <IonContent fullscreen className="ion-padding">
        {loadingRoutes ? (
          <div className="loading-center">
            <IonSpinner name="crescent" />
            <p>Loading activities...</p>
          </div>
        ) : userRoutes.length === 0 ? (
          <div className="loading-center">
            <p>No activities yet. Start running to see your progress here!</p>
          </div>
        ) : (
          <div className="activities-list">
            {userRoutes.map((route, index) => (
              <IonCard key={route.route_id || index} className="activity-card-modern">
                <IonCardContent>
                  {/* Top Section - Meta Info */}
                  <div className="activity-top">
                    <div className="activity-meta">
                      <span className="activity-type">
                        {route.route_type?.charAt(0).toUpperCase() + route.route_type?.slice(1) || "Run"}
                      </span>
                      <span className="activity-date">{formatDate(route.created_at)}</span>
                    </div>

                    <h3 className="activity-title">
                      {route.route_name || "Untitled Route"}
                    </h3>
                  </div>

                  {/* Stats Row - 2x2 Grid */}
                  <div className="activity-stats-row">
                    <div className="activity-stat">
                      <strong>{Number(route.distance_km).toFixed(1)} km</strong>
                      <span>Distance</span>
                    </div>
                    <div className="activity-stat">
                      <strong>{formatDurationShort(route.duration_seconds)}</strong>
                      <span>Duration</span>
                    </div>
                    <div className="activity-stat">
                      <strong>{route.average_pace || "N/A"}</strong>
                      <span>Pace</span>
                    </div>
                    <div className="activity-stat">
                      <strong>{route.estimated_calories || "N/A"}</strong>
                      <span>Calories</span>
                    </div>
                  </div>

                  {/* Map Image */}
                  <div className="activity-map">
                    <IonImg
                      src={route.snapshot_url || route.map_image_url || MapImage}
                      alt="Activity Map"
                    />
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ViewActivity;
