import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonChip,
  IonIcon,
  IonToast
} from "@ionic/react";
import { location, warning } from 'ionicons/icons';
import { useState } from "react";
import "../theme/TrafficNotice.css";
import { useHideTabBar } from "../hooks/useHideTabBar";
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

export default function TrafficNotice() {
  useHideTabBar();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Initialize push notifications
  usePushNotifications({
    onTokenReceived: (token) => {
      console.log("[TrafficNotice] FCM Token received:", token);
      // Send token to your backend to register for traffic alerts
      // e.g., sendTokenToBackend(token, 'traffic_alerts');
    },
    onNotificationReceived: (notification: PushNotificationSchema) => {
      console.log("[TrafficNotice] Notification received:", notification);
      // Handle incoming traffic notifications
      if (notification.data?.type === 'traffic') {
        setToastMessage(`Traffic Update: ${notification.body}`);
        setShowToast(true);
      }
    },
    onNotificationActionPerformed: (notification: ActionPerformed) => {
      console.log("[TrafficNotice] Notification tapped:", notification);
      // Navigate to specific traffic location if needed
      if (notification.notification.data?.location) {
        // Handle navigation to specific location
      }
    }
  });
  
  return (
    <IonPage>
      <IonHeader translucent={true} className="traffic-header">
        <IonToolbar color="danger">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/RunTracking/runT1/index.html" text="" />
          </IonButtons>
          <IonTitle className="ion-text-center header-title">
            <IonIcon icon={warning} className="header-icon" />
            TRAFFIC ALERT
          </IonTitle>
        </IonToolbar>
      </IonHeader> 

      <IonContent fullscreen className="traffic-content">
        <div className="map-container">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27403.697792075374!2d120.58200860881004!3d15.48705054784102!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3396c63f4ab68e0d%3A0x13f9415d7a5bfd4b!2sTarlac%20City%2C%20Tarlac!5e0!3m2!1sen!2sph!4v1761910044713!5m2!1sen!2sph"
            className="map-iframe"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Traffic Map Location"
          />
          <div className="map-overlay" />
          <div className="map-vignette" />
        </div>

        <div className="status-indicator">
          <IonChip color="danger" className="status-chip">
            <div className="pulse-dot" />
            <span className="status-text">Heavy Traffic Detected</span>
          </IonChip>
        </div>

        <div className="notice-card">
          <IonCard>
            <IonCardContent>
              <div className="notice-section">
                <div className="notice-icon-label">
                  <span className="label">Location:</span>
                </div>
                <p className="notice-text">
                  Around 500m from your current position, near Dalisay Store
                </p>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard>
            <IonCardContent>
              <div className="notice-section">
                <div className="notice-icon-label">
                  <span className="label">Traffic Notice:</span>
                </div>
                <p className="notice-text">
                  Heavy traffic and road congestion reported ahead. Expect delays and proceed
                  carefully when navigating through the area.
                </p>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
}