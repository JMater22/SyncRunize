import React, { useState } from "react";
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
  IonIcon as IonIconEl
} from "@ionic/react";
import { lockClosed, keyOutline, eyeOutline, eyeOffOutline } from "ionicons/icons";
import "../theme/Password-Security.css"; // custom CSS for styling
import { supabase } from "../lib/supabaseClient";

const PasswordSecurity: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; msg: string; color?: string }>({ open: false, msg: "" });

  const handleUpdate = async () => {
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
      // Since the user is already authenticated, Supabase can update without email confirmation
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setToast({ open: true, msg: error.message, color: "danger" });
        return;
      }
      setToast({ open: true, msg: "Password updated successfully", color: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Optional: Sign out globally to force re-login on all devices
      // await supabase.auth.signOut({ scope: 'global' });
    } catch (e: any) {
      setToast({ open: true, msg: e?.message || "Failed to update password", color: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    console.log("Cancelled");
    // Add cancel logic here
  };

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings" />
          </IonButtons>
          <IonTitle>Password & Security</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Content */}
      <IonContent className="ion-padding dark-content">
        {/* Current Password (optional UI-only for user feedback) */}
        <IonItem className="profile-input">
          <IonIcon icon={lockClosed} slot="start" className="profile-icon" />
          <IonLabel position="stacked">Current Password (optional)</IonLabel>
          <IonInput
            type="password"
            value={currentPassword}
            onIonInput={(e) => setCurrentPassword(e.detail.value!)}
            placeholder=""
          />
        </IonItem>

        {/* New Password */}
        <IonItem className="profile-input">
          <IonIcon icon={keyOutline} slot="start" className="profile-icon" />
          <IonLabel position="stacked">New Password</IonLabel>
          <IonInput
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onIonInput={(e) => setNewPassword(e.detail.value!)}
            placeholder=""
          />
          <IonButton slot="end" fill="clear" onClick={() => setShowNew(s => !s)}>
            <IonIconEl icon={showNew ? eyeOffOutline : eyeOutline} />
          </IonButton>
        </IonItem>

        <IonItem className="profile-input">
          <IonIcon icon={keyOutline} slot="start" className="profile-icon" />
          <IonLabel position="stacked">Confirm New Password</IonLabel>
          <IonInput
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onIonInput={(e) => setConfirmPassword(e.detail.value!)}
            placeholder=""
          />
          <IonButton slot="end" fill="clear" onClick={() => setShowConfirm(s => !s)}>
            <IonIconEl icon={showConfirm ? eyeOffOutline : eyeOutline} />
          </IonButton>
        </IonItem>

        {/* Buttons */}
         {/* Buttons */}
        <IonGrid className="dark-content">
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
                disabled={saving}
                className="save-button"
              >
                {saving ? 'Updating...' : 'Update Changes'}
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
             
      <IonToast isOpen={toast.open} onDidDismiss={() => setToast({ open: false, msg: '' })} message={toast.msg} duration={2200} color={toast.color} />
      </IonContent>
    </IonPage>
  );
};

export default PasswordSecurity;
