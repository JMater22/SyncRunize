import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton,
  IonInput,
  IonTextarea,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
} from "@ionic/react";
import {
  heart,
  chatbubble,
  camera, 
  videocam,
  location,
  happy,
  trophy,
  personAdd,
  ellipsisHorizontal
} from "ionicons/icons";
import "./GroupFeed.css";

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  verified?: boolean;
}

interface Post {
  id: number;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  image: string;
  likes: number;
  comments: number;
  time: string;
}

const GroupFeed: React.FC = () => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const toggleLike = (postId: number) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
  };

  const suggestedUsers: User[] = [
    {
      id: 1,
      name: "Calvin Drag",
      username: "@calvindragrunner",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format"
    },
    {
      id: 2,
      name: "Ivy Root",
      username: "@ivy_root_29",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face&auto=format"
    },
    {
      id: 3,
      name: "Lauren Prittsky",
      username: "@laurenlovesrunning",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format",
      verified: true
    }
  ];

  const recentlyJoined: User[] = [
    {
      id: 1,
      name: "Michael - 28 yo",
      username: "San Francisco",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&auto=format"
    },
    {
      id: 2,
      name: "Susan - 37 yo",
      username: "New York",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face&auto=format"
    },
    {
      id: 3,
      name: "James - 28 yo",
      username: "Seattle",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face&auto=format"
    }
  ];

  const posts: Post[] = [
    {
      id: 1,
      user: {
        name: "Alexander Smith",
        avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face&auto=format"
      },
      content: "Just finished an amazing 10K run through Golden Gate Park! The morning fog made it absolutely magical. Who wants to join me tomorrow? 🏃‍♂️",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&auto=format",
      likes: 124,
      comments: 43,
      time: "2 hours ago"
    },
    {
      id: 2,
      user: {
        name: "Sarah Johnson",
        avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=150&h=150&fit=crop&crop=face&auto=format"
      },
      content: "Training for the upcoming marathon! These hill repeats are brutal but so worth it. Remember: every step counts! 💪",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&auto=format",
      likes: 89,
      comments: 27,
      time: "4 hours ago"
    },
    {
      id: 3,
      user: {
        name: "Mike Torres",
        avatar: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&auto=format"
      },
      content: "Group run this Sunday at 7 AM - Presidio trails! Perfect weather forecast and amazing views. Let's make it a big group! 🌅",
      image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop&auto=format",
      likes: 156,
      comments: 62,
      time: "6 hours ago"
    }
  ];

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="custom-header">
        <IonToolbar className="custom-toolbar">
          <IonTitle className="custom-title">City Runner Group Feed</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Layout Grid */}
        <div className="layout-grid">
          {/* LEFT SIDEBAR */}
          <section className="sidebar-left">
            <h3 className="section-title">
              <IonIcon icon={personAdd} className="section-icon" />
              Who to follow
            </h3>
            <IonList className="follow-list">
              {suggestedUsers.map((user) => (
                <IonItem key={user.id} className="follow-item">
                  <IonAvatar slot="start">
                    <img src={user.avatar} alt={user.name} />
                  </IonAvatar>
                  <IonLabel className="user-info">
                    <div className="name">
                      {user.name}
                      {user.verified && <span className="verified-badge"></span>}
                    </div>
                    <div className="username">{user.username}</div>
                  </IonLabel>
                  <IonButton className="follow-button" slot="end" size="small">
                    Follow
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
            <IonButton expand="block" className="show-more" fill="clear">
              Show more
            </IonButton>
          </section>

          {/* MAIN FEED */}
          <section className="feed">
            {/* Post Input */}
            <div
              className="post-input-container"
              onClick={() => setShowModal(true)}
            >
              <IonAvatar className="post-input-avatar">
                <img
                  src="https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face&auto=format"
                  alt="Your avatar"
                />
              </IonAvatar>
              <IonInput
                placeholder="Share your running journey..."
                readonly
                className="post-input-field"
              />
            </div>

            {/* Posts */}
            <div className="posts-container">
              {posts.map((post) => (
                <div key={post.id} className="post">
                  <div className="post-header">
                    <IonAvatar>
                      <img src={post.user.avatar} alt={post.user.name} />
                    </IonAvatar>
                    <div className="user-info">
                      <span className="name">{post.user.name}</span>
                      <span className="time">{post.time}</span>
                    </div>
                    <IonButton fill="clear" className="post-menu">
                      <IonIcon icon={ellipsisHorizontal} />
                    </IonButton>
                  </div>

                  <div className="post-content">
                    <p>{post.content}</p>
                    <img
                      src={post.image}
                      alt="Post content"
                      className="post-image"
                    />
                  </div>

                  <div className="post-actions">
                    <IonButton
                      fill="clear"
                      className={`action-button ${likedPosts.has(post.id) ? 'liked' : ''}`}
                      onClick={() => toggleLike(post.id)}
                    >
                      <IonIcon icon={heart} slot="start" />
                      {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                    </IonButton>
                    <IonButton fill="clear" className="action-button">
                      <IonIcon icon={chatbubble} slot="start" />
                      {post.comments}
                    </IonButton>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RIGHT SIDEBAR */}
          <section className="sidebar-right">
            {/* LEADERBOARD */}
            <div className="leaderboard-card">
              <IonButton
                className="leaderboard-btn"
                routerLink="/leaderboard"
                expand="block"
              >
                <IonIcon icon={trophy} slot="start" />
                Leaderboard
              </IonButton>
            </div>

            {/* RECENTLY JOINED */}
            <div className="recently-joined">
              <h3 className="section-title">Recently Joined</h3>
              <div className="joined-list">
                {recentlyJoined.map((user) => (
                  <div key={user.id} className="joined-item">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="joined-avatar"
                    />
                    <div className="joined-info">
                      <span className="name">{user.name}</span>
                      <span className="location">{user.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STATS CARD */}
            <div className="stats-card">
              <h3 className="section-title">Your Stats</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">This Week</span>
                  <span className="stat-value">32.5 km</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">This Month</span>
                  <span className="stat-value">127.8 km</span>
                </div>
              </div>
            </div>
          </section>

          {/* CREATE POST MODAL */}
          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Create Post</h3>
                  <IonButton
                    fill="clear"
                    className="close-button"
                    onClick={() => setShowModal(false)}
                  >
                    ×
                  </IonButton>
                </div>
                <div className="modal-body">
                  <div className="modal-user-profile">
                    <IonAvatar>
                      <img
                        src="https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face&auto=format"
                        alt="Your avatar"
                      />
                    </IonAvatar>
                    <span className="modal-username">Alexander Smith</span>
                  </div>
                  <IonTextarea
                    placeholder="What's on your mind, Alexander?"
                    rows={5}
                    className="modal-textarea"
                  />
                  <div className="modal-actions">
                    <div className="media-buttons">
                      <IonButton fill="clear" className="media-btn">
                        <IonIcon icon={camera} />
                      </IonButton>
                      <IonButton fill="clear" className="media-btn">
                        <IonIcon icon={videocam} />
                      </IonButton>
                      <IonButton fill="clear" className="media-btn">
                        <IonIcon icon={location} />
                      </IonButton>
                      <IonButton fill="clear" className="media-btn">
                        <IonIcon icon={happy} />
                      </IonButton>
                    </div>
                    <IonButton
                      className="post-submit-btn"
                      onClick={() => setShowModal(false)}
                    >
                      Post
                    </IonButton>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GroupFeed;