import React, { useState, useEffect } from "react";
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
  IonSpinner,
  IonText,
} from "@ionic/react";
import { 
  cameraOutline, 
  lockClosedOutline, 
  globeOutline, 
  peopleOutline,
  documentTextOutline,
  checkmarkCircle,
  arrowBack,
  alertCircleOutline
} from "ionicons/icons";
import { supabase } from "../../supabaseClient";
import { useHistory } from "react-router-dom";
import "./CreateGroup.css";
import axios from "axios";

const CreateGroup: React.FC = () => {
  const history = useHistory();
  
  // Form states
  const [privacy, setPrivacy] = useState("public");
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  
  // User and loading states
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Toast states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("warning");

  // Fetch current user
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingUser(true);
        
        // Get session directly
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.error("No active session found");
          showToastMessage("Please log in to create a group", "danger");
          setTimeout(() => history.push("/login"), 2000);
          return;
        }

        const token = session.access_token;
        console.log("✅ Token obtained:", token.substring(0, 20) + "...");

        // Fetch user data from your API (matching profile page pattern)
        const { data: user } = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/me`, 
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("✅ User data fetched:", user);

        // Access user_id directly from user, not user.data.user_id
        if (user?.user_id) {
          setCurrentUserId(user.user_id);
          console.log("✅ Current user ID set:", user.user_id);
        } else {
          throw new Error("User ID not found in response");
        }
        
      } catch (error: any) {
        console.error("❌ Error fetching user data:", error);
        console.error("Error details:", error.response?.data || error.message);
        showToastMessage("Failed to load user information", "danger");
        setCurrentUserId(null);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, [history]);

  const showToastMessage = (message: string, color: "success" | "danger" | "warning" = "warning") => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToastMessage("Image size must be less than 5MB", "warning");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToastMessage("Please upload an image file", "warning");
      return;
    }

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `group-picture/${fileName}`;

      console.log("📤 Uploading file:", filePath);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("assets")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setCoverPhoto(publicUrl);

      console.log("✅ Group cover photo uploaded:", publicUrl);
      showToastMessage("Cover photo uploaded successfully!", "success");
      
    } catch (err: any) {
      console.error("❌ Error uploading group cover photo:", err);
      showToastMessage(err.message || "Failed to upload image", "danger");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateGroup = async () => {
    // Validation
    if (!groupName.trim()) {
      showToastMessage("Please enter a group name", "warning");
      return;
    }

    if (!description.trim()) {
      showToastMessage("Please enter a description", "warning");
      return;
    }

    if (!currentUserId) {
      showToastMessage("User not authenticated. Please log in.", "danger");
      return;
    }

    try {
      setIsCreating(true);

      // Get fresh session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Session expired. Please log in again.");
      }

      const token = session.access_token;

      // Convert privacy string to boolean
      const isPrivate = privacy === "private";
      
      const payload = {
        name: groupName.trim(),
        description: description.trim(),
        privacy: isPrivate,
        group_picture: coverPhoto || undefined, // Don't send null
      };

      console.log("📤 Creating group with payload:", payload);
      console.log("📤 User ID:", currentUserId);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/groups/create/${currentUserId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Group created:", response.data);
      showToastMessage("Group created successfully!", "success");

      // Redirect to the group page after a short delay
      setTimeout(() => {
        if (response.data?.group?.group_id) {
          history.push(`/group/${response.data.group.group_id}`);
        } else {
          history.push("/community");
        }
      }, 1500);

    } catch (error: any) {
      console.error("❌ Error creating group:", error);
      console.error("Error response:", error.response?.data);
      
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          "Failed to create group";
      showToastMessage(errorMessage, "danger");
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading spinner while fetching user
  if (isLoadingUser) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="custom-header">
            <IonTitle className="header-title">Create Group</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ marginTop: "50%", transform: "translateY(-50%)" }}>
            <IonSpinner name="crescent" style={{ width: "50px", height: "50px" }} />
            <IonText>
              <p>Loading user information...</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Show error if user couldn't be loaded
  if (!currentUserId) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="custom-header">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/community" icon={arrowBack} />
            </IonButtons>
            <IonTitle className="header-title">Create Group</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ marginTop: "30%", padding: "20px" }}>
            <IonIcon 
              icon={alertCircleOutline} 
              style={{ fontSize: "64px", color: "var(--ion-color-danger)" }}
            />
            <IonText color="danger">
              <h2>Authentication Required</h2>
              <p>Please log in to create a group.</p>
            </IonText>
            <IonButton 
              routerLink="/login" 
              style={{ marginTop: "20px" }}
            >
              Go to Login
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="custom-header">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/community" icon={arrowBack} />
          </IonButtons>
          <IonTitle className="header-title">Create Group</IonTitle>
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
                    className={`cover-photo-upload ${coverPhoto ? 'has-image' : ''} ${isUploading ? 'uploading' : ''}`}
                    onClick={() => !isUploading && document.getElementById('file-input')?.click()}
                    style={coverPhoto ? { backgroundImage: `url(${coverPhoto})` } : {}}
                  >
                    {isUploading ? (
                      <div className="upload-spinner">
                        <IonSpinner name="crescent" />
                        <span>Uploading...</span>
                      </div>
                    ) : !coverPhoto ? (
                      <>
                        <IonIcon icon={cameraOutline} className="upload-icon" />
                        <span className="upload-text">Upload Cover Photo</span>
                        <span className="upload-subtext">Click to browse files (Max 5MB)</span>
                      </>
                    ) : (
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
                    disabled={isUploading}
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
                        <IonLabel className="field-label">
                          Group Name <span style={{ color: 'red' }}>*</span>
                        </IonLabel>
                      </div>
                      <IonInput
                        className="custom-input"
                        placeholder="Enter your group name"
                        value={groupName}
                        onIonInput={(e) => setGroupName(e.detail.value!)}
                        clearInput
                        maxlength={100}
                        counter={true}
                      />
                      <p className="field-hint">Choose a memorable name that represents your community</p>
                    </div>

                    {/* Description */}
                    <div className="form-field">
                      <div className="field-header">
                        <IonIcon icon={documentTextOutline} className="field-icon" />
                        <IonLabel className="field-label">
                          Description <span style={{ color: 'red' }}>*</span>
                        </IonLabel>
                      </div>
                      <IonTextarea
                        className="custom-textarea"
                        rows={6}
                        placeholder="Describe your group's purpose, activities, and what makes it special..."
                        value={description}
                        onIonInput={(e) => setDescription(e.detail.value!)}
                        maxlength={500}
                        counter={true}
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
                      disabled={isCreating}
                    >
                      Cancel
                    </IonButton>
                    <IonButton 
                      className="create-btn"
                      onClick={handleCreateGroup}
                      disabled={isCreating || isUploading || !groupName.trim() || !description.trim()}
                    >
                      {isCreating ? (
                        <>
                          <IonSpinner name="crescent" slot="start" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <IonIcon icon={checkmarkCircle} slot="start" />
                          Create Group
                        </>
                      )}
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
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default CreateGroup;