import React, { useState, useEffect } from "react";
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

const RunMap: React.FC = () => {
  // Hide the tab bar on this page
  useHideTabBar();
  const history = useHistory()

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

  useEffect(() => {
    checkInitialPermissions(); 
  }, []);

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

  return (
    <IonPage>
      <IonContent fullscreen className="run-map-content">
        <div className="map-container">
          {/* Back Button */}
           <button
            onClick={() => history.push('/routes')}
            className="custom-back-button-icon"
          >
            <IonIcon icon={arrowBack} className="back-icon" />
          </button>

          {/* Map Iframe */}
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
            className="map-iframe"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Running Map"
          />

          {/* Location Indicator */}
          {currentPosition && (
            <>
              <div className="location-indicator" />
              <div className="location-pulse" />
            </>
          )}

          {/* GPS Button */}
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

          {/* Stats Panel */}
          <div className="stats-panel">
            {/* GPS Status Bar */}
            <div className={`gps-status-bar ${locationEnabled ? 'gps-acquired' : 'gps-disabled'}`}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="gps-signal-bars">
                  {[1, 2, 3, 4].map((bar) => (
                    <div key={bar} className={`signal-bar bar-${bar}`} />
                  ))}
                </div>
                <span className="gps-status-text">
                  {locationEnabled ? "GPS Acquired" : "No GPS Signal"}
                </span>
              </div>
            </div>

            {/* Stats Row */}
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

            {/* Start Button */}
            <div className="start-button-container">
              <button
                onClick={() => locationEnabled && (window.location.href = '/notice')}
                disabled={!locationEnabled}
                className={`start-run-button ${!locationEnabled ? 'disabled' : ''}`} 
              >
                <span style={{ fontSize: '32px' }}>▶</span>
              </button>
            </div>

            {/* Location Prompt */}
            {!locationEnabled && !loading && (
              <div className="location-prompt">
                Enable location to start tracking
              </div>
            )}
          </div>
        </div>

        {/* Initial Location Prompt Modal */}
        <IonModal isOpen={showInitialPrompt} backdropDismiss={false}>
          <div style={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center'
          }}>
            <IonIcon
              icon={locationOutline}
              style={{
                fontSize: '80px',
                color: '#4285f4',
                marginBottom: '24px'
              }}
            />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
              Allow Location Access
            </h2>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px', lineHeight: '1.5' }}>
              RunTracker needs access to your location to track your runs, calculate distance, and provide accurate pace information.
            </p>
            <IonButton
              expand="block"
              onClick={requestLocationAccess}
              style={{ marginBottom: '12px', width: '100%' }}
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

        {/* Permission Denied Alert */}
        <IonAlert
          isOpen={showPermissionAlert}
          onDidDismiss={() => setShowPermissionAlert(false)}
          header="Location Permission Required"
          message="This app needs location permission to track your run. Please enable it in your device settings."
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => window.history.back()
            },
            {
              text: "Open Settings",
              handler: () => {
                alert("Please enable location in your device settings");
              }
            }
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