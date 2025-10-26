import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonImg,
  IonAvatar,
  IonSearchbar,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonBackButton,
  IonButtons
} from "@ionic/react";
import {
  trophy,
  chatboxEllipses,
  people,
  addOutline,
  heartOutline,
  heart,
  chatbubbleOutline
} from "ionicons/icons";
import ChallengePic from "../components/assets/istockphoto-143920084-612x612.jpg";
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import "../theme/Community.css";

const Community: React.FC = () => {
  const [tab, setTab] = useState<"challenges" | "feed" | "groups">("challenges");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [challengeName, setChallengeName] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  
  // Create Group Modal state
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupPrivacy, setGroupPrivacy] = useState("public");
  
  // Comments state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<{[key: number]: Array<{id: number, user: string, text: string, time: string}>}>({
    1: [
      { id: 1, user: "Sarah Johnson", text: "Congratulations! That's amazing! 🎉", time: "2 hrs ago" },
      { id: 2, user: "Mike Chen", text: "Great job! Keep it up!", time: "1 hr ago" }
    ],
    2: [
      { id: 1, user: "Emily Davis", text: "You guys are crushing it! 💪", time: "2 hrs ago" }
    ],
    3: []
  });

  // Likes state
  const [likes, setLikes] = useState<{[key: number]: {count: number, isLiked: boolean}}>({
    1: { count: 324, isLiked: false },
    2: { count: 41, isLiked: false },
    3: { count: 150, isLiked: false }
  });

  const handleLike = (postId: number) => {
    setLikes(prev => ({
      ...prev,
      [postId]: {
        count: prev[postId].isLiked ? prev[postId].count - 1 : prev[postId].count + 1,
        isLiked: !prev[postId].isLiked
      }
    }));
  };

  const openComments = (postId: number) => {
    setSelectedPostId(postId);
    setIsCommentsOpen(true);
  };

  const closeComments = () => {
    setIsCommentsOpen(false);
    setNewComment("");
  };

  const handleAddComment = () => {
    if (newComment.trim() && selectedPostId !== null) {
      const newCommentObj = {
        id: Date.now(),
        user: "You",
        text: newComment,
        time: "Just now"
      };
      
      setComments(prev => ({
        ...prev,
        [selectedPostId]: [...(prev[selectedPostId] || []), newCommentObj]
      }));
      
      setNewComment("");
    }
  };

  return (
    <IonPage className="community-page">
      <IonHeader className="community-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1" />
          </IonButtons>
          <IonTitle>Community</IonTitle>
        </IonToolbar>

        <IonToolbar className="segment-toolbar">
          <IonSegment
            value={tab}
            onIonChange={(e) =>
              setTab((e.detail.value ?? "challenges") as
                | "challenges"
                | "feed"
                | "groups")
            }
            className="community-segment"
          >
            <IonSegmentButton value="challenges" className="segment-btn">
              <IonIcon icon={trophy} />
              <IonLabel>Challenges</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value="feed" className="segment-btn">
              <IonIcon icon={chatboxEllipses} />
              <IonLabel>Feed</IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value="groups" className="segment-btn">
              <IonIcon icon={people} />
              <IonLabel>Group</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="community-content">
        {tab === "challenges" && (
          <div className="challenges-tab">
            <div className="search-container">
              <IonSearchbar
                placeholder="Search challenges"
                className="challenge-search"
              />
            </div>

            <IonCard className="current-challenge-card">
              <div className="challenge-image-container">
                <IonImg src={ChallengePic} alt="Running Challenge" />
                <div className="challenge-overlay">
                  <h3 className="challenge-title">Running Challenge</h3>
                  <div className="participants">
                    <IonIcon icon={people} className="participants-icon" />
                    <span>1,341 participants</span>
                  </div>
                </div>
              </div>
              <IonCardContent className="challenge-content">
                <div className="progress-section">
                  <span className="progress-label">Current Progress: 65km</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: "65%" }}></div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonButton
              expand="block"
              className="create-challenge-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <IonIcon icon={addOutline} slot="start" />
              Create Challenge
            </IonButton>

            <div className="suggested-section">
              <h2 className="section-title">Suggested Challenge</h2>
              
              <IonCard className="suggested-challenge-card">
                <div className="challenge-image-container">
                  <IonImg src={ChallengePic} alt="April Elevation Challenge" />
                  <div className="suggested-overlay">
                    <IonButton size="small" className="join-challenge-btn">
                      Join Challenge
                    </IonButton>
                  </div>
                </div>
                <IonCardContent className="suggested-content">
                  <h3 className="suggested-title">April Elevation Challenge</h3>
                  <p className="suggested-description">
                    Climb a total of 2,000 m (6,561.7 ft) in a month.
                  </p>
                  <p className="suggested-date">Apr 1, 2025 to Apr 30, 2025</p>
                </IonCardContent>
              </IonCard>

              <IonCard className="suggested-challenge-card">
                <div className="challenge-image-container">
                  <IonImg src={ChallengePic} alt="April Run 300K Challenge" />
                  <div className="suggested-overlay">
                    <IonButton size="small" className="join-challenge-btn">
                      Join Challenge
                    </IonButton>
                  </div>
                </div>
                <IonCardContent className="suggested-content">
                  <h3 className="suggested-title">April Run 300K Challenge</h3>
                  <p className="suggested-description">
                    Run a total of 300 km (186.4 mi) in a month.
                  </p>
                  <p className="suggested-date">Apr 1, 2025 to Apr 30, 2025</p>
                </IonCardContent>
              </IonCard>
            </div>
          </div>
        )}

        {tab === "feed" && (
          <div className="feed-tab">
            <IonCard className="post-input-card">
              <IonItem lines="none">
                <IonAvatar slot="start">
                  <IonImg src={ProfilePic} />
                </IonAvatar>
                <input type="text" placeholder="What's on your mind?" className="post-input" />
              </IonItem>
            </IonCard>

            <div className="feed-posts">
              <IonCard className="post-card">
                <IonCardHeader>
                  <div className="post-header">
                    <IonAvatar>
                      <IonImg src={ProfilePic} />
                    </IonAvatar>
                    <div className="user-info">
                      <span className="username">Adams Smith</span>
                      <span className="timestamp">3 hrs ago</span>
                    </div>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <p className="post-text">Just completed my first 10K! 🏃 Feeling amazing!</p>
                  <IonImg src={ChallengePic} className="post-image" />
                  <div className="post-actions">
                    <div className="action-item" onClick={() => handleLike(1)}>
                      <IonIcon icon={likes[1].isLiked ? heart : heartOutline} style={{ color: likes[1].isLiked ? '#ff4444' : '' }} /> {likes[1].count}
                    </div>
                    <div className="action-item" onClick={() => openComments(1)}>
                      <IonIcon icon={chatbubbleOutline} /> {comments[1].length}
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              <IonCard className="post-card">
                <IonCardHeader>
                  <div className="post-header">
                    <IonAvatar>
                      <IonImg src={ProfilePic} />
                    </IonAvatar>
                    <div className="user-info">
                      <span className="username">Adams Smith</span>
                      <span className="timestamp">4 hrs ago</span>
                    </div>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <p className="post-text">Great run with the team today! Marathon training is on track! 🏃‍♀️🏃‍♂️</p>
                  <IonImg src={ChallengePic} className="post-image" />
                  <div className="post-actions">
                    <div className="action-item" onClick={() => handleLike(2)}>
                      <IonIcon icon={likes[2].isLiked ? heart : heartOutline} style={{ color: likes[2].isLiked ? '#ff4444' : '' }} /> {likes[2].count}
                    </div>
                    <div className="action-item" onClick={() => openComments(2)}>
                      <IonIcon icon={chatbubbleOutline} /> {comments[2].length}
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              <IonCard className="post-card">
                <IonCardHeader>
                  <div className="post-header">
                    <IonAvatar>
                      <IonImg src={ProfilePic} />
                    </IonAvatar>
                    <div className="user-info">
                      <span className="username">Adams Smith</span>
                      <span className="timestamp">5 hrs ago</span>
                    </div>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <p className="post-text">Morning jog in the park. So refreshing! 🌳</p>
                  <IonImg src={ChallengePic} className="post-image" />
                  <div className="post-actions">
                    <div className="action-item" onClick={() => handleLike(3)}>
                      <IonIcon icon={likes[3].isLiked ? heart : heartOutline} style={{ color: likes[3].isLiked ? '#ff4444' : '' }} /> {likes[3].count}
                    </div>
                    <div className="action-item" onClick={() => openComments(3)}>
                      <IonIcon icon={chatbubbleOutline} /> {comments[3].length}
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          </div>
        )}

        {tab === "groups" && (
          <div className="groups-tab">
            <div className="groups-header">
              <IonButton 
                className="create-groups-btn"
                onClick={() => setIsCreateGroupModalOpen(true)}
              >
                Create Groups
              </IonButton>
              <IonSearchbar placeholder="Search groups..." className="group-search" />
            </div>

            <div className="groups-section">
              <h2 className="section-title">Suggested Groups</h2>

              <div className="group-list">
                <IonCard className="group-card">
                  <IonImg src={ChallengePic} alt="Trail Runners Group" />
                  <IonCardContent className="group-overlay">
                    <span className="group-name">Trail Runners</span>
                    <IonButton size="small" className="join-group-btn">Join</IonButton>
                  </IonCardContent>
                </IonCard>

                <IonCard className="group-card">
                  <IonImg src={ChallengePic} alt="Sprint Team Group" />
                  <IonCardContent className="group-overlay">
                    <span className="group-name">Sprint Team</span>
                    <IonButton size="small" className="join-group-btn">Join</IonButton>
                  </IonCardContent>
                </IonCard>

                <IonCard className="group-card">
                  <IonImg src={ChallengePic} alt="Yoga Enthusiasts Group" />
                  <IonCardContent className="group-overlay">
                    <span className="group-name">Yoga Enthusiasts</span>
                    <IonButton size="small" className="join-group-btn">Join</IonButton>
                  </IonCardContent>
                </IonCard>
              </div>
              
              <h2 className="section-title">Your Group</h2>
              <div className="group-list">
                <IonCard routerLink="/group-feed" className="group-card">
                  <IonImg src={ChallengePic} alt="Trail Runners Group" />
                  <IonCardContent className="group-overlay">
                    <span className="group-name">Trail Runners</span>
                  </IonCardContent>
                </IonCard>
              </div>
            </div>
          </div>
        )}

        {/* Create Challenge Modal */}
        <IonModal isOpen={isCreateModalOpen} onDidDismiss={() => setIsCreateModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Create Challenge</IonTitle>
              <IonButton 
                slot="end" 
                fill="clear" 
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="modal-content">
            <div className="create-form">
              <IonItem>
                <IonLabel position="stacked">Challenge Name</IonLabel>
                <IonInput
                  value={challengeName}
                  onIonInput={e => setChallengeName(e.detail.value!)}
                  placeholder="Enter challenge name"
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={challengeDescription}
                  onIonInput={e => setChallengeDescription(e.detail.value!)}
                  placeholder="Describe your challenge"
                  rows={4}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Privacy</IonLabel>
                <IonSelect
                  value={groupPrivacy}
                  onIonChange={e => setGroupPrivacy(e.detail.value!)}
                  placeholder="Select privacy"
                >
                  <IonSelectOption value="public">Public</IonSelectOption>
                  <IonSelectOption value="private">Private</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonButton 
                expand="block" 
                fill="outline"
              >
                <IonIcon slot="start" icon="camera" />
                Add Photo
              </IonButton>
              
              <div className="form-actions">
                <IonButton 
                  expand="block" 
                  className="create-challenge-final-btn"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Create Challenge
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Create Group Modal */}
        <IonModal isOpen={isCreateGroupModalOpen} onDidDismiss={() => setIsCreateGroupModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Create Group</IonTitle>
              <IonButton 
                slot="end" 
                fill="clear" 
                onClick={() => setIsCreateGroupModalOpen(false)}
              >
                Cancel
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="modal-content">
            <div className="create-form">
              <IonItem>
                <IonLabel position="stacked">Group Name</IonLabel>
                <IonInput
                  value={groupName}
                  onIonInput={e => setGroupName(e.detail.value!)}
                  placeholder="Enter group name"
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={groupDescription}
                  onIonInput={e => setGroupDescription(e.detail.value!)}
                  placeholder="Describe your group"
                  rows={4}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Privacy</IonLabel>
                <IonSelect
                  value={groupPrivacy}
                  onIonChange={e => setGroupPrivacy(e.detail.value!)}
                  placeholder="Select privacy"
                >
                  <IonSelectOption value="public">Public</IonSelectOption>
                  <IonSelectOption value="private">Private</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonButton 
                expand="block" 
                fill="outline"
              >
                <IonIcon slot="start" icon="camera" />
                Add Group Photo
              </IonButton>
              
              <div className="form-actions">
                <IonButton 
                  expand="block" 
                  className="create-challenge-final-btn"
                  onClick={() => setIsCreateGroupModalOpen(false)}
                >
                  Create Group
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Comments Modal */}
        <IonModal isOpen={isCommentsOpen} onDidDismiss={closeComments}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Comments</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closeComments}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedPostId && comments[selectedPostId]?.map((comment) => (
              <IonCard key={comment.id}>
                <IonCardContent>
                  <div style={{fontWeight: 'bold', marginBottom: '5px'}}>{comment.user}</div>
                  <div>{comment.text}</div>
                  <div style={{fontSize: '0.85rem', color: '#666', marginTop: '5px'}}>{comment.time}</div>
                </IonCardContent>
              </IonCard>
            ))}
            
            <div style={{position: 'fixed', bottom: '0', left: '0', right: '0', padding: '10px', background: 'var(--ion-background-color, white)', borderTop: '1px solid #535252ff'}}>
              <IonItem>
                <IonTextarea
                  value={newComment}
                  onIonChange={(e) => setNewComment(e.detail.value || "")}
                  placeholder="Write a comment..."
                  autoGrow
                />
              </IonItem>
              <IonButton color="success" expand="block" onClick={handleAddComment} disabled={!newComment.trim()}>
                Post Comment
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Community;