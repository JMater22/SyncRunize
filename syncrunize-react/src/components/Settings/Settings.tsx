import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonList,
  IonListHeader,
  IonInput,
} from "@ionic/react";
import { close, lockClosed, globe, informationCircleOutline, saveOutline } from "ionicons/icons";
import { supabase } from "../../supabaseClient";
import axios from "axios";
import "./Settings.css";

interface SettingsProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  currentUser: any;
  onSettingsUpdate: (settings: any) => void;
}

const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onDidDismiss,
  currentUser,
  onSettingsUpdate,
}) => {
  // Settings state
  const [activitiesVisibility, setActivitiesVisibility] = useState<"public" | "private">("public");

  // Profile state
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");

  // Load current user data
  useEffect(() => {
    if (currentUser) {
      setActivitiesVisibility(currentUser.activities_visibility || "public");
      setName(currentUser.name || "");
      setWeight(currentUser.weight_kg?.toString() || "");
      setGender(currentUser.gender || "");
      setLocation(currentUser.location || "");
    }
  }, [currentUser]);

  const handleSaveAccountSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        showToastMessage("Not authenticated", "danger");
        return;
      }

      const accountUpdates: any = {};
      if (name && name.trim() && name !== currentUser?.name) accountUpdates.name = name;
      if (weight && !isNaN(parseFloat(weight)) && parseFloat(weight) !== currentUser?.weight_kg) {
        accountUpdates.weight_kg = parseFloat(weight);
      }
      if (gender && gender !== currentUser?.gender) accountUpdates.gender = gender;
      if (location && location !== currentUser?.location) accountUpdates.location = location;

      if (Object.keys(accountUpdates).length === 0) {
        showToastMessage("No changes to save", "danger");
        return;
      }

      await axios.put(
        `${import.meta.env.VITE_API_URL}/users/settings/account`,
        accountUpdates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSettingsUpdate(accountUpdates);
      showToastMessage("Account settings saved successfully", "success");
    } catch (error: any) {
      console.error("Error saving account settings:", error);
      const errorMessage = error.response?.data?.error || "Failed to save account settings";
      showToastMessage(errorMessage, "danger");
    }
  };

  const handlePrivacyToggle = async (checked: boolean) => {
    const newVisibility = checked ? "public" : "private";
    setActivitiesVisibility(newVisibility);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        showToastMessage("Not authenticated", "danger");
        return;
      }

      await axios.put(
        `${import.meta.env.VITE_API_URL}/users/settings/privacy`,
        { activities_visibility: newVisibility },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSettingsUpdate({ activities_visibility: newVisibility });
      showToastMessage(`Activities set to ${newVisibility}`, "success");
    } catch (error: any) {
      console.error("Error updating privacy:", error);
      setActivitiesVisibility(currentUser?.activities_visibility || "public");
      showToastMessage("Failed to update privacy settings", "danger");
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      showToastMessage("Please fill in all password fields", "danger");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToastMessage("Passwords do not match", "danger");
      return;
    }

    if (newPassword.length < 6) {
      showToastMessage("Password must be at least 6 characters", "danger");
      return;
    }

    try {
      const { data: sessionResp } = await supabase.auth.getSession();
      const session = sessionResp?.session;
      if (!session) {
        showToastMessage("Session expired. Please log in again.", "danger");
        return;
      }

      const { data: userResp } = await supabase.auth.getUser();
      const provider = userResp?.user?.app_metadata?.provider;
      if (provider && provider !== 'email') {
        showToastMessage(`Cannot change password for ${provider} sign-in.`, "danger");
        return;
      }

      let { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error && (error.status === 401 || /token/i.test((error as any).message || ""))) {
        await supabase.auth.refreshSession();
        ({ error } = await supabase.auth.updateUser({ password: newPassword }));
      }

      if (error) { throw error; }

      showToastMessage("Password updated successfully", "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Try to extract useful message fields from Supabase errors
      const anyErr = error as any;
      const msg = (anyErr?.error_description) ? anyErr.error_description : (anyErr?.message ? anyErr.message : "Failed to update password");
      console.error("Error updating password:", error);
      showToastMessage(msg, "danger");
    }
  };

  const showToastMessage = (message: string, color: "success" | "danger") => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss} className="settings-modal">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Settings</IonTitle>
            <IonButton slot="end" fill="clear" onClick={onDidDismiss}>
              <IonIcon icon={close} />
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent className="settings-content">
          <div className="settings-container">
            {/* Account Settings */}
            <IonList className="settings-section">
              <IonListHeader>
                <IonLabel>Account Settings</IonLabel>
              </IonListHeader>

              <IonItem>
                <IonLabel position="stacked">Name</IonLabel>
                <IonInput
                  value={name}
                  onIonChange={(e) => setName(e.detail.value || "")}
                  placeholder="Enter your name"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Weight (kg)</IonLabel>
                <IonInput
                  type="number"
                  value={weight}
                  onIonChange={(e) => setWeight(e.detail.value || "")}
                  placeholder="Enter your weight"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Gender</IonLabel>
                <IonSelect value={gender} onIonChange={(e) => setGender(e.detail.value)}>
                  <IonSelectOption value="male">Male</IonSelectOption>
                  <IonSelectOption value="female">Female</IonSelectOption>
                  <IonSelectOption value="other">Other</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Location</IonLabel>
                <IonInput
                  value={location}
                  onIonChange={(e) => setLocation(e.detail.value || "")} 
                  placeholder="Enter your location"
                />
              </IonItem>

              <div className="settings-button-group">
                <IonButton expand="block" color="primary" onClick={handleSaveAccountSettings}>
                  <IonIcon icon={saveOutline} slot="start" />
                  Save Account Settings
                </IonButton>
              </div>
            </IonList>

            {/* Privacy Controls */}
            <IonList className="settings-section">
              <IonListHeader>
                <IonLabel>
                  Privacy Controls
                  <IonIcon
                    icon={informationCircleOutline}
                    style={{ marginLeft: '8px', fontSize: '18px', cursor: 'pointer' }}
                    title="Public: Anyone can view your activities. Private: Only you can see your activities."
                  />
                </IonLabel>
              </IonListHeader>

              <IonItem>
                <IonIcon icon={activitiesVisibility === "public" ? globe : lockClosed} slot="start" />
                <IonLabel>
                  <h3>Activity Visibility</h3>
                  <p>{activitiesVisibility === "public" ? "Public - Anyone can see your activities" : "Private - Only you can see your activities"}</p>
                </IonLabel>
                <IonToggle
                  checked={activitiesVisibility === "public"}
                  onIonChange={(e) => handlePrivacyToggle(e.detail.checked)}
                />
              </IonItem>
            </IonList>
            <IonList className="settings-section">
              <IonListHeader>
                <IonLabel>Password & Security</IonLabel>
              </IonListHeader>

              <IonItem>
                <IonLabel position="stacked">New Password</IonLabel>
                <IonInput
                  type="password"
                  value={newPassword}
                  onIonChange={(e) => setNewPassword(e.detail.value || "")}
                  placeholder="Enter new password"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Confirm Password</IonLabel>
                <IonInput
                  type="password"
                  value={confirmPassword}
                  onIonChange={(e) => setConfirmPassword(e.detail.value || "")}
                  placeholder="Confirm new password"
                />
              </IonItem>

              <div className="settings-button-group">
                <IonButton expand="block" onClick={handlePasswordUpdate}>
                  Update Password
                </IonButton>
              </div>
            </IonList>
          </div>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        color={toastColor}
      />
    </>
  );
};

export default Settings;