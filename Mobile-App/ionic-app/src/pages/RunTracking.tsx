import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonAlert,
} from "@ionic/react";
import { arrowBack, navigateCircleOutline } from "ionicons/icons";
import { Geolocation } from "@capacitor/geolocation";
import { usePushNotifications } from "../components/push-notification";
import PlayCircle from "../components/assets/play_circle.svg";
import { useHideTabBar } from "../hooks/useHideTabBar";
import "../theme/global.css";
import "../theme/Run-Main.css";

interface Position {
  latitude: number;
  longitude: number;
  accuracy?: number; 
  altitude?: number | null;
  speed?: number | null;
}

const RunMap: React.FC = () => { 
  useHideTabBar();

  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning" | "primary">("danger");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);

  // Initialize push notifications
  usePushNotifications({
    onNotificationReceived: (notification) => {
      console.log('Notification received on Run Map:', notification);
      
      const notifType = notification.data?.type;
      
      if (notifType === 'milestone') {
        setToastMessage(`🎯 ${notification.title || 'Milestone Achieved!'}`);
        setToastColor("success");
      } else if (notifType === 'pace-alert') {
        setToastMessage(`⚡ ${notification.title || 'Pace Alert'}`);
        setToastColor("warning");
      } else if (notifType === 'distance') {
        setToastMessage(`📏 ${notification.title || 'Distance Update'}`);
        setToastColor("primary");
      } else if (notifType === 'safety') {
        setToastMessage(`🚨 ${notification.title || 'Safety Alert'}`);
        setToastColor("danger");
      } else {
        setToastMessage(notification.title || 'New notification');
        setToastColor("primary");
      }
      
      setShowToast(true);
    },
    onNotificationActionPerformed: (notification) => {
      console.log('Notification tapped on Run Map:', notification);
      
      const data = notification.notification.data;
      
      if (data?.type === 'milestone' || data?.type === 'distance') {
        // User can see the notification, no action needed as they're already on the run screen
        console.log('Achievement notification:', data);
      } else if (data?.type === 'pace-alert') {
        // Show pace alert
        setToastMessage("Check your pace!");
        setToastColor("warning");
        setShowToast(true);
      } else if (data?.type === 'safety') {
        // Safety notification - maybe pause or alert user
        console.log('Safety alert:', data);
      }
    }
  });

  useEffect(() => {
    const initLocation = async () => {
      try {
        setLoading(true);
        // Request permission — triggers Android popup if needed
        const { location } = await Geolocation.requestPermissions();

        if (location === "granted") {
          await getCurrentPosition();
        } else {
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

    initLocation();
  }, []);

  const getCurrentPosition = async () => {
    setLoading(true);
    setError("");

    try {
      const permission = await Geolocation.checkPermissions();

      if (permission.location !== "granted") {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== "granted") {
          setError("Location permission denied");
          setToastMessage("Location permission denied");
          setToastColor("danger");
          setShowPermissionAlert(true);
          setLoading(false);
          setLocationEnabled(false);
          return;
        }
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
      
      // Show success toast when GPS is acquired
      setToastMessage("GPS signal acquired!");
      setToastColor("success");
      setShowToast(true);
    } catch (err: any) {
      console.error("Error getting location:", err);

      let errorMessage = "Failed to get location";
      if (err.message?.includes("location unavailable")) {
        errorMessage = "Location unavailable. Please enable GPS.";
      } else if (err.message?.includes("timeout")) {
        errorMessage = "Location request timed out. Try again.";
      } else if (err.message?.includes("permission")) {
        errorMessage = "Location permission denied.";
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

  return (
    <IonPage>
      <IonContent fullscreen className="run-map-content">
        <div className="map-container">
          {/* Back Button - Icon Only */}
           <button
          onClick={() => window.location.href = "/routes"}
          className="back-button-icon"
        >
          <IonIcon icon={arrowBack} className="back-icon" />
        </button>

          {/* Google Maps Iframe */}
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
            className="map-iframe"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Running Map"
          />

          {currentPosition && (
            <div className="location-indicator">
              <div className="location-pulse" /> 
            </div>
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
                className={`gps-icon ${locationEnabled ? 'gps-enabled' : ''}`}
              />
            )}
          </button>

          <div className="stats-panel">
            <div className={`gps-status-bar ${locationEnabled ? 'gps-acquired' : 'gps-disabled'}`}>
              <div className="gps-signal-bars">
                <div className="signal-bar bar-1" />
                <div className="signal-bar bar-2" />
                <div className="signal-bar bar-3" />
                <div className="signal-bar bar-4" />
                <span className="gps-status-text">
                  {locationEnabled ? "GPS Acquired" : "No GPS Signal"}
                </span>
              </div>
              <button className="gps-expand-button">⛶</button>
            </div>

            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-value">00:00</div>
                <div className="stat-label">Time</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">--:--</div>
                <div className="stat-label">Split avg. (/km)</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">0</div>
                <div className="stat-label">Distance (km)</div>
              </div>
            </div>

            <div className="start-button-container">
              <button
                onClick={() => locationEnabled && (window.location.href = "/notice")}
                disabled={!locationEnabled}
                className={`start-run-button ${!locationEnabled ? 'disabled' : ''}`}
              >
                <img
                  src={PlayCircle}
                  alt="Start Run"
                  className="start-button-icon"
                />
              </button>
            </div>

            {!locationEnabled && !loading && (
              <div className="location-prompt">
                Enable location to start tracking
              </div>
            )}
          </div>
        </div>

        <IonAlert
          isOpen={showPermissionAlert}
          onDidDismiss={() => setShowPermissionAlert(false)}
          header="Location Permission Required"
          message="This app needs location permission to track your run. Please enable it in settings or tap Retry."
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Retry",
              handler: () => getCurrentPosition(),
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