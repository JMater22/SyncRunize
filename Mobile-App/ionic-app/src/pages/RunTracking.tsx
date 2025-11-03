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

interface Position {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  speed?: number | null;
}

const RunMap: React.FC = () => {
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
        // Already have permission, get location immediately
        await getCurrentPosition();
      } else if (permission.location === "denied") {
        // Permission was previously denied
        setShowPermissionAlert(true);
      } else {
        // First time - show friendly prompt
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
        setToastMessage("✅ Location access granted!");
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

      setToastMessage("📍 GPS signal acquired!");
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
        <div className="map-container" style={{ position: 'relative', height: '100%' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 1000,
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              cursor: 'pointer'
            }}
          >
            <IonIcon icon={arrowBack} style={{ fontSize: '24px', color: '#333' }} />
          </button>

          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Running Map"
          />

          {currentPosition && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#4285f4',
              border: '3px solid white',
              boxShadow: '0 0 0 4px rgba(66, 133, 244, 0.3)',
              animation: 'pulse 2s infinite'
            }} />
          )}

          <button
            onClick={getCurrentPosition}
            disabled={loading}
            style={{
              position: 'absolute',
              bottom: '250px',
              right: '20px',
              zIndex: 1000,
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              cursor: 'pointer'
            }}
          >
            {loading ? (
              <IonSpinner name="crescent" />
            ) : (
              <IonIcon
                icon={navigateCircleOutline}
                style={{
                  fontSize: '28px',
                  color: locationEnabled ? '#34a853' : '#666'
                }}
              />
            )}
          </button>

          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: '24px 24px 0 0',
            padding: '20px',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: locationEnabled ? '#e8f5e9' : '#fff3e0',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      style={{
                        width: '4px',
                        height: `${bar * 4}px`,
                        background: locationEnabled ? '#34a853' : '#ccc',
                        borderRadius: '2px'
                      }}
                    />
                  ))}
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: locationEnabled ? '#1b5e20' : '#e65100'
                }}>
                  {locationEnabled ? "GPS Acquired" : "No GPS Signal"}
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>00:00</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Time</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>--:--</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Split avg. (/km)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>0</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Distance (km)</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <button
                onClick={() => locationEnabled && alert('Start run')}
                disabled={!locationEnabled}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: 'none',
                  background: locationEnabled ? '#34a853' : '#ccc',
                  color: 'white',
                  fontSize: '32px',
                  cursor: locationEnabled ? 'pointer' : 'not-allowed',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}
              >
                ▶
              </button>
            </div>

            {!locationEnabled && !loading && (
              <div style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#666',
                marginTop: '8px'
              }}>
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
                // On mobile, this would open app settings
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

        <style>{`
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.7);
            }
            70% {
              box-shadow: 0 0 0 12px rgba(66, 133, 244, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(66, 133, 244, 0);
            }
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default RunMap;