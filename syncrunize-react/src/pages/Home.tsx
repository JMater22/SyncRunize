import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonAvatar,
  IonIcon, 
} from "@ionic/react";
import {
  chatbubbleEllipses,
  peopleOutline,
  flagOutline,
  createOutline, 
  heartOutline,
  timeOutline, 
  locationOutline, 
  flameOutline, 
} from "ionicons/icons";

// Import the new CreatePostPage component
import CreatePostPage from "../components/Home/CreatePostPage";
import "../components/Home/Home.css"; 

// Placeholder images
import ProfilePic from "../assets/Profile Picture.png";
import GirlPic from "../assets/GIRL 3.jpg";
import Map from "../assets/MAP 1.png";

const Home: React.FC = () => {
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [showCreatePostPage, setShowCreatePostPage] = useState(false);

  const sampleComments = [
    { user: "Maria Gonzales", text: "Great run! 🔥🔥", avatar: ProfilePic, time: "2m ago" },
    { user: "John Doe", text: "Solid effort 👏", avatar: ProfilePic, time: "5m ago" },
    { user: "Emily Chen", text: "Keep it up, Alexander 💪", avatar: GirlPic, time: "12m ago" },
  ];

  const activities = [
    {
      user: "Alexander Smith",
      date: "April 29, 2025",
      time: "2h ago",
      distance: "16.3 km",
      duration: "02:43:51",
      calories: "842",
      likes: 24,
      comments: 3,
    },
    {
      user: "Maria Gonzales",
      date: "March 13, 2025",
      time: "1d ago",
      distance: "8.2 km",
      duration: "01:25:30",
      calories: "521",
      likes: 18,
      comments: 5,
    },
    {
      user: "Emily Chen",
      date: "May 2, 2025",
      time: "3d ago",
      distance: "21.1 km",
      duration: "03:15:42",
      calories: "1,234",
      likes: 42,
      comments: 8,
    },
    {
      user: "Alexander Smith",
      date: "May 2, 2025",
      time: "3d ago",
      distance: "21.1 km",
      duration: "03:15:42",
      calories: "1,234",
      likes: 42,
      comments: 8,
    },
    {
      user: "John Doe",
      date: "May 2, 2025",
      time: "3d ago",
      distance: "21.1 km",
      duration: "03:15:42",
      calories: "1,234",
      likes: 42,
      comments: 8,
    },
  ];

  const handlePostSubmit = (content: string) => {
    console.log("New post:", content);
    // Handle post submission here
  };

  // If create post page is shown, render it instead
  if (showCreatePostPage) {
    return (
      <CreatePostPage
        userName="Alexander Smith"
        userAvatar={ProfilePic}
        onClose={() => setShowCreatePostPage(false)}
        onSubmit={handlePostSubmit}
      />
    ); 
  }

  return (
    <IonPage>
      <IonContent className="home-content">
        <div className="page-layout-enhanced">
          {/* Left Sidebar */}
          <aside className="left-sidebar">
            <IonCard className="profile-card-enhanced">
              <div className="profile-card-header">
                <IonAvatar className="profile-avatar-large">
                  <img src={ProfilePic} alt="Profile" />
                </IonAvatar>
                <div className="online-status"></div>
              </div>

              <IonCardContent className="profile-card-content">
                <h2 className="profile-name">Alexander Smith</h2>
                <p className="profile-handle">@alexsmith</p>

                <div className="profile-stats-grid">
                  <div className="stat-item">
                    <span className="stat-number">32</span>
                    <span className="stat-label">Following</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">21</span>
                    <span className="stat-label">Followers</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">12</span>
                    <span className="stat-label">Activities</span>
                  </div>
                </div>

                <div className="weekly-summary">
                  <h4>This Week</h4>
                  <div className="summary-stats">
                    <div className="summary-item">
                      <span className="summary-value">45.6 km</span>
                      <span className="summary-label">Distance</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-value">4h 23m</span>
                      <span className="summary-label">Time</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-value">3234</span>
                      <span className="summary-label">Calories</span>
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </aside>

          {/* Center Feed */}
          <main className="feed-column-enhanced">
            <div className="feed-header">
              <div className="search-section">
                <IonItem className="search-input">
                  <IonInput placeholder="Find athletes and groups" />
                </IonItem>
              </div>

              <div className="post-section">
                <div className="post-input" onClick={() => setShowCreatePostPage(true)} style={{ cursor: "pointer" }}>
                  <IonItem className="post-input-item">
                    <IonInput placeholder="What's on your mind?" readonly />
                  </IonItem>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="activity-feed">
              {activities.map((activity, i) => (
                <IonCard key={i} className="activity-card-enhanced">
                  {/* Activity Header */}
                  <div className="activity-header-enhanced">
                    <IonAvatar className="activity-user-avatar">
                      <img src={ProfilePic} alt="Profile" />
                    </IonAvatar>
                    <div className="activity-user-info">
                      <h3 className="activity-user-name">
                        {activity.user} <span className="activity-handle">@alexsmith</span>
                      </h3>
                      <div className="activity-meta">
                        <span className="activity-time">{activity.time}</span> • {activity.date}
                      </div>
                    </div>
                  </div>

                  <IonCardContent className="activity-content-enhanced">
                    {/* Stats */}
                    <div className="activity-stats-grid">
                      <div className="stat-card distance">
                        <IonIcon icon={locationOutline} />
                        <div>
                          <span className="stat-value">{activity.distance}</span>
                          <span className="stat-label">Distance</span>
                        </div>
                      </div>
                      <div className="stat-card time">
                        <IonIcon icon={timeOutline} />
                        <div>
                          <span className="stat-value">{activity.duration}</span>
                          <span className="stat-label">Time</span>
                        </div>
                      </div>
                      <div className="stat-card calories">
                        <IonIcon icon={flameOutline} />
                        <div>
                          <span className="stat-value">{activity.calories}</span>
                          <span className="stat-label">Calories</span>
                        </div>
                      </div>
                    </div>

                    {/* Map */}
                    <div className="activity-map-container">
                      <img src={Map} alt="Run Map" className="activity-map" />
                      <div className="map-overlay"></div>
                    </div>

                    {/* Actions */}
                    <div className="activity-actions-enhanced">
                      <IonButton fill="clear" size="small" className="action-btn like-btn">
                        <IonIcon icon={heartOutline} slot="start" />
                        <span>{activity.likes} Likes</span>
                      </IonButton>

                      <IonButton
                        fill="clear"
                        size="small"
                        className="action-btn comment-btn"
                        onClick={() => setOpenComments(openComments === i ? null : i)}
                      >
                        <IonIcon icon={chatbubbleEllipses} slot="start" />
                        <span>{activity.comments} Comments</span>
                      </IonButton>
                    </div>

                    {/* Comments */}
                    {openComments === i && (
                      <div className="comments-section-enhanced">
                        <div className="comments-header">
                          <h4>Comments ({activity.comments})</h4>
                        </div>
                        {sampleComments.map((comment, j) => (
                          <div key={j} className="comment-enhanced">
                            <IonAvatar className="comment-avatar">
                              <img src={comment.avatar} alt={comment.user} />
                            </IonAvatar>
                            <div className="comment-content">
                              <div className="comment-header">
                                <strong className="comment-user">{comment.user}</strong>
                                <span className="comment-time">{comment.time}</span>
                              </div>
                              <p className="comment-text">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                        <div className="add-comment">
                          <IonAvatar className="comment-avatar">
                            <img src={ProfilePic} alt="You" />
                          </IonAvatar>
                          <IonInput placeholder="Add a comment..." className="comment-input" />
                        </div>
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="right-sidebar">
            <IonCard className="sidebar-card-enhanced challenges-card">
              <div className="sidebar-card-header">
                <div className="sidebar-icon-container challenges">
                  <IonIcon icon={flagOutline} />
                </div>
                <div>
                  <h3 className="sidebar-title">Challenges</h3>
                  <p className="sidebar-subtitle">3 Active</p>
                </div>
              </div>
              <div className="sidebar-card-content">
                <p className="sidebar-description">Join running challenges to stay motivated!</p>
                <div className="challenge-preview">
                  <div className="challenge-item">
                    <span className="challenge-name">April Distance Goal</span>
                    <span className="challenge-progress">65%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: "65%" }}></div>
                  </div>
                </div>
                <IonButton size="small" className="sidebar-cta">
                  View All
                </IonButton>
              </div>
            </IonCard>

            <IonCard className="sidebar-card-enhanced groups-card">
              <div className="sidebar-card-header">
                <div className="sidebar-icon-container groups">
                  <IonIcon icon={peopleOutline} />
                </div>
                <div>
                  <h3 className="sidebar-title">Groups</h3>
                  <p className="sidebar-subtitle">5 Joined</p>
                </div>
              </div>
              <div className="sidebar-card-content">
                <p className="sidebar-description">Run together, go further!</p>
                <div className="group-preview">
                  <div className="group-avatars">
                    <IonAvatar className="group-avatar"><img src={ProfilePic} alt="Member" /></IonAvatar>
                    <IonAvatar className="group-avatar"><img src={ProfilePic} alt="Member" /></IonAvatar>
                    <IonAvatar className="group-avatar"><img src={ProfilePic} alt="Member" /></IonAvatar>
                    <div className="more-members">+12</div>
                  </div>
                  <span className="group-name">NYC Runners Club</span>
                </div>
                <IonButton size="small" className="sidebar-cta">
                  Explore Groups
                </IonButton>
              </div>
            </IonCard>
          </aside>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;