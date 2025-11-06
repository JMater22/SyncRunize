import React, { useEffect, useState } from "react";
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
import { UsersApi } from "../services/users";


const EditProfile: React.FC = () => {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [description, setDescription] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(ProfilePic);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await UsersApi.me();
        setName(me.name || "");
        setGender((me.gender as any) || '');
        setDescription(me.description || "");
      } catch (e) {
        // ignore; show empty
      }
    })();
  }, []);

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

  const handleDone = async () => {
    if (!name.trim()) {
      setToastMessage("Please enter your name");
      setShowToast(true);
      return;
    }
    try {
      setSaving(true);
      await UsersApi.updateMe({ name, gender: gender || null, description });
      setToastMessage("Profile updated successfully!");
      setShowToast(true);
    } catch (e: any) {
      setToastMessage(e?.message || 'Failed to update profile');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
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
          {/* Name */}
          <IonItem className="form-group full-width">
            <IonLabel position="stacked">Name</IonLabel>
            <IonInput
              value={name}
              placeholder="Enter your name"
              onIonInput={(e) => setName(e.detail.value!)}
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
            </IonSelect>
          </IonItem>

          {/* Description */}
          <IonItem className="form-group full-width">
            <IonLabel position="stacked">Bio</IonLabel>
            <IonInput
              value={description}
              placeholder="Tell others about you"
              onIonInput={(e) => setDescription(e.detail.value!)}
            />
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
