import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonImg,
  IonSpinner,
  IonToast,
  IonBadge,
  IonAlert,
} from "@ionic/react";
import { arrowBack, walk, locate, locationOutline } from "ionicons/icons";
import { Geolocation } from '@capacitor/geolocation';
import Map from '../components/assets/map.png';
import '../theme/global.css';
import '../theme/Run-Main.css';

interface Position {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  speed?: number | null;
}

export default function RunMap() {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);

  // Get current position on component mount
  useEffect(() => {
    getCurrentPosition();
  }, []);

  // Request permission and get current position
  const getCurrentPosition = async () => {
    setLoading(true);
    setError("");

    try {
      // Check and request permissions
      const permission = await Geolocation.checkPermissions();
      
      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') {
          setError("Location permission denied");
          setShowPermissionAlert(true);
          setLoading(false);
          setLocationEnabled(false);
          return;
        }
      }

      // Get current position with optimized settings for Android
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for Android
        maximumAge: 5000 // Allow cached position up to 5 seconds old
      });

      setCurrentPosition({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        speed: position.coords.speed,
      });

      setLocationEnabled(true);
    
      console.log('Current position:', position.coords);
    } catch (err: any) {
      console.error('Error getting location:', err);
      
      // Provide more specific error messages
      let errorMessage = "Failed to get location";
      if (err.message.includes('location unavailable')) {
        errorMessage = "Location unavailable. Please enable GPS.";
      } else if (err.message.includes('timeout')) {
        errorMessage = "Location request timed out. Try again.";
      } else if (err.message.includes('permission')) {
        errorMessage = "Location permission denied.";
      }
      
      setError(errorMessage);
      setShowToast(true);
      setLocationEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      {/* Top Header */}
      <IonHeader className="dark-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1" icon={arrowBack} />
          </IonButtons>
          <IonTitle className="header-title">
            <div className="title-container">
              <IonIcon className="run-icon" icon={walk}></IonIcon>
              <span>Run</span>
            </div>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={getCurrentPosition} disabled={loading}>
              {loading ? (
                <IonSpinner name="crescent" />
              ) : (
                <IonIcon icon={locate} color={locationEnabled ? "success" : "medium"} />
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
      <IonContent fullscreen className="run-map-content">
        {/* Location Status Bar */}
        {currentPosition && (
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IonIcon icon={locationOutline} color="success" />
              <span>
                {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
              </span>
            </div>
            {currentPosition.accuracy && (
              <IonBadge color="success">±{currentPosition.accuracy.toFixed(0)}m</IonBadge>
            )}
          </div>
        )}

        {/* Map container */}
        <div className="map-container">
          <IonImg src={Map} alt="Running Map" className="map-image" />

          {/* Location indicator on map */}
          {currentPosition && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "20px",
                height: "20px",
                backgroundColor: "#4CAF50",
                border: "3px solid white",
                borderRadius: "50%",
                boxShadow: "0 0 10px rgba(76, 175, 80, 0.8)",
                zIndex: 5,
              }}
            >
              {/* Pulse animation */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "40px",
                  height: "40px",
                  backgroundColor: "rgba(76, 175, 80, 0.3)",
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              />
            </div>
          )}

          {/* Start Button */}
          <IonButton
            className="start-button"
            color="success"
            size="large"
            routerLink="/notice"
            disabled={!locationEnabled}
          >
            {locationEnabled ? "START" : "ENABLE LOCATION"}
          </IonButton>

          {/* Location status message */}
          {!locationEnabled && !loading && (
            <div
              style={{
                position: "absolute",
                bottom: "100px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "white",
                padding: "12px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                textAlign: "center",
                maxWidth: "80%",
              }}
            >
              <IonIcon icon={locationOutline} style={{ marginRight: "8px" }} />
              Enable location to start tracking
            </div>
          )}
        </div>

        {/* Permission Alert */}
        <IonAlert
          isOpen={showPermissionAlert}
          onDidDismiss={() => setShowPermissionAlert(false)}
          header="Location Permission Required"
          message="This app needs location permission to track your run. Please enable location permissions in your device settings."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Retry',
              handler: () => {
                getCurrentPosition();
              }
            }
          ]}
        />

        {/* Toast for errors */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={error}
          duration={3000}
          color="danger"
          position="top"
        />

        {/* CSS for pulse animation */}
        <style>{`
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.7;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.5);
              opacity: 0.3;
            }
            100% {
              transform: translate(-50%, -50%) scale(2);
              opacity: 0;
            }
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
}