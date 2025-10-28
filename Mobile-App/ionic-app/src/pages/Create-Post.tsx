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
import { imageOutline } from "ionicons/icons";
import "../theme/Create-Post.css";

const CreatePost: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle post creation
  const handleCreatePost = () => {
    if (!title.trim() || !description.trim()) {
      setToastMessage("Please fill in all fields before posting.");
      setShowToast(true);
      return;
    }

    // Simulate success
    setToastMessage("Post created successfully!");
    setShowToast(true);

    // Reset form
    setTitle("");
    setDescription("");
    setImage(null);

    // Navigate or handle upload here
    // history.push("/community/feed");
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
        <IonItem>
          <IonLabel position="stacked">Title</IonLabel>
          <IonInput
            value={title}
            onIonInput={(e) => setTitle(e.detail.value!)}
            placeholder="Enter post title"
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Description</IonLabel>
          <IonTextarea
            value={description}
            onIonInput={(e) => setDescription(e.detail.value!)}
            placeholder="Write something interesting..."
            rows={6}
          />
        </IonItem>

        <div className="image-upload-section">
          <IonButton
            expand="block"
            fill="outline"
            onClick={() => document.getElementById("imageUpload")?.click()}
          >
            <IonIcon slot="start" icon={imageOutline} />
            Add Image
          </IonButton>
          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />

          {image && (
            <div className="preview-container">
              <IonImg src={image} alt="Preview" className="preview-image" />
            </div>
          )}
        </div>

        <IonButton
          expand="block"
          className="create-post-btn"
          onClick={handleCreatePost}
        >
          Create Post
        </IonButton>

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
