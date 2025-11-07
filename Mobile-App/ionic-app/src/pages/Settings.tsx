import { useState, useEffect } from "react";
import { useHistory } from 'react-router-dom';
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
  IonAlert,
  IonSpinner
} from "@ionic/react";
import '../theme/variables.css';
import "../theme/global.css";
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../contexts/UserContext";
import { UsersApi } from "../services/users";

interface NotificationPreferences {
  pushEnabled: boolean;
  comments: boolean;
  groupEvents: boolean;
  achievementAlerts: boolean;
  weeklyReports: boolean;
}

export default function Settings() {
  const history = useHistory();
  const { currentUser, refreshUser } = useUser();
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  const [showTokenAlert, setShowTokenAlert] = useState(false);

  const [activitiesVisibility, setActivitiesVisibility] = useState<'public' | 'private'>('public');
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    pushEnabled: true,
    comments: false,
    groupEvents: true,
    achievementAlerts: true,
    weeklyReports: false
  });

  // Load user preferences on mount
  useEffect(() => {
    if (currentUser) {
      setActivitiesVisibility(currentUser.activities_visibility || 'public');
      setDistanceUnit(currentUser.distance_unit || 'km');
    }
  }, [currentUser]);

  // Initialize push notifications
  usePushNotifications({
    onTokenReceived: (token) => {
      console.log("[Settings] FCM Token received:", token);
      setFcmToken(token);
      // Send token to your backend with current preferences
      sendTokenToBackend(token, notificationPrefs);
      setToastMessage("Push notifications enabled successfully!");
      setToastColor('success');
      setShowToast(true);
    },
    onNotificationReceived: (notification: PushNotificationSchema) => {
      console.log("[Settings] Notification received:", notification);
      // Handle settings-related notifications (e.g., security alerts)
      if (notification.data?.type === 'security_alert') {
        setToastMessage(`Security Alert: ${notification.body}`);
        setToastColor('warning');
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

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      // After sign out, route to authentication gate
      history.replace('/authentication');
    } catch (e) {
      setToastMessage('Failed to log out');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoggingOut(false);
    }
  };

  // Handle toggle changes
  const handleToggleChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);

    // If master push toggle is disabled, disable all notifications
    if (key === 'pushEnabled' && !value) {
      const allDisabled: NotificationPreferences = {
        pushEnabled: false,
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
      setToastColor('success');
      setShowToast(true);
    } else if (key === 'pushEnabled' && value) {
      setToastMessage("Push notifications enabled");
      setToastColor('success');
      setShowToast(true);
    } else {
      // Update individual preference
      if (fcmToken) {
        sendTokenToBackend(fcmToken, newPrefs);
      }
      setToastMessage(`${key.replace(/([A-Z])/g, ' $1').trim()} ${value ? 'enabled' : 'disabled'}`);
      setToastColor('success');
      setShowToast(true);
    }
  };

  // Handle privacy settings change
  const handlePrivacyChange = async (visibility: 'public' | 'private') => {
    try {
      setSaving(true);
      setActivitiesVisibility(visibility);

      await UsersApi.updatePrivacySettings({ activities_visibility: visibility });
      await refreshUser();

      setToastMessage(`Activity visibility set to ${visibility}`);
      setToastColor('success');
      setShowToast(true);
    } catch (error: any) {
      console.error('Failed to update privacy settings:', error);
      setToastMessage('Failed to update privacy settings');
      setToastColor('danger');
      setShowToast(true);
      // Revert on error
      setActivitiesVisibility(currentUser?.activities_visibility || 'public');
    } finally {
      setSaving(false);
    }
  };

  // Handle distance unit change
  const handleDistanceUnitChange = async (unit: 'km' | 'mi') => {
    try {
      setSaving(true);
      setDistanceUnit(unit);

      await UsersApi.updateMe({ distance_unit: unit });
      await refreshUser();

      setToastMessage(`Distance unit set to ${unit}`);
      setToastColor('success');
      setShowToast(true);
    } catch (error: any) {
      console.error('Failed to update distance unit:', error);
      setToastMessage('Failed to update distance unit');
      setToastColor('danger');
      setShowToast(true);
      // Revert on error
      setDistanceUnit(currentUser?.distance_unit || 'km');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <IonPage>
        <IonHeader className="dark-header">
          <IonToolbar>
            <IonTitle>Settings</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-text-center ion-padding">
          <IonSpinner name="crescent" />
          <p>Loading settings...</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className="dark-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
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
                  <h2>Activity Visibility</h2>
                  <p>Default privacy for new activities</p>
                </IonLabel>
                <IonSelect
                  justify="end"
                  value={activitiesVisibility}
                  interface="action-sheet"
                  disabled={saving}
                  onIonChange={(e) => handlePrivacyChange(e.detail.value)}
                >
                  <IonSelectOption value="public">Everyone</IonSelectOption>
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
                  <IonButton
                    size="small"
                    fill={distanceUnit === 'km' ? 'solid' : 'outline'}
                    color="success"
                    disabled={saving}
                    onClick={() => handleDistanceUnitChange('km')}
                  >
                    km
                  </IonButton>
                  <IonButton
                    size="small"
                    fill={distanceUnit === 'mi' ? 'solid' : 'outline'}
                    color="success"
                    disabled={saving}
                    onClick={() => handleDistanceUnitChange('mi')}
                  >
                    mi
                  </IonButton>
                </div>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Log Out */}
        <div>
          <IonButton
            className="logout-btn"
            onClick={handleLogout}
            expand="block"
            color="danger"
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out...' : 'Log Out'}
          </IonButton>
        </div>

        {/* Toast for feedback */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
          color={toastColor}
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
                  setToastColor('success');
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
  );
}
