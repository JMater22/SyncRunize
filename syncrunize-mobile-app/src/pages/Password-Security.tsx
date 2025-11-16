import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonContent,
  IonItem,
  IonInput,
  IonLabel,
  IonIcon,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonIcon as IonIconEl,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonText
} from "@ionic/react";
import { keyOutline, eyeOutline, eyeOffOutline, lockClosedOutline, informationCircleOutline } from "ionicons/icons";
import "../theme/Password-Security.css"; // custom CSS for styling
import { supabase } from "../lib/supabaseClient";

const PasswordSecurity: React.FC = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; msg: string; color?: string }>({ open: false, msg: "" });
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

  const handleUpdate = async () => {
    // Check if user is using OAuth
    if (provider && provider !== 'email') {
      setToast({ open: true, msg: `Cannot change password for ${provider} sign-in`, color: "warning" });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setToast({ open: true, msg: "Password must be at least 6 characters", color: "danger" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ open: true, msg: "Passwords do not match", color: "danger" });
      return;
    }
    try {
      setSaving(true);

      // Check session
      const { data: sessionResp } = await supabase.auth.getSession();
      const session = sessionResp?.session;
      if (!session) {
        setToast({ open: true, msg: "Session expired. Please log in again.", color: "danger" });
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

      setToast({ open: true, msg: "Password updated successfully", color: "success" });
      setNewPassword("");
      setConfirmPassword("");
      // Optional: Sign out globally to force re-login on all devices
      // await supabase.auth.signOut({ scope: 'global' });
    } catch (e: any) {
      const msg = e?.error_description || e?.message || "Failed to update password";
      setToast({ open: true, msg, color: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    console.log("Cancelled");
    // Add cancel logic here
  };

  const isOAuthUser = provider && provider !== 'email';

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="dark-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings" />
          </IonButtons>
          <IonTitle>Password & Security</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Content */}
      <IonContent className="dark-content password-security-content" fullscreen>
        {/* Password Change Card */}
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
                    <IonIcon icon={informationCircleOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    You signed in with <strong>{provider}</strong>. Password changes are not available for OAuth accounts.
                  </p>
                </IonText>
              </div>
            ) : (
              <IonList>
                {/* New Password */}
                <IonItem className="security-input-item">
                  <IonIcon color="success" icon={keyOutline} slot="start" className="profile-icon" />
                  <IonLabel position="stacked">New Password</IonLabel>
                  <IonInput
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onIonInput={(e) => setNewPassword(e.detail.value!)}
                    placeholder="Enter new password (min 6 characters)"
                    disabled={saving}
                  />
                  <IonButton slot="end" fill="clear" onClick={() => setShowNew(s => !s)}>
                    <IonIconEl icon={showNew ? eyeOffOutline : eyeOutline} />
                  </IonButton>
                </IonItem>

                {/* Confirm Password */}
                <IonItem className="security-input-item">
                  <IonIcon color="success" icon={keyOutline} slot="start" className="profile-icon" />
                  <IonLabel position="stacked">Confirm New Password</IonLabel>
                  <IonInput
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                    placeholder="Confirm new password"
                    disabled={saving}
                  />
                  <IonButton slot="end" fill="clear" onClick={() => setShowConfirm(s => !s)}>
                    <IonIconEl icon={showConfirm ? eyeOffOutline : eyeOutline} />
                  </IonButton>
                </IonItem>

                {/* Buttons */}
                <IonGrid style={{ padding: '16px 0 0 0' }}>
                  <IonRow>
                    <IonCol size="6">
                      <IonButton
                        expand="block"
                        color="medium"
                        onClick={handleCancel}
                        className="cancel-button"
                      >
                        Cancel
                      </IonButton>
                    </IonCol>
                    <IonCol size="6">
                      <IonButton
                        expand="block"
                        color="success"
                        onClick={handleUpdate}
                        disabled={saving || !newPassword || !confirmPassword}
                        className="save-button"
                      >
                        {saving ? 'Updating...' : 'Update Password'}
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
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

        <IonToast isOpen={toast.open} onDidDismiss={() => setToast({ open: false, msg: '' })} message={toast.msg} duration={2200} color={toast.color} />
      </IonContent>
    </IonPage>
  );
};

export default PasswordSecurity;
