import React, { useEffect, useState } from "react";
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
  IonSpinner,
  IonModal,
  IonIcon,
} from "@ionic/react";
import "../components/Routes/RoutesPage.css";
import CustomCard from "../components/Routes/CustomCard";
import { useHistory } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { close } from "ionicons/icons";

const RoutesPage: React.FC = () => {
  const history = useHistory(); 
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const minsTotal = Math.floor(seconds / 60);
    const hours = Math.floor(minsTotal / 60);
    const minutes = minsTotal % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatPace = (route: any) => {
    if (!route?.duration_seconds || !route?.distance_km) return "N/A";
    const pace = route.duration_seconds / 60 / route.distance_km;
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds} /km`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleCloseModal = () => setSelectedRoute(null);

  const handleCreateRoute = () => history.push("/create-route");
  const handleSavedRoutes = () => history.push("/saved-routes");

  // ✅ Fetch un-saved public routes
  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const session = sessionData?.session;
      if (!session) {
        console.error("⚠️ No user session found");
        setRoutes([]);
        return;
      }

      const token = session.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/unsaved/public`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        console.error("❌ Failed to fetch routes:", data);
        setRoutes([]);
        return;
      }

      setRoutes(data.routes || []);
    } catch (error) {
      console.error("⚠️ Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // ✅ Save route handler
  const handleSaveRoute = async () => {
    if (!selectedRoute) return;
    try {
      setSaving(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/saved-routes/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            route_id: selectedRoute.route_id, // ✅ send here
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        console.error("❌ Error saving route:", data);
        return;
      }

      // ✅ Refresh list and close modal
      await fetchRoutes();
      setSelectedRoute(null);
    } catch (error) {
      console.error("⚠️ Error saving route:", error);
    } finally {
      setSaving(false);
    }
  };

  // 🔍 Filter routes by search input
  const filteredRoutes = routes.filter((route) =>
    route.route_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <IonPage>
      <IonContent scrollY={true}>
        {/* Header Title */}
      <IonRow className="routes-header ion-align-items-center">
        <IonCol size="12">
          <h1 className="my-routes-title">Public Routes</h1> 
        </IonCol>
      </IonRow>

      {/* Search and Buttons */}
      <IonRow className="search-and-buttons-row ion-align-items-center ion-justify-content-between">
        <IonCol size="12" sizeMd="8" className="searchbar-container">
          <IonSearchbar
            className="custom-searchbar"
            value={search}
            onIonChange={(e) => setSearch(e.detail.value!)}
            placeholder="Search routes..."
          />
        </IonCol>

        <IonCol size="12" sizeMd="4" className="button-col ion-text-right">
          <IonButton expand="block" onClick={handleSavedRoutes} className="save-routes-btn">
            Saved Routes
          </IonButton>
          <IonButton 
            expand="block" 
            onClick={handleCreateRoute} 
            className="create-route-btn"
          >
            <div>
              Create<br/>New Route
            </div>
          </IonButton>
        </IonCol>
      </IonRow>

        {/* Routes Grid */}
        <IonGrid className="routes-container">
          <IonRow>
            {loading ? (
              <IonCol size="12" className="ion-text-center">
                <IonSpinner name="crescent" />
                <p>Loading routes...</p>
              </IonCol>
            ) : filteredRoutes.length === 0 ? (
              <IonCol size="12" className="ion-text-center">
                <p>No public routes found.</p>
              </IonCol>
            ) : (
              filteredRoutes.map((route, index) => (
                <IonCol
                  key={index}
                  size="12"
                  sizeMd="6"
                  sizeLg="3"
                  className="cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => setSelectedRoute(route)}
                >
                  <CustomCard>
                    <IonImg
                      src={route.snapshot_url || "/placeholder-map.png"}
                      alt={`Map snapshot of ${route.route_name || "Unnamed Route"}`}
                      className="rounded-xl"
                    />
                    <IonCardHeader>
                      <IonCardTitle>
                        {route.route_name || "Unnamed Route"}
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p>
                        <strong>
                          {route.distance_km
                            ? route.distance_km.toFixed(2)
                            : "N/A"}{" "}
                          km
                        </strong>{" "}
                        Distance
                      </p>
                      <p>
                        Est. Time:{" "}
                        <strong>
                          {route.duration_seconds
                            ? `${Math.floor(route.duration_seconds / 60)} min`
                            : "N/A"}
                        </strong>
                      </p>
                      <p>
                        Created on{" "}
                        {route.created_at
                          ? new Date(route.created_at).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </IonCardContent>
                  </CustomCard>
                </IonCol>
              ))
            )}
          </IonRow>
        </IonGrid>

        {/* ✅ Fullscreen Modal for Image Preview */}
        <IonModal
          isOpen={!!selectedRoute}
          onDidDismiss={handleCloseModal}
          className="route-preview-modal"
        >
          {selectedRoute && (
            <div
              className="route-modal-container"
              onClick={handleCloseModal}
            >
              <div
                className="route-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                {/* HEADER SECTION - Title + Timestamp */}
                <div className="route-preview-header">
                  <div className="route-preview-tags">
                    {selectedRoute.route_type && (
                      <span className="route-tag">
                        {selectedRoute.route_type}
                      </span>
                    )}
                    <span className="route-tag">Public</span>
                  </div>
                  <h2>{selectedRoute.route_name || "Untitled Route"}</h2>
                  <p className="route-timestamp">{formatDate(selectedRoute.created_at)}</p>
                </div>

                {/* STATS GRID - 2x2 Grid */}
                <div className="route-preview-stats">
                  <div className="route-stat-card">
                    <span>Distance</span>
                    <strong>
                      {selectedRoute.distance_km
                        ? `${selectedRoute.distance_km.toFixed(2)} km`
                        : "N/A"}
                    </strong>
                  </div>
                  <div className="route-stat-card">
                    <span>Est. Time</span>
                    <strong>{formatDuration(selectedRoute.duration_seconds)}</strong>
                  </div>
                  <div className="route-stat-card">
                    <span>Avg Pace</span>
                    <strong>{formatPace(selectedRoute)}</strong>
                  </div>
                  <div className="route-stat-card">
                    <span>Calories</span>
                    <strong>
                      {selectedRoute.estimated_calories
                        ? `${Math.round(selectedRoute.estimated_calories)} kcal`
                        : "N/A"}
                    </strong>
                  </div>
                </div>

                {/* MAP IMAGE - Bottom, no overlay */}
                <div className="route-preview-image">
                  <img
                    src={selectedRoute.snapshot_url || "/placeholder-map.png"}
                    alt={selectedRoute.route_name || "Route preview"}
                    className="route-modal-image"
                  />
                </div>

                {/* ACTION BUTTONS - Above the map */}
                <div className="route-preview-actions">
                  <IonButton
                    onClick={handleSaveRoute}
                    disabled={saving}
                    className="route-action-primary"
                    expand="block"
                  >
                    {saving ? (
                      <>
                        <IonSpinner name="crescent" slot="start" />
                        Saving…
                      </>
                    ) : (
                      "Save to My Routes"
                    )}
                  </IonButton>
                  <IonButton
                    onClick={handleCloseModal}
                    className="route-action-secondary"
                    expand="block"
                  >
                    Close
                  </IonButton>
                </div>
              </div>
            </div>
          )}
        </IonModal> 
      </IonContent>
    </IonPage>
  );
};

export default RoutesPage;
