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
  IonSpinner
} from "@ionic/react";
import '../theme/variables.css';
import "../theme/global.css";
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../contexts/UserContext";
import { UsersApi } from "../services/users";
import { clearSessionCache } from "../lib/api";

interface NotificationPreferences {
  pushEnabled: boolean;
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

  const [activitiesVisibility, setActivitiesVisibility] = useState<'public' | 'private'>('public');

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    pushEnabled: true
  });

  // Load user preferences on mount
  useEffect(() => {
    if (currentUser) {
      setActivitiesVisibility(currentUser.activities_visibility || 'public');
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

      // Clear in-memory session cache (fast)
      clearSessionCache();
      console.log('[Settings] Cleared in-memory session cache');

      // Sign out from Supabase (invalidates session)
      await supabase.auth.signOut();
      console.log('[Settings] Supabase signOut completed');

      // ✅ OPTIMIZATION: Redirect IMMEDIATELY for instant perceived logout
      // Storage clearing happens in background (non-blocking)
      history.replace('/authentication');

      // ✅ OPTIMIZATION: Clear storage in background (saves 100-500ms perceived time)
      // This runs after navigation, so user doesn't wait for it
      setTimeout(() => {
        try {
          sessionStorage.clear();
          localStorage.clear();
          console.log('[Settings] Background cleanup: cleared sessionStorage and localStorage');
        } catch (err) {
          console.error('[Settings] Background cleanup error:', err);
        }
      }, 100); // Small delay to ensure navigation completes first

    } catch (e) {
      setToastMessage('Failed to log out');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoggingOut(false);
    }
  };

  // Handle toggle changes
  const handleToggleChange = (value: boolean) => {
    const newPrefs: NotificationPreferences = {
      pushEnabled: value
    };
    setNotificationPrefs(newPrefs);

    if (fcmToken) {
      sendTokenToBackend(fcmToken, newPrefs);
    }

    setToastMessage(value ? "Push notifications enabled" : "Push notifications disabled");
    setToastColor('success');
    setShowToast(true);
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

        {/* Notifications */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Notifications</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonLabel>
                  <h2>Push Notifications</h2>
                  <p>Enable or disable push notifications</p>
                </IonLabel>
                <IonToggle
                  slot="end"
                  color="success"
                  checked={notificationPrefs.pushEnabled}
                  onIonChange={(e) => handleToggleChange(e.detail.checked)}
                />
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
      </IonContent>
    </IonPage>
  );
}
