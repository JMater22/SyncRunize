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
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonToast,
  IonActionSheet,
  IonIcon,
  IonAvatar,
  IonImg,
  IonSpinner,
} from "@ionic/react";
import { camera, images, close, checkmark } from "ionicons/icons";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "../contexts/UserContext";
import { getAvatarUrl } from "../lib/utils";
import '../theme/Edit-Profile.css';

const EditProfile: React.FC = () => {
  const { currentUser, refreshUser } = useUser();

  // Form state matching web version
  const [editForm, setEditForm] = useState({
    Name: "",
    description: "",
    profilePic: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setEditForm({
        Name: currentUser.name || "",
        description: currentUser.description || "",
        profilePic: getAvatarUrl(currentUser.profile_picture),
      });
    }
  }, [currentUser]);

  /** 📸 Upload photo to Supabase Storage */
  const handleImageSelection = async (source: CameraSource) => {
    try {
      setUploading(true);

      // Get photo from camera or gallery
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: source,
        quality: 90,
        allowEditing: true,
        width: 600,
        height: 600,
      });

      if (!photo.dataUrl) {
        throw new Error("No image data");
      }

      // Convert data URL to blob
      const response = await fetch(photo.dataUrl);
      const blob = await response.blob();

      // Create file with timestamp
      const fileExt = 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase Storage (bucket: assets)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("assets")
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("assets")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update form preview
      setEditForm((prev) => ({ ...prev, profilePic: publicUrl }));

      setToastMessage("Profile photo uploaded!");
      setToastColor('success');
      setShowToast(true);
    } catch (error: any) {
      console.error("Photo upload error:", error);
      setToastMessage(error?.message || "Failed to upload photo");
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setUploading(false);
      setShowActionSheet(false);
    }
  };

  /** 💾 Save profile changes - matching web implementation */
  const handleSaveProfile = async () => {
    if (!editForm.Name.trim()) {
      setToastMessage("Please enter your name");
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      setSaving(true);

      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("No active session");

      // Prepare payload (match backend field names) - EXACTLY like web
      const updateData = {
        name: editForm.Name,
        description: editForm.description,
        profile_picture: editForm.profilePic,
      };

      // Send update request to same endpoint as web
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/update-me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();

      // Refresh user context to get latest data
      if (refreshUser) {
        await refreshUser();
      }

      setToastMessage("Profile updated successfully!");
      setToastColor('success');
      setShowToast(true);

      // Navigate back after short delay
      setTimeout(() => {
        window.history.back();
      }, 1000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setToastMessage(error?.message || 'Failed to update profile');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    window.history.back();
  };

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="dark-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" text="" />
          </IonButtons>
          <IonTitle>Edit Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleCancel}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
      <IonContent className="edit-profile-content">
        <div className="edit-form-container">

          {/* Profile Picture Section */}
          <div className="edit-avatar-section">
            <IonAvatar className="edit-avatar">
              <IonImg src={editForm.profilePic} alt="Profile" />
            </IonAvatar>
            <IonButton
              fill="outline"
              size="small"
              className="change-photo-btn"
              onClick={() => setShowActionSheet(true)}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                  Uploading...
                </>
              ) : (
                <>
                  <IonIcon icon={camera} slot="start" />
                  Change Photo
                </>
              )}
            </IonButton>
          </div>

          {/* Form Fields */}
          <div className="edit-form-fields">
            <IonItem className="edit-form-item">
              <IonLabel position="stacked">Full Name</IonLabel>
              <IonInput
                value={editForm.Name}
                onIonInput={(e) => setEditForm({
                  ...editForm,
                  Name: e.detail.value!
                })}
                placeholder="Enter your name"
                className="edit-input"
              />
            </IonItem>

            <IonItem className="edit-form-item description-item">
              <IonLabel position="stacked">Description</IonLabel>
              <IonTextarea
                value={editForm.description}
                onIonInput={(e) => setEditForm({
                  ...editForm,
                  description: e.detail.value!
                })}
                placeholder="Tell us about yourself..."
                rows={3}
                className="edit-textarea"
              />
            </IonItem>
          </div>

          {/* Action Buttons */}
          <div className="edit-form-actions">
            <IonButton
              expand="block"
              fill="solid"
              onClick={handleSaveProfile}
              className="save-profile-btn"
              disabled={saving || uploading}
            >
              {saving ? (
                <>
                  <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                  Saving...
                </>
              ) : (
                <>
                  <IonIcon icon={checkmark} slot="start" />
                  Save Changes
                </>
              )}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              onClick={handleCancel}
              className="cancel-profile-btn"
              disabled={saving}
            >
              Cancel
            </IonButton>
          </div>
        </div>

        {/* Action Sheet for Photo Selection */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header="Change Profile Picture"
          buttons={[
            {
              text: "Take Photo",
              icon: camera,
              handler: () => {
                handleImageSelection(CameraSource.Camera);
              },
            },
            {
              text: "Choose from Gallery",
              icon: images,
              handler: () => {
                handleImageSelection(CameraSource.Photos);
              },
            },
            {
              text: "Cancel",
              icon: close,
              role: "cancel",
            },
          ]}
        />

        {/* Toast Feedback */}
        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;
