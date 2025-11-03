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
  IonToast,
  IonActionSheet,
  IonIcon,
} from "@ionic/react";
import { camera, images, close } from "ionicons/icons";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import '../theme/Edit-Profile.css';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';


const EditProfile: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(ProfilePic);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showActionSheet, setShowActionSheet] = useState(false);

  /** 📸 Select Photo - Android Platform */
  const selectPhoto = async (source: CameraSource) => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: source,
        quality: 90,
        allowEditing: true,
        width: 600,
        height: 600,
      });

      if (photo.webPath) {
        setProfilePhoto(photo.webPath);
        setToastMessage("Profile photo updated!");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      setToastMessage("Failed to select photo.");
      setShowToast(true);
    }
  };

  const handlePhotoButtonClick = () => {
    setShowActionSheet(true);
  };

  const handleDone = () => {
    // Validate and save profile data
    if (!firstName.trim() || !lastName.trim()) {
      setToastMessage("Please enter your first and last name");
      setShowToast(true);
      return;
    }

    console.log('Saving profile:', {
      firstName,
      lastName,
      city,
      state,
      birthdate,
      gender,
      profilePhoto
    });

    setToastMessage("Profile updated successfully!");
    setShowToast(true);

    // Navigate back after a short delay
    // setTimeout(() => history.push('/'), 1500);
  };

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
            <IonButton strong={true} onClick={handleDone}>
              Done
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
      <IonContent className="ion-padding">
        {/* Profile Photo */}
        <div className="profile-photo-section">
          <div className="profile-photo-container">
            <IonImg
              src={profilePhoto}
              alt="Profile Photo"
              className="profile-photo"
            />
            <IonButton
              className="edit-photo-btn"
              size="small"
              fill="clear"
              onClick={handlePhotoButtonClick}
            >
              📷
            </IonButton>
          </div>
        </div>

        {/* Android Action Sheet for Photo Selection */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: "Take Photo",
              icon: camera,
              handler: () => {
                selectPhoto(CameraSource.Camera);
              },
            },
            {
              text: "Choose from Gallery",
              icon: images,
              handler: () => {
                selectPhoto(CameraSource.Photos);
              },
            },
            {
              text: "Cancel",
              icon: close,
              role: "cancel",
            },
          ]}
        />

        {/* Edit Form */}
        <form className="edit-form">
          {/* Name Fields */}
          <div className="form-row">
            <IonItem className="form-group">
              <IonLabel position="stacked">First Name</IonLabel>
              <IonInput
                value={firstName}
                placeholder="Enter first name"
                onIonInput={(e) => setFirstName(e.detail.value!)}
              />
            </IonItem>

            <IonItem className="form-group">
              <IonLabel position="stacked">Last Name</IonLabel>
              <IonInput
                value={lastName}
                placeholder="Enter last name"
                onIonInput={(e) => setLastName(e.detail.value!)}
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
                onIonInput={(e) => setCity(e.detail.value!)}
              />
            </IonItem>

            <IonItem className="form-group">
              <IonLabel position="stacked">State</IonLabel>
              <IonInput
                value={state}
                placeholder="Enter state"
                onIonInput={(e) => setState(e.detail.value!)}
              />
            </IonItem>
          </div>

          {/* Birthdate */}
          <IonItem className="form-group full-width">
            <IonLabel position="stacked">Birthdate</IonLabel>
            <IonInput
              type="date"
              value={birthdate}
              onIonInput={(e) => setBirthdate(e.detail.value!)}
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

        {/* Toast Feedback */}
        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;