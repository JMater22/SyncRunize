import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonItem,
  IonInput,
  IonLabel,
  IonIcon,
  IonButton, IonCol, IonGrid, IonRow
} from "@ionic/react";
import { person, mail, call, location } from "ionicons/icons";
import "../theme/Profile-Information.css";
import "../theme/global.css";

const ProfileInformation: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handleSave = () => {
    console.log("Saving profile:", { fullName, email, phone, address });
    // Add save logic here
  };

  const handleCancel = () => {
    console.log("Cancelled");
    // Add cancel logic here
  };

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar >
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Profile Information</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Content */}
      <IonContent  className="ion-padding dark-content">
        {/* Full Name */}
        <IonItem className="profile-input">
          <IonIcon color="success" icon={person} slot="start" className="profile-icon" />
          <IonLabel position="stacked">Full Name</IonLabel>
          <IonInput
            value={fullName}
            onIonInput={(e) => setFullName(e.detail.value!)}
            placeholder=""
          />
        </IonItem>

        {/* Email Address */}
        <IonItem className="profile-input">
          <IonIcon color="success" icon={mail} slot="start" className="profile-icon" />
          <IonLabel position="stacked">Email Address</IonLabel>
          <IonInput
            type="email"
            value={email}
            onIonInput={(e) => setEmail(e.detail.value!)}
            placeholder=""
          />
        </IonItem>

        {/* Phone Number */}
        <IonItem className="profile-input">
          <IonIcon color="success" icon={call} slot="start" className="profile-icon" />
          <IonLabel position="stacked">Phone Number</IonLabel>
          <IonInput
            type="tel"
            value={phone}
            onIonInput={(e) => setPhone(e.detail.value!)}
            placeholder=""
          />
        </IonItem>

        {/* Address */}
        <IonItem className="profile-input">
          <IonIcon color="success" icon={location} slot="start" className="profile-icon" />
          <IonLabel position="stacked">Address</IonLabel>
          <IonInput
            value={address}
            onIonInput={(e) => setAddress(e.detail.value!)}
            placeholder=""
          />
        </IonItem>

       
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
        onClick={handleSave}
        className="save-button"
      >
        Save Changes
      </IonButton>
    </IonCol>
  </IonRow>
</IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default ProfileInformation;
