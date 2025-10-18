import React, { useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonAvatar,
  IonTextarea,
  IonIcon,
  IonRadio,
  IonRadioGroup,
} from "@ionic/react";
import {
  closeOutline,
  imageOutline,
  locationOutline,
  happyOutline,
  ellipsisHorizontal,
  personAddOutline,
} from "ionicons/icons";
import ProfilePic from "../../assets/Profile Picture.png";
import "./CreatePostModal.css";

interface CreatePostModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  userName: string;
}

type ModalStep = "post" | "audience";

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onDidDismiss,
  userName,
}) => {
  const [step, setStep] = useState<ModalStep>("post");
  const [postContent, setPostContent] = useState("");
  const [audience, setAudience] = useState<"public" | "private">("public");

  const handleClose = () => {
    setStep("post");
    setPostContent("");
    setAudience("public");
    onDidDismiss();
  };

  const handlePost = () => {
    console.log("Post content:", postContent);
    console.log("Audience:", audience);
    handleClose();
  };

  const handleBackToPost = () => {
    setStep("post");
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="create-post-modal">
      <IonHeader>
        <IonToolbar className="modal-toolbar">
          {step === "audience" && (
            <IonButton slot="start" fill="clear" onClick={handleBackToPost} className="back-btn">
              ←
            </IonButton>
          )}
          <IonTitle className="modal-title">
            {step === "post" ? "Create post" : "Post audience"}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleClose} className="close-btn">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="modal-content">
        {step === "post" ? (
          <div className="post-step">
            <div className="user-profile">
              <IonAvatar className="avatar-modal">
                <img src={ProfilePic} alt="User Avatar" />
              </IonAvatar>
              <div className="user-info">
                <span className="name-modal">{userName}</span>
                <IonButton
                  fill="solid"
                  size="small"
                  className="friends-btn"
                  onClick={() => setStep("audience")}
                >
                  👥 Friends
                </IonButton>
              </div>
            </div>

            <IonTextarea
              placeholder={`What's on your mind, ${userName}?`}
              value={postContent}
              onIonInput={(e) => setPostContent(e.detail.value!)}
              autoGrow={true}
              className="post-textarea"
              rows={1}
            />

            <div className="add-to-post">
              <span>Add to your post</span>
              <div className="media-icons">
                <button className="media-icon-btn" title="Photo/Video">
                  <IonIcon icon={imageOutline} />
                </button>
                <button className="media-icon-btn" title="Tag People">
                  <IonIcon icon={personAddOutline} />
                </button>
                <button className="media-icon-btn" title="Feeling/Activity">
                  <IonIcon icon={happyOutline} />
                </button>
                <button className="media-icon-btn" title="Check In">
                  <IonIcon icon={locationOutline} />
                </button>
                <button className="media-icon-btn more-btn" title="More">
                  <IonIcon icon={ellipsisHorizontal} />
                </button>
              </div>
            </div>

            <IonButton
              className="post-btn"
              disabled={!postContent.trim()}
              onClick={handlePost}
              expand="block"
            >
              Post
            </IonButton>
          </div>
        ) : (
          <div className="audience-step">
            <div className="audience-info">
              <h3>Who can see your post?</h3>
              <p>Your post will show up in Feed, on your profile and in search results.</p>
              <p>Your default audience is set to Friends, but you can change the audience of this specific post.</p>
            </div>

            <IonRadioGroup value={audience} onIonChange={(e) => setAudience(e.detail.value)}>
              <div className="radio-option">
                <div className="radio-content">
                  <div className="radio-icon">🌐</div>
                  <div className="radio-text">
                    <h4>Public</h4>
                    <p>Anyone on or off SyncRunize</p>
                  </div>
                </div>
                <IonRadio value="public" />
              </div>

              <div className="radio-option">
                <div className="radio-content">
                  <div className="radio-icon">👥</div>
                  <div className="radio-text">
                    <h4>Friends</h4>
                    <p>Your friends on SyncRunize</p>
                  </div>
                </div>
                <IonRadio value="friends" />
              </div>

              <div className="radio-option">
                <div className="radio-content">
                  <div className="radio-icon">🔒</div>
                  <div className="radio-text">
                    <h4>Only me</h4>
                    <p>Only you can see this post</p>
                  </div>
                </div>
                <IonRadio value="private" />
              </div>
            </IonRadioGroup>

            <div className="modal-actions">
              <IonButton fill="outline" onClick={handleBackToPost} expand="block">
                Cancel
              </IonButton>
              <IonButton className="done-btn" onClick={handleBackToPost} expand="block">
                Done
              </IonButton>
            </div>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default CreatePostModal;