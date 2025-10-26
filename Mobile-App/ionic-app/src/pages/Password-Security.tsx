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
} from "@ionic/react";
import { lockClosed, search } from "ionicons/icons";
import "../theme/Password-Security.css"; // custom CSS for styling

const PasswordSecurity: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleUpdate = () => {
    console.log("Updating password:", { currentPassword, newPassword });
    // Add update logic here
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
        {/* Current Password */}
        <IonItem className="profile-input">
          <IonIcon icon={lockClosed} slot="start" className="profile-icon" />
          <IonLabel position="stacked">Current Password</IonLabel>
          <IonInput
            type="password"
            value={currentPassword}
            onIonInput={(e) => setCurrentPassword(e.detail.value!)}
            placeholder=""
          />
        </IonItem>

        {/* New Password */}
        <IonItem className="profile-input">
          <IonIcon icon={search} slot="start" className="profile-icon" />
          <IonLabel position="stacked">New Password</IonLabel>
          <IonInput
            type="password"
            value={newPassword}
            onIonInput={(e) => setNewPassword(e.detail.value!)}
            placeholder=""
          />
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
                className="save-button"
              >
                Update Changes
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
             
      </IonContent>
    </IonPage>
  );
};

export default PasswordSecurity;
