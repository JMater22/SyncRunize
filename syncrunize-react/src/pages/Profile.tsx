import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonImg,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonModal, 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonInput,
  IonTextarea,
  IonLabel,
  IonAvatar, 
  IonActionSheet,
  IonToast, 
  IonAlert
} from "@ionic/react";
import { settings, trophy, flame, statsChart, close, camera, checkmark, person, logOut } from "ionicons/icons";

import ProfilePic from "../assets/Profile Picture.png";
import Banner from "../assets/Banner UP.png";
import MapImage from "../assets/MAP 1.png";
import Badge from "../assets/1 MIlE BADGE.png";
import Challenges from "../assets/GROUP 5.png";

import "../components/UserProfile/UserProfile.css";

const Profile: React.FC = () => {
  const history = useHistory();
  const [activeTab, setActiveTab] = useState<"activities" | "badges" | "challenges">("activities");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");

  // Profile data state
  const [profileData, setProfileData] = useState({
    firstName: "Alexander",
    lastName: "Smith",
    description: "Running enthusiast • Fitness lover • Goal crusher",
    profilePic: ProfilePic
  });

  // Form state for editing
  const [editForm, setEditForm] = useState({ ...profileData });

  // Mock data for followers and following
  const [followersData, setFollowersData] = useState([
    { id: 1, name: "Sarah Johnson", username: "sarahj_runs", avatar: ProfilePic, isFollowing: true, mutualFollows: 3 },
    { id: 2, name: "Mike Chen", username: "mike_fitness", avatar: ProfilePic, isFollowing: false, mutualFollows: 1 },
    { id: 3, name: "Emma Wilson", username: "emma_marathon", avatar: ProfilePic, isFollowing: true, mutualFollows: 7 },
    { id: 4, name: "David Park", username: "david_trails", avatar: ProfilePic, isFollowing: false, mutualFollows: 2 },
    { id: 5, name: "Lisa Rodriguez", username: "lisa_5k", avatar: ProfilePic, isFollowing: true, mutualFollows: 5 },
    { id: 6, name: "Tom Anderson", username: "tom_cycling", avatar: ProfilePic, isFollowing: false, mutualFollows: 0 },
    { id: 7, name: "Rachel Green", username: "rachel_yoga", avatar: ProfilePic, isFollowing: true, mutualFollows: 4 },
    { id: 8, name: "James Wilson", username: "james_crossfit", avatar: ProfilePic, isFollowing: false, mutualFollows: 1 }
  ]);

  const [followingData, setFollowingData] = useState([
    { id: 1, name: "Nike Running", username: "nike_running", avatar: ProfilePic, isFollowing: true, mutualFollows: 15 },
    { id: 2, name: "Strava", username: "strava_official", avatar: ProfilePic, isFollowing: true, mutualFollows: 23 },
    { id: 3, name: "Runner's World", username: "runnersworld", avatar: ProfilePic, isFollowing: true, mutualFollows: 12 },
    { id: 4, name: "Maria Santos", username: "maria_ultra", avatar: ProfilePic, isFollowing: true, mutualFollows: 8 },
    { id: 5, name: "Fitness Guru", username: "fitness_guru", avatar: ProfilePic, isFollowing: true, mutualFollows: 6 },
    { id: 6, name: "Alex Turner", username: "alex_marathoner", avatar: ProfilePic, isFollowing: true, mutualFollows: 9 },
    { id: 7, name: "Running Coach", username: "coach_running", avatar: ProfilePic, isFollowing: true, mutualFollows: 11 },
    { id: 8, name: "Jane Smith", username: "jane_triathlon", avatar: ProfilePic, isFollowing: true, mutualFollows: 4 }
  ]);

  const handleFollowToggle = (userId: number, currentType: "followers" | "following") => {
    if (currentType === "followers") {
      setFollowersData(prevData => 
        prevData.map(user => 
          user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user
        )
      );
    } else {
      setFollowingData(prevData => 
        prevData.map(user => 
          user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user
        )
      );
    }
  };

  const openFollowersModal = (type: "followers" | "following") => {
    setFollowersModalType(type);
    setIsFollowersModalOpen(true);
  };

  const handleSaveProfile = () => {
    setProfileData({ ...editForm });
    setIsEditModalOpen(false);
    setShowToast(true);
  };

  const handleCancelEdit = () => {
    setEditForm({ ...profileData });
    setIsEditModalOpen(false);
  };

  const handleImageSelection = (source: string) => {
    console.log(`Image selected from: ${source}`);
    setIsActionSheetOpen(false);
  };

  const handleLogout = () => {
    console.log("User logged out");
    setShowLogoutAlert(false);
    history.push('/get-started');
  };

  return ( 
    <IonPage>
      <IonContent className="profile-content">
        <div className="profile-container">
          {/* Enhanced Profile Header */}
          <div className="profile-header-section">
            <div className="banner-container">
              <IonImg src={Banner} alt="User Banner" className="banner-image" />
              <div className="banner-overlay"></div>
            </div>
            
            <div className="profile-info-card">
              <div className="profile-avatar-container">
                <IonImg src={profileData.profilePic} alt="Profile" className="profile-avatar" />
                <div className="online-indicator"></div>
              </div>
              
              <div className="profile-details">
                <div className="profile-text">
                  <h1 className="profile-name">{profileData.firstName} {profileData.lastName}</h1>
                  <p className="profile-username">@{profileData.firstName.toLowerCase()}{profileData.lastName.toLowerCase()}</p>
                  <div className="profile-bio">
                    <span>{profileData.description}</span>
                  </div>
                </div>
                
                <div className="profile-stats-row">
                  <div 
                    className="stat-item clickable-stat" 
                    onClick={() => openFollowersModal("followers")}
                  >
                    <span className="stat-number">32</span>
                    <span className="stat-label">Followers</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div 
                    className="stat-item clickable-stat" 
                    onClick={() => openFollowersModal("following")}
                  >
                    <span className="stat-number">21</span>
                    <span className="stat-label">Following</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-number">156</span>
                    <span className="stat-label">Activities</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Navigation Tabs */}
            <div className="nav-tabs-container">
              <div className="nav-tabs">
                <button
                  className={`nav-tab ${activeTab === "activities" ? "active" : ""}`}
                  onClick={() => setActiveTab("activities")}
                >
                  <IonIcon icon={statsChart} />
                  <span>Activities</span>
                </button>
                <button
                  className={`nav-tab ${activeTab === "badges" ? "active" : ""}`}
                  onClick={() => setActiveTab("badges")}
                >
                  <IonIcon icon={trophy} />
                  <span>Badges</span>
                </button>
                <button
                  className={`nav-tab ${activeTab === "challenges" ? "active" : ""}`}
                  onClick={() => setActiveTab("challenges")}
                >
                  <IonIcon icon={flame} />
                  <span>Challenges</span>
                </button>
              </div>
            </div>
          </div>

          <IonGrid className="content-grid">
            <IonRow>
              {/* Enhanced Sidebar */}
              <IonCol size="12" sizeLg="3" className="sidebar-col">
                <div className="stats-sidebar">
                  <div className="stats-header">
                    <h3>Performance Stats</h3>
                  </div>
                  
                  <div className="stats-card weekly">
                    <div className="stats-card-header">
                      <h4>This Week</h4>
                      <span className="trend-indicator positive">+12%</span>
                    </div>
                    <div className="stats-list">
                      <div className="stats-item">
                        <div className="stats-content">
                          <span className="stats-label">Runs</span>
                          <span className="stats-value">3</span>
                        </div>
                      </div>
                      <div className="stats-item">
                        <div className="stats-content">
                          <span className="stats-label">Time</span>
                          <span className="stats-value">4h 22m</span>
                        </div>
                      </div>
                      <div className="stats-item">
                        <div className="stats-content">
                          <span className="stats-label">Distance</span>
                          <span className="stats-value">7.2 km</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="stats-card yearly">
                    <div className="stats-card-header">
                      <h4>Year to Date</h4>
                      <span className="trend-indicator positive">+28%</span>
                    </div>
                    <div className="stats-list">
                      <div className="stats-item">
                        <div className="stats-content">
                          <span className="stats-label">Total Runs</span>
                          <span className="stats-value">54</span>
                        </div>
                      </div>
                      <div className="stats-item">
                        <div className="stats-content">
                          <span className="stats-label">Total Time</span>
                          <span className="stats-value">234h 23m</span>
                        </div>
                      </div>
                      <div className="stats-item">
                        <div className="stats-content">
                          <span className="stats-label">Total Distance</span>
                          <span className="stats-value">387 km</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </IonCol>

              {/* Enhanced Main Content */}
              <IonCol size="12" sizeLg="9" className="main-content-col">
                {/* Activities Section */}
                {activeTab === "activities" && (
                  <div className="content-section">
                    <div className="section-header">
                      <h2>Recent Activities</h2>
                      <IonButton fill="clear" className="view-all-btn">View All</IonButton>
                    </div>

                    <div className="activities-grid">
                      {[
                        { title: "Morning Run", distance: "16.3 km", time: "02:43:51", badges: 5, type: "run" },
                        { title: "Evening Jog", distance: "8.5 km", time: "01:15:23", badges: 3, type: "jog" },
                        { title: "Trail Run", distance: "12.1 km", time: "02:05:12", badges: 4, type: "trail" },
                        { title: "Morning Run", distance: "16.3 km", time: "02:43:51", badges: 5, type: "run" },
                        { title: "Evening Jog", distance: "8.5 km", time: "01:15:23", badges: 3, type: "jog" },
                        { title: "Trail Run", distance: "12.1 km", time: "02:05:12", badges: 4, type: "trail" }
                      ].map((activity, i) => (
                        <IonCard key={i} className="activity-card-modern">
                          <div className="activity-header">
                            <div className="activity-type-badge">{activity.type}</div>
                            <div className="activity-date">Today</div>
                          </div>
                          <IonCardContent className="activity-content">
                            <h3 className="activity-title">{activity.title}</h3>
                            <div className="activity-stats">
                              <div className="activity-stat">
                                <span>{activity.distance}</span>
                              </div>
                              <div className="activity-stat">
                                <span>{activity.time}</span>
                              </div>
                              <div className="activity-stat">
                                <span>{activity.badges} badges</span>
                              </div>
                            </div>
                            <div className="activity-map">
                              <IonImg src={MapImage} alt="Activity Map" />
                            </div>
                          </IonCardContent>
                        </IonCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* Badges Section */}
                {activeTab === "badges" && (
                  <div className="content-section">
                    <div className="section-header">
                      <h2>Achievement Badges</h2>
                      <div className="badge-progress">12 of 24 earned</div>
                    </div>

                    <div className="badges-grid">
                      {[...Array(8)].map((_, i) => (
                        <IonCard key={i} className="badge-card-modern">
                          <div className="badge-glow"></div>
                          <IonImg src={Badge} alt="Achievement Badge" className="badge-image" />
                          <IonCardContent>
                            <h4 className="badge-title">First Mile</h4>
                            <p className="badge-description">Completed your first 1-mile run</p>
                            <div className="badge-earned">Earned 2 days ago</div>
                          </IonCardContent>
                        </IonCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenges Section */}
                {activeTab === "challenges" && (
                  <div className="content-section">
                    <div className="section-header">
                      <h2>Active Challenges</h2>
                      <IonButton fill="clear" className="browse-challenges">Browse More</IonButton>
                    </div>

                    <div className="challenges-grid">
                      {[
                        { title: "April Elevation Challenge", progress: 65, target: "2,000m elevation", timeLeft: "12 days left" },
                        { title: "Spring Distance Goal", progress: 40, target: "100km this month", timeLeft: "18 days left" },
                        { title: "Weekend Warrior", progress: 80, target: "8 weekend runs", timeLeft: "5 days left" },
                        { title: "Early Bird Runner", progress: 25, target: "10 morning runs", timeLeft: "20 days left" }
                      ].map((challenge, i) => (
                        <IonCard key={i} className="challenge-card-modern">
                          <div className="challenge-image-container">
                            <IonImg src={Challenges} alt="Challenge" />
                            <div className="challenge-progress-overlay">
                              <div className="progress-circle">
                                <span className="progress-text">{challenge.progress}%</span>
                              </div>
                            </div>
                          </div>
                          <IonCardContent>
                            <h4 className="challenge-title">{challenge.title}</h4>
                            <p className="challenge-target">{challenge.target}</p>
                            <div className="challenge-footer">
                              <span className="challenge-time">{challenge.timeLeft}</span>
                              <IonButton size="small" className="join-challenge-btn">
                                Continue
                              </IonButton>
                            </div>
                          </IonCardContent>
                        </IonCard>
                      ))}
                    </div>
                  </div>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Profile Action Buttons - Moved Under Content Section */}
          <div className="profile-action-buttons-bottom">
            <IonButton 
              className="edit-profile-button" 
              fill="clear"
              onClick={() => setIsEditModalOpen(true)}
            >
              <IonIcon icon={settings} slot="start" />
              Edit Profile
            </IonButton>
            
            <IonButton 
              className="logout-button"
              fill="clear"
              onClick={() => setShowLogoutAlert(true)}
            >
              <IonIcon icon={logOut} slot="start" />
              Log Out
            </IonButton>
          </div>
        </div>

        {/* Followers/Following Modal */}
        <IonModal 
          isOpen={isFollowersModalOpen} 
          onDidDismiss={() => setIsFollowersModalOpen(false)}
          className="followers-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {followersModalType === "followers" ? "Followers" : "Following"}
              </IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => setIsFollowersModalOpen(false)}
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          
          <IonContent className="followers-modal-content">
            <div className="followers-container">
              <div className="followers-header">
                <div className="followers-tabs">
                  <button
                    className={`followers-tab ${followersModalType === "followers" ? "active" : ""}`}
                    onClick={() => setFollowersModalType("followers")}
                  >
                    <span className="tab-count">32</span>
                    <span className="tab-label">Followers</span>
                  </button>
                  <button
                    className={`followers-tab ${followersModalType === "following" ? "active" : ""}`}
                    onClick={() => setFollowersModalType("following")}
                  >
                    <span className="tab-count">21</span>
                    <span className="tab-label">Following</span>
                  </button>
                </div>
              </div>

              <div className="followers-list">
                {(followersModalType === "followers" ? followersData : followingData).map((user) => (
                  <div key={user.id} className="follower-item">
                    <div className="follower-avatar-container">
                      <IonImg src={user.avatar} alt={user.name} className="follower-avatar" />
                      <div className="follower-online-indicator"></div>
                    </div>
                    
                    <div className="follower-info">
                      <div className="follower-main-info">
                        <h4 className="follower-name">{user.name}</h4>
                        <p className="follower-username">@{user.username}</p>
                      </div>
                      {user.mutualFollows > 0 && (
                        <p className="follower-mutual">
                          {user.mutualFollows} mutual {user.mutualFollows === 1 ? 'follow' : 'follows'}
                        </p>
                      )}
                    </div>

                    <div className="follower-actions">
                      <IonButton
                        className={`follow-btn ${user.isFollowing ? 'following' : 'follow'}`}
                        size="small"
                        onClick={() => handleFollowToggle(user.id, followersModalType)}
                      >
                        {user.isFollowing ? 'Following' : 'Follow'}
                      </IonButton>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Section */}
              <div className="load-more-section">
                <IonButton 
                  fill="outline" 
                  expand="block" 
                  className="load-more-btn"
                  onClick={() => console.log('Load more')}
                >
                  Load More
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Logout Confirmation Alert */} 
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Confirm Logout"
          message="Are you sure you want to log out?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Log Out',
              role: 'destructive',
              handler: handleLogout
            }
          ]}
        />

        {/* Edit Profile Modal */}
        <IonModal isOpen={isEditModalOpen} className="edit-profile-modal">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Profile</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={handleCancelEdit}
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          
          <IonContent className="edit-modal-content">
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
                  onClick={() => setIsActionSheetOpen(true)}
                >
                  <IonIcon icon={camera} slot="start" />
                  Change Photo
                </IonButton>
              </div>

              {/* Form Fields */}
              <div className="edit-form-fields">
                <IonItem className="edit-form-item">
                  <IonLabel position="stacked">First Name</IonLabel>
                  <IonInput
                    value={editForm.firstName}
                    onIonInput={(e) => setEditForm({
                      ...editForm,
                      firstName: e.detail.value!
                    })}
                    placeholder="Enter your first name"
                    className="edit-input"
                  />
                </IonItem>

                <IonItem className="edit-form-item">
                  <IonLabel position="stacked">Last Name</IonLabel>
                  <IonInput
                    value={editForm.lastName}
                    onIonInput={(e) => setEditForm({
                      ...editForm,
                      lastName: e.detail.value!
                    })}
                    placeholder="Enter your last name"
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
                >
                  <IonIcon icon={checkmark} slot="start" />
                  Save Changes
                </IonButton>
                
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleCancelEdit}
                  className="cancel-profile-btn"
                >
                  Cancel
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Image Selection Action Sheet */}
        <IonActionSheet
          isOpen={isActionSheetOpen}
          onDidDismiss={() => setIsActionSheetOpen(false)}
          header="Change Profile Picture"
          buttons={[
            {
              text: 'Camera',
              icon: camera,
              handler: () => handleImageSelection('camera')
            },
            {
              text: 'Photo Library',
              icon: person,
              handler: () => handleImageSelection('library')
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />

        {/* Success Toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Profile updated successfully!"
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;