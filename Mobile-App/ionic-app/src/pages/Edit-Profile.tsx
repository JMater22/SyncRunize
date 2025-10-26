import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonButton,
  IonContent,
  IonImg,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import '../theme/Edit-Profile.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';


const EditProfile: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Edit Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton strong={true}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
      <IonContent className="ion-padding">
        {/* Profile Photo */}
        <div className="profile-photo-section">
          <div className="profile-photo-container">
            <IonImg
              src={ProfilePic}
              alt="Profile Photo"
              className="profile-photo"
            />
            <IonButton className="edit-photo-btn" size="small" fill="clear">
              📷
            </IonButton>
          </div>
        </div>

        {/* Edit Form */}
        <form className="edit-form">
          {/* Name Fields */}
          <div className="form-row">
            <IonItem className="form-group">
              <IonLabel position="stacked">First Name</IonLabel>
              <IonInput
                value={firstName}
                placeholder="Enter first name"
                onIonChange={(e) => setFirstName(e.detail.value!)}
              />
            </IonItem>

            <IonItem className="form-group">
              <IonLabel position="stacked">Last Name</IonLabel>
              <IonInput
                value={lastName}
                placeholder="Enter last name"
                onIonChange={(e) => setLastName(e.detail.value!)}
              />
            </IonItem>
          </div>

          {/* Location Fields */}
          <div className="form-row">
            <IonItem className="form-group">
              <IonLabel position="stacked">City</IonLabel>
              <IonInput
                value={city}
                placeholder="Enter city"
                onIonChange={(e) => setCity(e.detail.value!)}
              />
            </IonItem>

            <IonItem className="form-group">
              <IonLabel position="stacked">State</IonLabel>
              <IonInput
                value={state}
                placeholder="Enter state"
                onIonChange={(e) => setState(e.detail.value!)}
              />
            </IonItem>
          </div>

          {/* Birthdate */}
          <IonItem className="form-group full-width">
            <IonLabel position="stacked">Birthdate</IonLabel>
            <IonInput
              type="date"
              value={birthdate}
              onIonChange={(e) => setBirthdate(e.detail.value!)}
            />
          </IonItem>

          {/* Gender */}
          <IonItem className="form-group full-width">
            <IonLabel position="stacked">Gender</IonLabel>
            <IonSelect
              value={gender}
              placeholder="Select gender"
              onIonChange={(e) => setGender(e.detail.value!)}
            >
              <IonSelectOption value="male">Male</IonSelectOption>
              <IonSelectOption value="female">Female</IonSelectOption>
              <IonSelectOption value="other">Other</IonSelectOption>
              <IonSelectOption value="prefer-not-to-say">
                Prefer not to say
              </IonSelectOption>
            </IonSelect>
          </IonItem>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;
