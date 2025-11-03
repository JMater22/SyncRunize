import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
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
  IonBackButton,
  IonButtons,
  IonCardContent,
  IonToast
} from "@ionic/react";
import {
  trophy,
  chatboxEllipses,
  people
} from "ionicons/icons";
import ChallengeCard from "../components/challenge-card";
import PostCard from "../components/post-card";
import GroupCard from "../components/group-card";
import { challenges } from "../components/challenge-data";
import { posts } from "../components/post-data";
import { suggestedGroups, joinedGroups } from "../components/group-data";
import ChallengePic from "../components/assets/istockphoto-143920084-612x612.jpg";
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import { usePushNotifications } from "../components/push-notification";
import "../theme/Community.css";

const Community: React.FC = () => {
  const [tab, setTab] = useState<"challenges" | "feed" | "groups">("challenges");
  
  // Challenge join state with progress tracking
  const [joinedChallenges, setJoinedChallenges] = useState<{[key: string]: {joined: boolean, progress: number}}>({});
  
  // Create Group Modal state
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  
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

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Initialize push notifications
  usePushNotifications({
    onNotificationReceived: (notification) => {
      // Handle notification received while app is in foreground
      console.log('Notification received:', notification);
      setToastMessage(notification.title || 'New notification');
      setShowToast(true);
    },
    onNotificationActionPerformed: (notification) => {
      // Handle notification tap
      console.log('Notification tapped:', notification);
      
      // Navigate based on notification data
      const data = notification.notification.data;
      if (data?.type === 'comment') {
        setTab('feed');
      } else if (data?.type === 'challenge') {
        setTab('challenges');
      } else if (data?.type === 'group') {
        setTab('groups');
      }
    }
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

  const handleJoinChallenge = (challengeId: string) => {
    setJoinedChallenges(prev => {
      const isCurrentlyJoined = prev[challengeId]?.joined;
      
      if (isCurrentlyJoined) {
        const { [challengeId]: removed, ...rest } = prev;
        return rest;
      } else {
        return {
          ...prev,
          [challengeId]: {
            joined: true,
            progress: 0
          }
        };
      }
    });
  };

  const handleJoinGroup = (groupId: string) => {
    console.log(`Joining group: ${groupId}`);
    // Add your join group logic here
  };

  return (
    <IonPage className="community-page">
      <IonHeader className="community-header">
        <IonToolbar>
          <IonButtons slot="start">
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
              
            <ChallengeCard
              id="current-challenge"
              title="Couch to 5k"
              description=""
              targetDistance="5km"
              duration=""
              imageSrc={ChallengePic}
              isJoined={true}
              progress={80}
              onJoinToggle={() => {}}
              isCurrent={true}
              participants={1341}
            />

            <div className="suggested-section">
              <h2 className="section-title">Suggested Challenge</h2>
              
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  id={challenge.id}
                  title={challenge.title}
                  description={challenge.description}
                  targetDistance={challenge.targetDistance}
                  duration={challenge.duration}
                  imageSrc={ChallengePic}
                  isJoined={joinedChallenges[challenge.id]?.joined || false}
                  progress={joinedChallenges[challenge.id]?.progress || 0}
                  onJoinToggle={handleJoinChallenge}
                />
              ))}
            </div>
          </div>
        )}

        {tab === "feed" && (
          <div className="feed-tab">
            <IonCard className="post-input-card" routerLink="/create-post">
              <IonItem lines="none">
                <IonAvatar slot="start">
                  <IonImg src={ProfilePic} />
                </IonAvatar>
                <input type="text" placeholder="What's on your mind?" className="post-input" readOnly />
              </IonItem>
            </IonCard>

            <div className="feed-posts">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  username={post.username}
                  timestamp={post.timestamp}
                  content={post.content}
                  imageSrc={ChallengePic}
                  profilePic={ProfilePic}
                  likes={likes[post.id]}
                  commentCount={comments[post.id]?.length || 0}
                  onLike={handleLike}
                  onOpenComments={openComments}
                />
              ))}
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
                {suggestedGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    name={group.name}
                    imageSrc={ChallengePic}
                    showJoinButton={true}
                    onJoin={() => handleJoinGroup(group.id)}
                  />
                ))}
              </div>
              
              <h2 className="section-title">Your Group</h2>
              <div className="group-list">
                {joinedGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    name={group.name}
                    imageSrc={ChallengePic}
                    routerLink="/group-feed"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

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

        {/* Toast for notifications */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color="primary"
        />
      </IonContent>
    </IonPage>
  );
};

export default Community;