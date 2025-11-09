import React, { useState, useEffect, useRef } from "react";
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonAlert,
  IonModal,
  IonButton,
} from "@ionic/react";
import { arrowBack, navigateCircleOutline, locationOutline } from "ionicons/icons";
import { Geolocation } from "@capacitor/geolocation";
import { useHideTabBar } from "../hooks/useHideTabBar";
import { useHistory } from "react-router-dom";
import "../theme/Run-Main.css";

interface Position {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  speed?: number | null;
}

declare global {
  interface Window {
    __gmapsPromise?: Promise<void>;
    __gmapsModules?: {
      mapsLib?: any;
      markerLib?: any;
    };
  }
}

const googleMapDefaultCenter = { lat: 15.4755, lng: 120.5963 };

const ensureGoogleMapsLoaded = (apiKey: string) => {
  const win = window as any;
  if (win.__gmapsPromise) return win.__gmapsPromise;

  win.__gmapsPromise = new Promise<void>((resolve, reject) => {
    const finishLoad = async () => {
      try {
        if (win.google?.maps?.importLibrary) {
          const [mapsLib, markerLib] = await Promise.all([
            win.google.maps.importLibrary("maps"),
            win.google.maps.importLibrary("marker"),
          ]);
          win.__gmapsModules = { mapsLib, markerLib };
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    if (win.google?.maps) {
      finishLoad();
      return;
    }

    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]') as HTMLScriptElement | null;
    if (existing) {
      if (win.google?.maps) {
        finishLoad();
      } else {
        existing.addEventListener("load", finishLoad, { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps")), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&loading=async&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = finishLoad;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return win.__gmapsPromise;
};

const RunMap: React.FC = () => {
  useHideTabBar();
  const history = useHistory();

  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning" | "primary">("danger");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);
  const [showInitialPrompt, setShowInitialPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>("prompt");
  const [trackingState, setTrackingState] = useState<'idle' | 'running' | 'paused'>('idle');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const [mapsModule, setMapsModule] = useState<{ mapsLib?: any; markerLib?: any }>({});
  const [mapError, setMapError] = useState<string | null>(null);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const mapInitAttemptsRef = useRef(0);

  useEffect(() => {
    checkInitialPermissions();
  }, []);

  useEffect(() => {
    if (!googleMapsApiKey) {
      setMapError("Google Maps API key is missing");
      return;
    }

    ensureGoogleMapsLoaded(googleMapsApiKey)
      .then(() => {
        const win = window as any;
        setMapsModule(win.__gmapsModules || {});
      })
      .catch(() => setMapError("Unable to load the map"));
  }, [googleMapsApiKey]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const win = window as any;
    const MapConstructor =
      mapsModule.mapsLib?.Map || win.google?.maps?.Map;

    if (!MapConstructor) {
      if (mapInitAttemptsRef.current < 10) {
        mapInitAttemptsRef.current += 1;
        setTimeout(() => {
          setMapsModule({ ...mapsModule });
        }, 150);
      } else {
        console.warn("Google Maps Map constructor not available yet.");
      }
      return;
    }

    const initialCenter = currentPosition
      ? { lat: currentPosition.latitude, lng: currentPosition.longitude }
      : googleMapDefaultCenter;

    try {
    mapInstanceRef.current = new MapConstructor(mapContainerRef.current, {
      center: initialCenter,
      mapTypeId: "roadmap",
      disableDefaultUI: true,
      zoom: 15,
      styles: [],
    });
    } catch (e) {
      console.error("Failed to init Google Map:", e);
    }
  }, [mapsModule, currentPosition]);

  useEffect(() => {
    if (!mapInstanceRef.current || !currentPosition) return;
    const win = window as any;
    const position = { lat: currentPosition.latitude, lng: currentPosition.longitude };
    mapInstanceRef.current.panTo(position);

    const advancedCtor =
      mapsModule.markerLib?.AdvancedMarkerElement ||
      win.google?.maps?.marker?.AdvancedMarkerElement;
    const legacyCtor =
      mapsModule.mapsLib?.Marker || win.google?.maps?.Marker;

    if (!markerRef.current) {
      if (advancedCtor) {
        markerRef.current = new advancedCtor({
          map: mapInstanceRef.current,
          position,
        });
      } else if (legacyCtor) {
        markerRef.current = new legacyCtor({
          map: mapInstanceRef.current,
          position,
          icon: {
            path: win.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#92C628",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
      } else {
        console.warn("Google Maps marker constructors not available yet.");
      }
    } else {
      if ("position" in (markerRef.current as any)) {
        (markerRef.current as any).position = position;
      } else if (markerRef.current.setPosition) {
        markerRef.current.setPosition(position);
      }
    }
  }, [currentPosition, mapsModule]);

  const checkInitialPermissions = async () => {
    try {
      const permission = await Geolocation.checkPermissions();
      setPermissionStatus(permission.location);

      if (permission.location === "granted") {
        await getCurrentPosition();
      } else if (permission.location === "denied") {
        setShowPermissionAlert(true);
      } else {
        setShowInitialPrompt(true);
      }
    } catch (err) {
      console.error("Error checking permissions:", err);
      setShowInitialPrompt(true);
    }
  };

  const requestLocationAccess = async () => {
    setShowInitialPrompt(false);
    setLoading(true);

    try {
      const { location } = await Geolocation.requestPermissions();
      setPermissionStatus(location);

      if (location === "granted") {
        await getCurrentPosition();
        setToastColor("success");
        setShowToast(true);
      } else if (location === "denied") {
        setLocationEnabled(false);
        setShowPermissionAlert(true);
      }
    } catch (err) {
      console.error("Permission request error:", err);
      setError("Failed to request location permission.");
      setToastMessage("Failed to request location permission.");
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPosition = async () => {
    setLoading(true);
    setError("");

    try {
      const permission = await Geolocation.checkPermissions();

      if (permission.location !== "granted") {
        setShowPermissionAlert(true);
        setLoading(false);
        setLocationEnabled(false);
        return;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      });

      setCurrentPosition({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        speed: position.coords.speed,
      });

      setLocationEnabled(true);
      console.log("Current position:", position.coords);
    } catch (err: any) {
      console.error("Error getting location:", err);

      let errorMessage = "Failed to get location";
      if (err.message?.includes("location unavailable")) {
        errorMessage = "Location unavailable. Please enable GPS.";
      } else if (err.message?.includes("timeout")) {
        errorMessage = "Location request timed out. Try again.";
      } else if (err.message?.includes("permission")) {
        errorMessage = "Location permission denied.";
        setShowPermissionAlert(true);
      }

      setError(errorMessage);
      setToastMessage(errorMessage);
      setToastColor("danger");
      setShowToast(true);
      setLocationEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTracking = () => {
    if (trackingState === "running") {
      setTrackingState("paused");
    } else {
      setTrackingState("running");
    }
  };

  const handleStopRun = () => {
    if (trackingState !== "running") return;
    setTrackingState("paused");
    history.push("/paused");
  };

  const runStateLabel =
    trackingState === "running"
      ? "Tracking live"
      : trackingState === "paused"
        ? "Paused"
        : "Ready to run";

  const gpsStatusText = loading
    ? "Acquiring GPS..."
    : locationEnabled
      ? "GPS Online - Ready to run"
      : "Location disabled";

  const startButtonLabel =
    trackingState === "running"
      ? "Pause"
      : trackingState === "paused"
        ? "Resume"
        : "Run";

  return (
    <IonPage>
      <IonContent fullscreen className="run-map-content">
        <div className="map-container">
          <button
            onClick={() => history.push("/routes")}
            className="custom-back-button-icon"
          >
            <IonIcon icon={arrowBack} className="back-icon" />
          </button>

          <div ref={mapContainerRef} className="map-iframe" />
          {mapError && (
            <p className="mini-note" style={{ position: "absolute", left: 16, bottom: 200 }}>
              {mapError}
            </p>
          )}

          <button
            onClick={getCurrentPosition}
            disabled={loading}
            className="gps-button"
          >
            {loading ? (
              <IonSpinner name="crescent" className="gps-spinner" />
            ) : (
              <IonIcon
                icon={navigateCircleOutline}
                className={`gps-icon ${locationEnabled ? "gps-enabled" : ""}`}
              />
            )}
          </button>

          <div className="stats-panel">
            <div className="tracking-overlay">
              <div className="tracking-status">
                <div className="tracking-status-info">
                  <span className="status-label">GPS status</span>
                  <h3 className="status-value">{gpsStatusText}</h3>
                  <p className="status-subtext">{runStateLabel}</p>
                </div>
                <div className="tracking-status-actions">
                  <button
                    className="ghost-button"
                    onClick={getCurrentPosition}
                    disabled={loading}
                  >
                    <IonIcon icon={navigateCircleOutline} />
                    Recenter
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span className="card-label">Elapsed</span>
                  <strong className="card-value">00:00</strong>
                </div>
                <div className="stat-card">
                  <span className="card-label">Pace</span>
                  <strong className="card-value">--:-- /km</strong>
                </div>
                <div className="stat-card">
                  <span className="card-label">Distance</span>
                  <strong className="card-value">0.0 km</strong>
                </div>
              </div>

              <div className="action-row">
                <button
                  className="ghost-button ghost-secondary"
                  onClick={handleStopRun}
                  disabled={trackingState !== "running"}
                >
                  Stop
                </button>
                <button
                  className={`start-btn ${trackingState === "running" ? "running" : ""}`}
                  onClick={handleToggleTracking}
                >
                  {startButtonLabel}
                </button>
              </div>

              {!locationEnabled && !loading && (
                <p className="mini-note">
                  Enable your device location to begin recording. Grant access above if prompted.
                </p>
              )}
            </div>
          </div>
        </div>

        <IonModal isOpen={showInitialPrompt} backdropDismiss={false}>
          <div
            style={{
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              textAlign: "center",
            }}
          >
            <IonIcon
              icon={locationOutline}
              style={{
                fontSize: "80px",
                color: "#4285f4",
                marginBottom: "24px",
              }}
            />
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "12px",
              }}
            >
              Allow Location Access
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "#666",
                marginBottom: "32px",
                lineHeight: "1.5",
              }}
            >
              RunTracker needs access to your location to track your runs, calculate distance, and provide accurate pace information.
            </p>
            <IonButton
              expand="block"
              onClick={requestLocationAccess}
              style={{ marginBottom: "12px", width: "100%" }}
            >
              Allow Location Access
            </IonButton>
            <IonButton
              expand="block"
              fill="clear"
              onClick={() => {
                setShowInitialPrompt(false);
                window.history.back();
              }}
            >
              Not Now
            </IonButton>
          </div>
        </IonModal>

        <IonAlert
          isOpen={showPermissionAlert}
          onDidDismiss={() => setShowPermissionAlert(false)}
          header="Location Permission Required"
          message="This app needs location permission to track your run. Please enable it in your device settings."
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => window.history.back(),
            },
            {
              text: "Open Settings",
              handler: () => {
                alert("Please enable location in your device settings");
              },
            },
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default RunMap;


