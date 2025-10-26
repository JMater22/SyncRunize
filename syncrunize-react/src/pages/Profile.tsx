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
  import BronzeBadge from "../assets/Bronze Animated-modified.png";
  import SilverBadge from "../assets/Silver Animated-modified.png";
  import GoldBadge from "../assets/Gold Animated-modified.png";

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
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
    
    // Profile data state
    const [profileData, setProfileData] = useState({
      firstName: "Alexander",
      lastName: "Smith",
      description: "Running enthusiast • Fitness lover • Goal crusher",
      profilePic: ProfilePic
    });
    
    const statsData = {
      week: {
        title: 'This Week',
        runs: 3,
        time: '4h 22m',
        distance: '7.2 km',
        calories: '850 kcal'
      },
      month: {
        title: 'This Month',
        runs: 12,
        time: '18h 45m',
        distance: '28.5 km',
        calories: '3,420 kcal'
      },
      year: {
        title: 'Year to Date',
        runs: 54,
        time: '234h 23m',
        distance: '387 km',
        calories: '46,280 kcal'
      }
    };

    const currentStats = statsData[timeRange];

    // Form state for editing
    const [editForm, setEditForm] = useState({ ...profileData });

    // Active challenges data aligned with new challenges
    const activeChallengesData = [
      { 
        title: "Couch to 5K", 
        progress: 45, 
        target: "Build from walking to running 5K continuously", 
        timeLeft: "38 days left",
        duration: "56 days (8 weeks)"
      },
      { 
        title: "The 7-Day Starter", 
        progress: 71, 
        target: "Run at least 1 kilometer every day for a week", 
        timeLeft: "2 days left",
        duration: "7 days"
      },
      { 
        title: "30-Day Streak", 
        progress: 53, 
        target: "Run at least 1 mile every day for a month", 
        timeLeft: "14 days left",
        duration: "30 days"
      },
      { 
        title: "5K Improver", 
        progress: 60, 
        target: "Work on improving your 5K time with structured training", 
        timeLeft: "17 days left",
        duration: "42 days (6 weeks)"
      },
      { 
        title: "Weekend Long Run", 
        progress: 35, 
        target: "Do one longer run each weekend, building to 10 km", 
        timeLeft: "36 days left",
        duration: "56 days (8 weeks)"
      },
      { 
        title: "The 50K Month", 
        progress: 48, 
        target: "Accumulate 50 kilometers total over the month at your pace", 
        timeLeft: "16 days left",
        duration: "30 days"
      },
      { 
        title: "Three Times a Week", 
        progress: 67, 
        target: "Run three days per week with rest days between", 
        timeLeft: "10 days left",
        duration: "30 days"
      },
      { 
        title: "10K Beginner", 
        progress: 30, 
        target: "Progress from 5K to completing 10K distance", 
        timeLeft: "44 days left",
        duration: "63 days (9 weeks)"
      }
    ];

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
                    
                    {/* Time Range Dropdown */}
                    <div className="time-range-dropdown">
                      <select 
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
                        className="time-range-select"
                      >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">Year to Date</option>
                      </select>
                    </div>

                    {/* Dynamic Stats Card */}
                    <div className={`stats-card ${timeRange}`}>
                      <div className="stats-card-header">
                        <h4>{currentStats.title}</h4>
                      </div>
                      <div className="stats-list">
                        <div className="stats-item">
                          <div className="stats-content">
                            <span className="stats-label">Runs</span>
                            <span className="stats-value">{currentStats.runs}</span>
                          </div>
                        </div>
                        <div className="stats-item">
                          <div className="stats-content">
                            <span className="stats-label">Time</span>
                            <span className="stats-value">{currentStats.time}</span>
                          </div>
                        </div>
                        <div className="stats-item">
                          <div className="stats-content">
                            <span className="stats-label">Distance</span>
                            <span className="stats-value">{currentStats.distance}</span>
                          </div>
                        </div>
                        <div className="stats-item">
                          <div className="stats-content">
                            <span className="stats-label">Calories</span>
                            <span className="stats-value">{currentStats.calories}</span>
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
                        <h2>All Activities</h2>
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

                {/* Badges Section - Only 3 Animated Badges */}
                {activeTab === "badges" && (
                  <div className="content-section">
                    <div className="section-header">
                      <h2>Achievement Badges</h2>
                    </div>

                    <div className="badges-grid">
                      {[
                        { title: "Bronze", description: "Your first animated achievement", tier: "Bronze", earned: true, date: "2 days ago", image: BronzeBadge },
                        { title: "Silver", description: "Unlocked through dedication", tier: "Silver", earned: true, date: "1 week ago", image: SilverBadge },
                        { title: "Gold", description: "Elite achievement unlocked", tier: "Gold", earned: true, date: "3 weeks ago", image: GoldBadge }
                      ].map((badge, i) => (
                        <IonCard key={i} className={`badge-card-modern ${!badge.earned ? 'locked' : ''}`}>
                          <div className={`badge-glow ${badge.tier.toLowerCase()}`}></div>
                          <div className={`badge-tier-label ${badge.tier.toLowerCase()}`}>{badge.tier}</div>
                          <IonImg src={badge.image} alt={badge.title} className="badge-image" />
                          <IonCardContent>
                            <h4 className="badge-title">{badge.title}</h4>
                            <p className="badge-description">{badge.description}</p>
                            <div className={`badge-earned ${!badge.earned ? 'locked-text' : ''}`}>
                              {badge.earned ? `Earned ${badge.date}` : badge.date}
                            </div>
                          </IonCardContent>
                        </IonCard>
                      ))}
                    </div>
                  </div>
                )}

                  {/* Challenges Section - Updated with new challenge data */}
                  {activeTab === "challenges" && (
                    <div className="content-section">
                      <div className="section-header">
                        <h2>Active Challenges</h2>
                        <IonButton fill="clear" className="browse-challenges">Browse More</IonButton>
                      </div>

                      <div className="challenges-grid">
                        {activeChallengesData.map((challenge, i) => (
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
                              <p className="challenge-duration">{challenge.duration}</p>
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
            cssClass="logout-alert"
            buttons={[
              {
                text: 'Cancel',
                role: 'cancel',
                cssClass: 'alert-button-cancel'
              },
              {
                text: 'Log Out',
                role: 'destructive',
                cssClass: 'alert-button-logout',
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