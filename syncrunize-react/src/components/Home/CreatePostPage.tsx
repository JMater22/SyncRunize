import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonTextarea,
  IonAvatar,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import {
  close,
  imageOutline,
  locationOutline,
  happyOutline,
  checkmark,
  globeOutline,
  lockClosedOutline,
} from "ionicons/icons";

import "./CreatePostPage.css"; 
interface CreatePostPageProps {
  userName: string;
  userAvatar: string;
  onClose: () => void;
  onSubmit: (content: string, privacy: string) => void;
}

const CreatePostPage: React.FC<CreatePostPageProps> = ({
  userName,
  userAvatar,
  onClose,
  onSubmit,
}) => {
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<string>("public");

  const handleSubmit = () => {
    if (postContent.trim()) {
      onSubmit(postContent, privacy);
      setPostContent("");
      setSelectedImage(null);
      onClose();
    }
  };

  const handleImageSelect = () => {
    console.log("Image selection triggered");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="create-post-toolbar">
          <IonTitle>Create Post</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="create-post-content">
        <div className="create-post-container">
          {/* User Info with Privacy Control */}
          <div className="post-user-section">
            <IonAvatar className="post-user-avatar">
              <img src={userAvatar} alt={userName} />
            </IonAvatar>
            <div className="post-user-info">
              <h3 className="post-user-name">{userName}</h3>
              <IonSelect
                value={privacy}
                onIonChange={(e) => setPrivacy(e.detail.value)}
                interface="popover"
                className="privacy-select"
              >
                <IonSelectOption value="public">
                  <div className="privacy-option">
                    <IonIcon icon={globeOutline} />
                    <span>Public</span>
                  </div>
                </IonSelectOption>
                <IonSelectOption value="private">
                  <div className="privacy-option">
                    <IonIcon icon={lockClosedOutline} />
                    <span>Private</span>
                  </div>
                </IonSelectOption>
              </IonSelect>
            </div>
          </div>

          {/* Post Content */}
          <div className="post-textarea-container">
            <IonTextarea
              value={postContent}
              onIonInput={(e) => setPostContent(e.detail.value || "")}
              placeholder="What's on your mind?"
              autoGrow={true}
              rows={6}
              className="post-textarea"
            />
          </div>

          {/* Image Preview */}
          {selectedImage && (
            <div className="image-preview-container">
              <img src={selectedImage} alt="Preview" className="image-preview" />
              <IonButton
                fill="clear"
                className="remove-image-btn"
                onClick={() => setSelectedImage(null)}
              >
                <IonIcon icon={close} />
              </IonButton>
            </div>
          )}

          {/* Action Buttons */}
          <div className="post-actions-section">
            <div className="post-actions-title">Add to your post</div>
            <div className="post-actions-buttons">
              <IonButton
                fill="clear"
                className="action-option-btn photo"
                onClick={handleImageSelect}
              >
                <IonIcon icon={imageOutline} />
                <span>Photo</span>
              </IonButton>

              <IonButton fill="clear" className="action-option-btn location">
                <IonIcon icon={locationOutline} />
                <span>Location</span>
              </IonButton>

              <IonButton fill="clear" className="action-option-btn emoji">
                <IonIcon icon={happyOutline} />
                <span>Feeling</span>
              </IonButton>
            </div>
          </div>

          {/* Cancel and Post Buttons */}
          <div className="post-action-buttons">
            <IonButton
              expand="block"
              fill="outline"
              onClick={onClose}
              className="cancel-btn"
            >
              Cancel
            </IonButton>
            <IonButton
              expand="block"
              fill="solid"
              onClick={handleSubmit}
              disabled={!postContent.trim()}
              className="submit-post-btn"
            >
              <IonIcon icon={checkmark} slot="start" />
              Post
            </IonButton>
          </div>
        </div>
      </IonContent>
      </IonPage>
  );
};

export default CreatePostPage;