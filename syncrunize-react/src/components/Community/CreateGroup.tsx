import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonTextarea,
  IonButton,
  IonRadioGroup,
  IonRadio,
  IonLabel,
  IonItem,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
  IonToast,
} from "@ionic/react";
import { 
  cameraOutline, 
  lockClosedOutline, 
  globeOutline, 
  peopleOutline,
  locationOutline,
  documentTextOutline,
  checkmarkCircle,
  arrowBack
} from "ionicons/icons";

import "./CreateGroup.css";

const CreateGroup: React.FC = () => {
  const [privacy, setPrivacy] = useState("public");
  const [groupName, setGroupName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGroup = () => {
    if (!groupName || !location || !description) {
      setShowToast(true);
      return;
    }
    // Handle group creation logic here
    console.log({ groupName, location, description, privacy, coverPhoto });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="custom-header">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/community" icon={arrowBack} />
          </IonButtons>
          <IonTitle className="header-title">Create Groups</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="create-group-content">
        <IonGrid className="main-grid">
          <IonRow>
            {/* Left Panel */}
            <IonCol size="12" sizeMd="5" className="left-column">
              {/* Cover Photo Section */}
              <IonCard className="cover-photo-card">
                <IonCardContent>
                  <div className="section-header">
                    <IonIcon icon={cameraOutline} className="section-icon" />
                    <h3 className="section-title">Cover Photo</h3>
                  </div>
                  
                  <div 
                    className={`cover-photo-upload ${coverPhoto ? 'has-image' : ''}`}
                    onClick={() => document.getElementById('file-input')?.click()}
                    style={coverPhoto ? { backgroundImage: `url(${coverPhoto})` } : {}}
                  >
                    {!coverPhoto && (
                      <>
                        <IonIcon icon={cameraOutline} className="upload-icon" />
                        <span className="upload-text">Upload Cover Photo</span>
                        <span className="upload-subtext">Click to browse files</span>
                      </>
                    )}
                    {coverPhoto && (
                      <div className="photo-overlay">
                        <IonIcon icon={cameraOutline} />
                        <span>Change Photo</span>
                      </div>
                    )}
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </IonCardContent>
              </IonCard>

              {/* Privacy Settings */}
              <IonCard className="privacy-card">
                <IonCardContent>
                  <div className="section-header">
                    <IonIcon icon={lockClosedOutline} className="section-icon" />
                    <h3 className="section-title">Privacy Settings</h3>
                  </div>
                  
                  <IonRadioGroup
                    value={privacy}
                    onIonChange={(e) => setPrivacy(e.detail.value)}
                    className="privacy-radio-group"
                  >
                    <div className={`privacy-option ${privacy === 'public' ? 'selected' : ''}`}>
                      <IonItem lines="none" className="privacy-item">
                        <IonIcon icon={globeOutline} slot="start" className="privacy-icon" />
                        <IonLabel>
                          <h3 className="privacy-title">Public</h3>
                          <p className="privacy-desc">Anyone can find and join</p>
                        </IonLabel>
                        <IonRadio slot="end" value="public" />
                      </IonItem>
                    </div>
                    
                    <div className={`privacy-option ${privacy === 'private' ? 'selected' : ''}`}>
                      <IonItem lines="none" className="privacy-item">
                        <IonIcon icon={peopleOutline} slot="start" className="privacy-icon" />
                        <IonLabel>
                          <h3 className="privacy-title">Private</h3>
                          <p className="privacy-desc">Invite only - requires approval</p>
                        </IonLabel>
                        <IonRadio slot="end" value="private" />
                      </IonItem>
                    </div>
                  </IonRadioGroup>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Right Panel */}
            <IonCol size="12" sizeMd="7" className="right-column">
              <IonCard className="form-card">
                <IonCardContent>
                  <div className="form-fields">
                    {/* Group Name */}
                    <div className="form-field">
                      <div className="field-header">
                        <IonIcon icon={peopleOutline} className="field-icon" />
                        <IonLabel className="field-label">Group Name</IonLabel>
                      </div>
                      <IonInput
                        className="custom-input"
                        placeholder="Enter your group name"
                        value={groupName}
                        onIonInput={(e) => setGroupName(e.detail.value!)}
                        clearInput
                      />
                      <p className="field-hint">Choose a memorable name that represents your community</p>
                    </div>

                    {/* Location */}
                    <div className="form-field">
                      <div className="field-header">
                        <IonIcon icon={locationOutline} className="field-icon" />
                        <IonLabel className="field-label">Location</IonLabel>
                      </div>
                      <IonInput
                        className="custom-input"
                        placeholder="City, Province, Country"
                        value={location}
                        onIonInput={(e) => setLocation(e.detail.value!)}
                        clearInput
                      />
                      <p className="field-hint">Help members find local running groups</p>
                    </div>

                    {/* Description */}
                    <div className="form-field">
                      <div className="field-header">
                        <IonIcon icon={documentTextOutline} className="field-icon" />
                        <IonLabel className="field-label">Description</IonLabel>
                      </div>
                      <IonTextarea
                        className="custom-textarea"
                        rows={6}
                        placeholder="Describe your group's purpose, activities, and what makes it special..."
                        value={description}
                        onIonInput={(e) => setDescription(e.detail.value!)}
                      />
                      <p className="field-hint">Share your mission and what new members can expect</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <IonButton 
                      fill="outline" 
                      className="cancel-btn"
                      routerLink="/community"
                    >
                      Cancel
                    </IonButton>
                    <IonButton 
                      className="create-btn"
                      onClick={handleCreateGroup}
                    >
                      <IonIcon icon={checkmarkCircle} slot="start" />
                      Create Group
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Please fill in all required fields"
          duration={3000}
          color="warning"
        />
      </IonContent>
    </IonPage>
  );
};
 
export default CreateGroup;
