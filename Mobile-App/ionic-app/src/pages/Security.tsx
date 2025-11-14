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
  IonInput,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonToast,
  IonIcon,
  IonText
} from "@ionic/react";
import { lockClosedOutline, keyOutline } from "ionicons/icons";
import '../theme/Security.css';
import "../theme/global.css";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../contexts/UserContext";

export default function Security() {
  const history = useHistory();
  const { currentUser } = useUser();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is using OAuth
    const checkProvider = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userProvider = data?.user?.app_metadata?.provider;
        setProvider(userProvider || 'email');
      } catch (error) {
        console.error('Error checking auth provider:', error);
      }
    };
    checkProvider();
  }, []);

  const handlePasswordUpdate = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      setToastMessage("Please fill in all password fields");
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setToastMessage("Passwords do not match");
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (newPassword.length < 6) {
      setToastMessage("Password must be at least 6 characters");
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    // Check if user is using OAuth
    if (provider && provider !== 'email') {
      setToastMessage(`Cannot change password for ${provider} sign-in`);
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    try {
      setUpdating(true);

      // Check session
      const { data: sessionResp } = await supabase.auth.getSession();
      const session = sessionResp?.session;
      if (!session) {
        setToastMessage("Session expired. Please log in again.");
        setToastColor('danger');
        setShowToast(true);
        return;
      }

      // Update password
      let { error } = await supabase.auth.updateUser({ password: newPassword });

      // Retry with refresh if token expired
      if (error && (error.status === 401 || /token/i.test((error as any).message || ""))) {
        await supabase.auth.refreshSession();
        ({ error } = await supabase.auth.updateUser({ password: newPassword }));
      }

      if (error) {
        throw error;
      }

      setToastMessage("Password updated successfully");
      setToastColor('success');
      setShowToast(true);

      // Clear fields
      setNewPassword("");
      setConfirmPassword("");

      // Navigate back to settings after 2 seconds
      setTimeout(() => {
        history.goBack();
      }, 2000);
    } catch (error: any) {
      console.error('Error updating password:', error);
      const msg = error?.error_description || error?.message || "Failed to update password";
      setToastMessage(msg);
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setUpdating(false);
    }
  };

  const isOAuthUser = provider && provider !== 'email';

  return (
    <IonPage>
      <IonHeader className="dark-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings" />
          </IonButtons>
          <IonTitle>Password & Security</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dark-content security-content" fullscreen>
        {/* Password Change Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={lockClosedOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Change Password
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {isOAuthUser ? (
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 193, 7, 0.3)'
              }}>
                <IonText color="warning">
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    <IonIcon icon={keyOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    You signed in with <strong>{provider}</strong>. Password changes are not available for OAuth accounts.
                  </p>
                </IonText>
              </div>
            ) : (
              <IonList>
                <IonItem className="security-input">
                  <IonLabel position="stacked">New Password</IonLabel>
                  <IonInput
                    type="password"
                    value={newPassword}
                    onIonInput={(e) => setNewPassword(e.detail.value || "")}
                    placeholder="Enter new password (min 6 characters)"
                    disabled={updating}
                  />
                </IonItem>

                <IonItem className="security-input">
                  <IonLabel position="stacked">Confirm Password</IonLabel>
                  <IonInput
                    type="password"
                    value={confirmPassword}
                    onIonInput={(e) => setConfirmPassword(e.detail.value || "")}
                    placeholder="Confirm new password"
                    disabled={updating}
                  />
                </IonItem>

                <div style={{ marginTop: '16px' }}>
                  <IonText color="medium" style={{ fontSize: '12px', display: 'block', marginBottom: '12px', paddingLeft: '4px' }}>
                    Password must be at least 6 characters long
                  </IonText>
                  <IonButton
                    expand="block"
                    color="success"
                    onClick={handlePasswordUpdate}
                    disabled={updating || !newPassword || !confirmPassword}
                    strong
                  >
                    {updating ? 'Updating...' : 'Update Password'}
                  </IonButton>
                </div>
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        {/* Security Tips Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '16px' }}>Security Tips</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem className="security-tip">
                <IonText color="medium">
                  <p style={{ fontSize: '13px', margin: '4px 0' }}>
                    • Use a strong password with letters, numbers, and symbols
                  </p>
                </IonText>
              </IonItem>
              <IonItem className="security-tip">
                <IonText color="medium">
                  <p style={{ fontSize: '13px', margin: '4px 0' }}>
                    • Don't reuse passwords from other websites
                  </p>
                </IonText>
              </IonItem>
              <IonItem className="security-tip">
                <IonText color="medium">
                  <p style={{ fontSize: '13px', margin: '4px 0' }}>
                    • Change your password regularly
                  </p>
                </IonText>
              </IonItem>
              <IonItem className="security-tip">
                <IonText color="medium">
                  <p style={{ fontSize: '13px', margin: '4px 0' }}>
                    • Never share your password with anyone
                  </p>
                </IonText>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

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
