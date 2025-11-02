import React, { useState } from "react";
import { useHistory } from 'react-router-dom';
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
  IonFab,
  IonFabButton,
  IonBadge,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonList,
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
  notifications,
  close,
  personAddOutline,
  trophyOutline,
  ribbonOutline,
  speedometerOutline
} from "ionicons/icons";

// Import the new CreatePostPage component
import CreatePostPage from "../components/Home/CreatePostPage";
import "../components/Home/Home.css";

// Placeholder images
import ProfilePic from "../assets/Profile Picture.png";
import GirlPic from "../assets/GIRL 3.jpg";
import Map from "../assets/MAP 1.png";
import Couch5K from "../assets/Couch to 5K.jpg";
import SevenDayStarter from "../assets/The 7-Day Starter.jpg";
import ThreeTimesAWeek from "../assets/Three Times a Week.jpg";

const Home: React.FC = () => {
  const [openComments, setOpenComments] = useState<number | null>(null);
  const [showCreatePostPage, setShowCreatePostPage] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const sampleComments = [
    { user: "Maria Gonzales", text: "Great run! 🔥🔥", avatar: ProfilePic, time: "2m ago" },
    { user: "John Doe", text: "Solid effort 👏", avatar: ProfilePic, time: "5m ago" },
    { user: "Emily Chen", text: "Keep it up, Alexander 💪", avatar: GirlPic, time: "12m ago" },
  ];

  const notificationsData = [
    {
      id: 1,
      type: "follower",
      icon: personAddOutline,
      iconColor: "#3880ff",
      user: "Sarah Johnson",
      avatar: GirlPic,
      message: "started following you",
      time: "5m ago",
      unread: true,
    },
    {
      id: 2,
      type: "badge",
      icon: ribbonOutline,
      iconColor: "#ffc409",
      message: "You've earned a new badge: 100km Milestone!",
      time: "1h ago",
      unread: true,
    },
    {
      id: 3,
      type: "challenge",
      icon: trophyOutline,
      iconColor: "#10dc60",
      message: "Challenge Complete: April Distance Goal",
      description: "Congratulations! You've completed 100km this month.",
      time: "2h ago",
      unread: true,
    },
    {
      id: 4,
      type: "follower",
      icon: personAddOutline,
      iconColor: "#3880ff",
      user: "Mike Chen",
      avatar: ProfilePic,
      message: "started following you",
      time: "3h ago",
      unread: true,
    },
    {
      id: 5,
      type: "like",
      icon: heartOutline,
      iconColor: "#eb445a",
      user: "Emily Chen",
      avatar: GirlPic,
      message: "liked your activity",
      time: "5h ago",
      unread: true,
    },
    {
      id: 6,
      type: "comment",
      icon: chatbubbleEllipses,
      iconColor: "#3880ff",
      user: "John Doe",
      avatar: ProfilePic,
      message: "commented on your post",
      time: "1d ago",
      unread: false,
    },
    {
      id: 7,
      type: "badge",
      icon: ribbonOutline,
      iconColor: "#ffc409",
      message: "You've earned a new badge: Bronze",
      time: "2d ago",
      unread: false,
    },
  ];

  const activities = [
  {
    user: "Alexander Smith",
    date: "April 29, 2025",
    time: "2h ago",
    distance: "16.3 km",
    duration: "02:43:51",
    pace: "10:03/km",
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
    pace: "10:25/km",
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
    pace: "9:16/km",
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
    pace: "9:16/km",
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
    pace: "9:16/km",
    calories: "1,234",
    likes: 42,
    comments: 8,
  },
];


  const handlePostSubmit = (content: string) => {
    console.log("New post:", content);
    // Handle post submission here
  };

  const history = useHistory();
const handleViewAllChallenges = () => {
    history.push('/challenges');
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
                  <IonInput placeholder="Find athletes" />
                </IonItem>
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
                        <div className="stat-card pace">
                          <IonIcon icon={speedometerOutline} />
                          <div>
                            <span className="stat-value">{activity.pace}</span>
                            <span className="stat-label">Pace</span>
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
                  <div>
                    <h3 className="sidebar-title">Your Challenges</h3>
                  </div>
                </div>
                <div className="sidebar-card-content">
                    <div className="challenge-list">
                      <div className="strava-challenge-item">
                        <div className="challenge-badge">
                          <img src={Couch5K} alt="Couch to 5K" />
                        </div>
                        <div className="challenge-info">
                          <h4 className="challenge-title">Couch to 5K</h4>
                          <div className="challenge-days-left">
                            <IonIcon icon={timeOutline} />
                            <span>38 days left</span>
                          </div>
                        </div>
                      </div>

                      <div className="strava-challenge-item">
                        <div className="challenge-badge">
                          <img src={SevenDayStarter} alt="The 7-Day Starter" />
                        </div>
                        <div className="challenge-info">
                          <h4 className="challenge-title">The 7-Day Starter</h4>
                          <div className="challenge-days-left">
                            <IonIcon icon={timeOutline} />
                            <span>2 days left</span>
                          </div>
                        </div>
                      </div>

                      <div className="strava-challenge-item">
                        <div className="challenge-badge">
                          <img src={ThreeTimesAWeek} alt="Three Times a Week" />
                        </div>
                        <div className="challenge-info">
                          <h4 className="challenge-title">Three Times a Week</h4>
                          <div className="challenge-days-left">
                            <IonIcon icon={timeOutline} />
                            <span>10 days left</span>
                          </div>
                        </div>
                      </div>
                  </div>
                  <IonButton expand="block" fill="clear" className="sidebar-cta" onClick={handleViewAllChallenges}>
                    View All Challenges
                  </IonButton>
                </div>
              </IonCard>
          </aside>
        </div>

        {/* Floating Action Button for Notifications */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowNotifications(true)}>
            <IonIcon icon={notifications} />
            <IonBadge color="danger" className="fab-badge">5</IonBadge>
          </IonFabButton>
        </IonFab>

        {/* Notifications Modal */}
        <IonModal isOpen={showNotifications} onDidDismiss={() => setShowNotifications(false)} className="notifications-modal">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Notifications</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowNotifications(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              {notificationsData.map((notification) => (
                <IonItem
                  key={notification.id}
                  button
                  detail={false}
                  className={`notification-item ${notification.unread ? 'unread' : ''}`}
                >
                  <div 
                    className="notification-icon-wrapper"
                    style={{ backgroundColor: `${notification.iconColor}20` }}
                  >
                    {notification.avatar ? (
                      <IonAvatar className="notification-avatar">
                        <img src={notification.avatar} alt={notification.user} />
                      </IonAvatar>
                    ) : (
                      <IonIcon
                        icon={notification.icon}
                        className="notification-icon"
                        style={{ color: notification.iconColor }}
                      />
                    )}
                  </div>
                  <div className="notification-content">
                    <div className="notification-header">
                      {notification.user && (
                        <strong className="notification-user">
                          {notification.user}
                        </strong>
                      )}
                      <span className="notification-message">
                        {notification.message}
                      </span>
                    </div>
                    {notification.description && (
                      <p className="notification-description">
                        {notification.description}
                      </p>
                    )} 
                    <span className="notification-time">
                      {notification.time}
                    </span>
                  </div>
                  {notification.unread && (
                    <div className="notification-unread-dot" />
                  )}
                </IonItem>
              ))}
            </IonList>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Home;