import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonButtons,
  IonBackButton,
  IonImg,
  IonIcon,
  IonToast,
} from "@ionic/react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { imageOutline, closeCircle } from "ionicons/icons";
import "../theme/Create-Post.css";

const CreatePost: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Take or pick a photo
  const handleAddPhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Allows choosing camera or gallery
      });

      if (photo?.dataUrl) {
        setImage(photo.dataUrl);
      }
    } catch (error) {
      console.error("Camera error:", error);
      showToastMessage("Failed to select photo.");
    }
  };

  const handleRemovePhoto = () => setImage(null);

  const handleCreatePost = () => {
    if (!title.trim() || !description.trim()) {
      return showToastMessage("Please fill in all fields before posting.");
    }

    console.log("Post created:", { title, description, image });
    showToastMessage("Post created successfully!");
    setTitle("");
    setDescription("");
    setImage(null);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  return (
    <IonPage className="create-post-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/community" />
          </IonButtons>
          <IonTitle>Create Post</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Title Field */}
        <IonItem>
          <IonLabel position="stacked">Title</IonLabel>
          <IonInput
            value={title}
            onIonInput={(e) => setTitle(e.detail.value ?? "")}
            placeholder="Enter post title"
          />
        </IonItem>

        {/* Description Field */}
        <IonItem>
          <IonLabel position="stacked">Description</IonLabel>
          <IonTextarea
            value={description}
            onIonInput={(e) => setDescription(e.detail.value ?? "")}
            placeholder="Write something interesting..."
            rows={6}
          />
        </IonItem>

        {/* Image Upload Section */}
        <div className="image-upload-section">
          {!image ? (
            <IonButton expand="block" fill="outline" onClick={handleAddPhoto}>
              <IonIcon slot="start" icon={imageOutline} />
              Add Image
            </IonButton>
          ) : (
            <div className="preview-container">
              <IonImg src={image} alt="Preview" className="preview-image" />
              <IonButton
                fill="clear"
                className="remove-image-btn"
                onClick={handleRemovePhoto}
              >
                <IonIcon icon={closeCircle} color="light" style={{ fontSize: "32px" }} />
              </IonButton>
            </div>
          )}
        </div>

        {/* Create Post Button */}
        <IonButton expand="block" onClick={handleCreatePost}>
          Create Post
        </IonButton>

        {/* Toast Notification */}
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

export default CreatePost;
