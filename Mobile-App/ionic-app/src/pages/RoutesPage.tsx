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
  IonFab,
  IonFabButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLabel,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonSearchbar,
  IonSpinner,
  IonToast,
  IonAlert,
  IonModal
} from "@ionic/react";
import { bookmark, pencil, locate, locationOutline } from "ionicons/icons";
import { Geolocation } from "@capacitor/geolocation";

interface Position {
  latitude: number;
  longitude: number;
}

const RouteSuggestion: React.FC = () => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "primary">("danger");
  const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);
  const [showInitialPrompt, setShowInitialPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>("prompt");
  const [hasCheckedPermission, setHasCheckedPermission] = useState(false);

  useEffect(() => {
    checkInitialPermissions();
  }, []);

  const checkInitialPermissions = async () => {
    try {
      const permission = await Geolocation.checkPermissions();
      setPermissionStatus(permission.location);
      setHasCheckedPermission(true);

      if (permission.location === "granted") {
        // Already have permission, get location
        await getCurrentPosition();
      } else if (permission.location === "denied") {
        // Permission was previously denied
        console.log("Location permission denied");
      }
      // If prompt, we don't show anything yet - user can click locate button
    } catch (err) {
      console.error("Error checking permissions:", err);
      setHasCheckedPermission(true);
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

  const handleLocateClick = async () => {
    const permission = await Geolocation.checkPermissions();
    
    if (permission.location === "granted") {
      getCurrentPosition();
    } else if (permission.location === "denied") {
      setShowPermissionAlert(true);
    } else {
      // Show prompt
      setShowInitialPrompt(true);
    }
  };

  const getCurrentPosition = async () => {
    setLoading(true);
    setError("");

    try {
      const permission = await Geolocation.checkPermissions();

      if (permission.location !== "granted") {
        setShowInitialPrompt(true);
        setLoading(false);
        return;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      setCurrentPosition({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      
      setToastMessage("📍 Location acquired!");
      setToastColor("success");
      setShowToast(true);
      
      console.log("Current position:", position.coords);
    } catch (err: any) {
      console.error("Error getting location:", err);
      
      let errorMessage = "Failed to get location";
      if (err.message?.includes("location unavailable")) {
        errorMessage = "Location unavailable. Please enable GPS.";
      } else if (err.message?.includes("timeout")) {
        errorMessage = "Location request timed out. Try again.";
      }
      
      setError(errorMessage);
      setToastColor("danger");
      setToastMessage(errorMessage);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" />
          </IonButtons>

          <IonTitle>Route Suggestion</IonTitle>

          <IonButtons slot="end">
            <IonButton
              onClick={handleLocateClick}
              disabled={loading}
            >
              {loading ? (
                <IonSpinner name="crescent" />
              ) : (
                <IonIcon 
                  icon={locate} 
                  style={{ 
                    color: currentPosition ? '#34a853' : '#666',
                    fontSize: '24px'
                  }} 
                />
              )}
            </IonButton>

            <IonButton routerLink="/saved-routes">
              <IonIcon icon={bookmark} style={{ fontSize: '24px' }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div style={{ padding: '16px 16px 8px' }}>
          <IonSearchbar 
            placeholder="Search location" 
            style={{ 
              '--background': '#f5f5f5',
              '--border-radius': '12px'
            }}
          />
        </div>

        {currentPosition && (
          <div style={{
            padding: '8px 16px',
            background: '#e8f5e9',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#1b5e20'
          }}>
            <IonIcon icon={locationOutline} />
            <span>
              Lat: {currentPosition.latitude.toFixed(6)}, Lng: {currentPosition.longitude.toFixed(6)}
            </span>
          </div>
        )}

        {accordionValue !== "routes" && (
          <div style={{ position: 'relative', height: '300px', margin: '0' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Main Map"
            />

            <IonFab vertical="bottom" horizontal="end" slot="fixed">
              <IonFabButton routerLink="/create-route" color="primary">
                <IonIcon icon={pencil} />
              </IonFabButton>
            </IonFab>
          </div>
        )}

        <IonAccordionGroup 
          value={accordionValue} 
          onIonChange={(e) => setAccordionValue(e.detail.value)}
        >
          <IonAccordion value="routes">
            <IonItem slot="header" lines="none" style={{ fontWeight: '600' }}>
              <IonLabel>Suggested Routes For You</IonLabel>
            </IonItem>

            <div slot="content" style={{ padding: '16px' }}>
              {/* Route Card 1 */}
              <IonCard style={{ marginBottom: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle>Capas Route</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    fontSize: '14px', 
                    color: '#666',
                    marginBottom: '8px' 
                  }}>
                    <span>🏃 5.21 km</span>
                    <span>⏱️ 1h 12m</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#888', marginBottom: '16px' }}>
                    Capas, Tarlac, Philippines
                  </p>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <IonButton 
                      size="small" 
                      color="success"
                      onClick={() => {
                        setToastMessage("✅ Route saved successfully!");
                        setToastColor("success");
                        setShowToast(true);
                      }}
                    >
                      Save
                    </IonButton>
                    <IonButton 
                      size="small" 
                      color="success" 
                      fill="outline"
                      disabled={!currentPosition}
                      onClick={() => {
                        if (!currentPosition) {
                          setShowInitialPrompt(true);
                        }
                      }}
                    >
                      From your location
                    </IonButton>
                  </div>

                  <div style={{ borderRadius: '8px', overflow: 'hidden', height: '200px' }}>
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Route Map 1"
                    />
                  </div>
                </IonCardContent>
              </IonCard>

              {/* Route Card 2 */}
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>San. Roque Route</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    fontSize: '14px', 
                    color: '#666',
                    marginBottom: '8px' 
                  }}>
                    <span>🏃 7.5 km</span>
                    <span>⏱️ 1h 45m</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#888', marginBottom: '16px' }}>
                    Tarlac City, Tarlac, Philippines
                  </p>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <IonButton 
                      size="small" 
                      color="success"
                      onClick={() => {
                        setToastMessage("✅ Route saved successfully!");
                        setToastColor("success");
                        setShowToast(true);
                      }}
                    >
                      Save
                    </IonButton>
                    <IonButton 
                      size="small" 
                      color="success" 
                      fill="outline"
                      disabled={!currentPosition}
                      onClick={() => {
                        if (!currentPosition) {
                          setShowInitialPrompt(true);
                        }
                      }}
                    >
                      From your location
                    </IonButton>
                  </div>

                  <div style={{ borderRadius: '8px', overflow: 'hidden', height: '200px' }}>
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Route Map 2"
                    />
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          </IonAccordion>
        </IonAccordionGroup>

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
              Allow RunTracker to access your location to find nearby routes and personalize route suggestions based on your area.
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
              onClick={() => setShowInitialPrompt(false)}
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
          message="Location access is needed to show routes near you. Please enable it in your device settings."
          buttons={[
            {
              text: "Cancel",
              role: "cancel"
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

export default RouteSuggestion;