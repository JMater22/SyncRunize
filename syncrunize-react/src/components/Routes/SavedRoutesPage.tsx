import React, { useState, useEffect } from "react";
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
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import { trashOutline } from "ionicons/icons";
import "./SavedRoutesPage.css";
import CustomCard from "./CustomCard";
import { useHistory } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import axios from "axios";

interface SavedRoute {
  route_id: number;
  saved_at: string;
  user_routes: {
    route_id: number;
    route_name: string;
    distance_km: number;
    snapshot_url: string;
    created_at: string;
  };
}

const SavedRoutesPage: React.FC = () => {
  const history = useHistory();
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<boolean>(true);

  // ✅ Fetch saved routes using Axios
  const fetchSavedRoutes = async () => {
    try {
      setLoading(true);
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const token = sessionData?.session?.access_token;
      if (!token) {
        console.error("⚠️ No session token found");
        setSavedRoutes([]);
        return;
      }

      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/saved-routes/my-saved`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSavedRoutes(data || []);
    } catch (error: any) {
      console.error(
        "❌ Error fetching saved routes:",
        error.response?.data || error.message
      );
      setSavedRoutes([]);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      fetchSavedRoutes(); // initial fetch

      // Auto-refetch every 10 seconds
      const interval = setInterval(fetchSavedRoutes, 10000);

      // cleanup when leaving page
      return () => clearInterval(interval);
    }, []);

  // ✅ Unsave route handler (Axios DELETE with route_id header)
  const handleRemoveRoute = async (routeId: number) => {
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const token = sessionData?.session?.access_token;
      if (!token) {
        console.error("⚠️ No user session found");
        return;
      }

      const { data } = await axios.delete(
        `${import.meta.env.VITE_API_URL}/saved-routes/unsave`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { route_id: routeId },
        }
      );

      console.log("✅ Route unsaved successfully:", data);

      // Update UI after deletion
      setSavedRoutes((prev) =>
        prev.filter((r) => r.route_id !== routeId)
      );
    } catch (error: any) {
      console.error(
        "❌ Error unsaving route:",
        error.response?.data || error.message
      );
    }
  };

  const handleBack = () => history.push("/routes");

  // ✅ Search filter
  const filteredRoutes = savedRoutes.filter((r) =>
    r.user_routes.route_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <IonPage>
      <IonContent>
        {/* Header */}
        <IonRow className="routes-header ion-align-items-center">
          <IonCol size="12">
            <IonButton className="back-btn" onClick={handleBack}>
              Back
            </IonButton>
            <h1 className="my-routes-title">Saved Routes</h1>
          </IonCol>
        </IonRow>

        {/* Searchbar */}
        <IonRow className="ion-align-items-center ion-justify-content-between">
          <IonCol className="searchbar-container">
            <IonSearchbar
              placeholder="Search saved routes"
              className="custom-searchbar"
              value={search}
              onIonChange={(e) => setSearch(e.detail.value!)}
            />
          </IonCol>
        </IonRow>

        {/* Routes */}
        <IonGrid className="routes-container">
          <IonRow>
            {loading ? (
              <IonCol size="12" className="ion-text-center">
                <IonSpinner name="crescent" />
                <p>Loading saved routes...</p>
              </IonCol>
            ) : filteredRoutes.length === 0 ? (
              <IonCol size="12" className="ion-text-center">
                <p
                  style={{
                    fontSize: "18px",
                    color: "#666",
                    marginTop: "40px",
                  }}
                >
                  No saved routes yet
                </p>
              </IonCol>
            ) : (
              filteredRoutes.map((route) => (
                <IonCol key={route.route_id} size="12" sizeMd="6" sizeLg="3">
                  <CustomCard className="saved-route-card">
                    <div className="card-image-wrapper">
                      <IonImg
                        src={
                          route.user_routes.snapshot_url ||
                          "/placeholder-map.png"
                        }
                        alt={`Map of ${route.user_routes.route_name}`}
                      />
                      <button
                        className="remove-icon-btn"
                        onClick={() => handleRemoveRoute(route.route_id)}
                        aria-label="Remove route"
                      >
                        <IonIcon icon={trashOutline} />
                      </button>
                    </div>
                    <IonCardHeader>
                      <IonCardTitle>
                        {route.user_routes.route_name || "Unnamed Route"}
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p>
                        <strong>
                          {route.user_routes.distance_km?.toFixed(2) ?? "N/A"}{" "}
                          km
                        </strong>{" "}
                        Distance
                      </p>
                      <p>
                        Saved on{" "}
                        {new Date(route.saved_at).toLocaleDateString()}
                      </p>
                      <p>
                        Created on{" "}
                        {new Date(
                          route.user_routes.created_at
                        ).toLocaleDateString()}
                      </p>
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
