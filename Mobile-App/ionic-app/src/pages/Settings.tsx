import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonToast,
  IonAlert
} from "@ionic/react";
import '../theme/variables.css';
import "../theme/global.css";
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

interface NotificationPreferences {
  pushEnabled: boolean;
  challengeUpdates: boolean;
  friendActivity: boolean;
  comments: boolean;
  groupEvents: boolean;
  achievementAlerts: boolean;
  weeklyReports: boolean;
}

export default function Settings() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showTokenAlert, setShowTokenAlert] = useState(false);
  
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    pushEnabled: true,
    challengeUpdates: true,
    friendActivity: false,
    comments: false,
    groupEvents: true,
    achievementAlerts: true,
    weeklyReports: false
  });

  // Initialize push notifications
  usePushNotifications({
    onTokenReceived: (token) => {
      console.log("[Settings] FCM Token received:", token);
      setFcmToken(token);
      // Send token to your backend with current preferences
      sendTokenToBackend(token, notificationPrefs);
      setToastMessage("Push notifications enabled successfully!");
      setShowToast(true);
    },
    onNotificationReceived: (notification: PushNotificationSchema) => {
      console.log("[Settings] Notification received:", notification);
      // Handle settings-related notifications (e.g., security alerts)
      if (notification.data?.type === 'security_alert') {
        setToastMessage(`Security Alert: ${notification.body}`);
        setShowToast(true);
      }
    },
    onNotificationActionPerformed: (notification: ActionPerformed) => {
      console.log("[Settings] Notification tapped:", notification);
      // Handle notification actions if needed
    }
  });

  // Mock function to send preferences to backend
  const sendTokenToBackend = async (token: string, prefs: NotificationPreferences) => {
    console.log("Sending token and preferences to backend:", { token, prefs });
    // TODO: Implement actual API call
    // await fetch('your-api/update-notification-preferences', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token, preferences: prefs, userId: currentUserId })
    // });
  };

  // Handle toggle changes
  const handleToggleChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);

    // If master push toggle is disabled, disable all notifications
    if (key === 'pushEnabled' && !value) {
      const allDisabled: NotificationPreferences = {
        pushEnabled: false,
        challengeUpdates: false,
        friendActivity: false,
        comments: false,
        groupEvents: false,
        achievementAlerts: false,
        weeklyReports: false
      };
      setNotificationPrefs(allDisabled);
      if (fcmToken) {
        sendTokenToBackend(fcmToken, allDisabled);
      }
      setToastMessage("All push notifications disabled");
      setShowToast(true);
    } else if (key === 'pushEnabled' && value) {
      setToastMessage("Push notifications enabled");
      setShowToast(true);
    } else {
      // Update individual preference
      if (fcmToken) {
        sendTokenToBackend(fcmToken, newPrefs);
      }
      setToastMessage(`${key.replace(/([A-Z])/g, ' $1').trim()} ${value ? 'enabled' : 'disabled'}`);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader className="dark-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings" />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dark-content" fullscreen>
        {/* Account Settings */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Account Settings</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem button routerLink="/profile-info">
                <IonLabel>
                  <h2>Profile Information</h2>
                  <p>Name, email, and personal details</p>
                </IonLabel>
              </IonItem>

              <IonItem button routerLink="/security">
                <IonLabel>
                  <h2>Password & Security</h2>
                  <p>Update password and security settings</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Privacy Controls */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Privacy Controls</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonLabel>
                  <h2>Profile Visibility</h2>
                  <p>Who can see your profile</p>
                </IonLabel>
                <IonSelect justify="end" value="friends" interface="action-sheet">
                  <IonSelectOption value="friends">Friends Only</IonSelectOption>
                  <IonSelectOption value="everyone">Everyone</IonSelectOption>
                  <IonSelectOption value="private">Private</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel>
                  <h2>Activity Visibility</h2>
                  <p>Default privacy for new activities</p>
                </IonLabel>
                <IonSelect justify="end" value="everyone" interface="action-sheet">
                  <IonSelectOption value="everyone">Everyone</IonSelectOption>
                  <IonSelectOption value="friends">Friends Only</IonSelectOption>
                  <IonSelectOption value="private">Private</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Notifications Preferences */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              Notifications Preferences
              {fcmToken && (
                <IonButton
                  size="small"
                  fill="clear"
                  onClick={() => setShowTokenAlert(true)}
                  style={{ float: 'right', fontSize: '12px' }}
                >
                  View Token
                </IonButton>
              )}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonLabel>
                  <h2>Push Notifications</h2>
                  <p>Enable or disable all notifications</p>
                </IonLabel>
                <IonToggle
                  slot="end"
                  color="success"
                  checked={notificationPrefs.pushEnabled}
                  onIonChange={(e) => handleToggleChange('pushEnabled', e.detail.checked)}
                />
              </IonItem>

              <IonItem disabled={!notificationPrefs.pushEnabled}>
                <IonLabel>
                  <h2>Challenge Updates</h2>
                </IonLabel>
                <IonToggle
                  slot="end"
                  color="success"
                  checked={notificationPrefs.challengeUpdates}
                  onIonChange={(e) => handleToggleChange('challengeUpdates', e.detail.checked)}
                />
              </IonItem>

              <IonItem disabled={!notificationPrefs.pushEnabled}>
                <IonLabel>
                  <h2>Friend Activity</h2>
                </IonLabel>
                <IonToggle
                  slot="end"
                  color="success"
                  checked={notificationPrefs.friendActivity}
                  onIonChange={(e) => handleToggleChange('friendActivity', e.detail.checked)}
                />
              </IonItem>

              <IonItem disabled={!notificationPrefs.pushEnabled}>
                <IonLabel>
                  <h2>Comments</h2>
                </IonLabel>
                <IonToggle
                  slot="end"
                  color="success"
                  checked={notificationPrefs.comments}
                  onIonChange={(e) => handleToggleChange('comments', e.detail.checked)}
                />
              </IonItem>

              <IonItem disabled={!notificationPrefs.pushEnabled}>
                <IonLabel>
                  <h2>Group Events</h2>
                </IonLabel>
                <IonToggle
                  slot="end"
                  color="success"
                  checked={notificationPrefs.groupEvents}
                  onIonChange={(e) => handleToggleChange('groupEvents', e.detail.checked)}
                />
              </IonItem>

              <IonItem disabled={!notificationPrefs.pushEnabled}>
                <IonLabel>
                  <h2>Achievement Alerts</h2>
                </IonLabel>
                <IonToggle
                  slot="end"
                  color="success"
                  checked={notificationPrefs.achievementAlerts}
                  onIonChange={(e) => handleToggleChange('achievementAlerts', e.detail.checked)}
                />
              </IonItem>

              <IonItem disabled={!notificationPrefs.pushEnabled}>
                <IonLabel>
                  <h2>Weekly Reports</h2>
                </IonLabel>
                <IonToggle
                  slot="end"
                  color="success"
                  checked={notificationPrefs.weeklyReports}
                  onIonChange={(e) => handleToggleChange('weeklyReports', e.detail.checked)}
                />
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* App Preferences */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>App Preferences</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonLabel>
                  <h2>Distance Units</h2>
                  <p>Choose kilometers or miles</p>
                </IonLabel>
                <div style={{ display: "flex", gap: "8px" }}>
                  <IonButton size="small" fill="outline" color="success">km</IonButton>
                  <IonButton size="small" fill="outline" color="success">mi</IonButton>
                </div>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Log Out */}
        <div>
          <IonButton className="logout-btn" routerLink="/log-in" expand="block" color="danger">
            Log Out
          </IonButton>
        </div>

        {/* Toast for feedback */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
          color="success"
        />

        {/* Alert to show FCM token */}
        <IonAlert
          isOpen={showTokenAlert}
          onDidDismiss={() => setShowTokenAlert(false)}
          header="FCM Device Token"
          message={fcmToken || "No token available"}
          buttons={[
            {
              text: 'Copy',
              handler: () => {
                if (fcmToken) {
                  navigator.clipboard.writeText(fcmToken);
                  setToastMessage("Token copied to clipboard");
                  setShowToast(true);
                }
              }
            },
            {
              text: 'Close',
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  )
};