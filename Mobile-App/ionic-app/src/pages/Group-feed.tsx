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
  IonItem,
  IonAvatar,
  IonImg,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonModal,
  IonTextarea,
  IonActionSheet,
  IonAlert,
  IonToast,
  IonBadge
} from "@ionic/react";
import {
  heartOutline,
  heart,
  chatbubbleOutline,
  ellipsisVertical,
  exitOutline
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import ChallengePic from '../components/assets/istockphoto-143920084-612x612.jpg';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';
import { usePushNotifications } from "../components/push-notification";
import { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

interface Post {
  id: number;
  user: string;
  time: string;
  text: string;
  image: string;
}

const GroupFeed: React.FC = () => {
  const history = useHistory();
  
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

  // Posts state for dynamic additions
  const [posts, setPosts] = useState<Post[]>([
    { id: 1, user: "Adams Smith", time: "3 hrs ago", text: "Just completed my first 10K! 🏃 Feeling amazing!", image: ChallengePic },
    { id: 2, user: "Adams Smith", time: "4 hrs ago", text: "Great run with the team today! Marathon training is on track! 🏃‍♀️🏃‍♂️", image: ChallengePic },
    { id: 3, user: "Adams Smith", time: "5 hrs ago", text: "Morning jog in the park. So refreshing! 🌳", image: ChallengePic }
  ]);

  // Push notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [newPostsCount, setNewPostsCount] = useState(0);

  // Leave Group state
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);

  // Initialize push notifications
  usePushNotifications({
    onTokenReceived: (token) => {
      console.log("[GroupFeed] FCM Token received:", token);
      // Send token to your backend to register for group activity notifications
      // e.g., sendTokenToBackend(token, 'group_feed', groupId);
    },
    onNotificationReceived: (notification: PushNotificationSchema) => {
      console.log("[GroupFeed] Notification received:", notification);
      
      // Handle different types of group notifications
      if (notification.data?.type === 'new_post') {
        setToastMessage(`${notification.data.username} posted in the group`);
        setShowToast(true);
        setNewPostsCount(prev => prev + 1);
        
        // Add new post to feed
        const newPost: Post = {
          id: Date.now(),
          user: notification.data.username || "Group Member",
          time: "Just now",
          text: notification.body || "New post",
          image: notification.data.imageUrl || ChallengePic
        };
        setPosts(prev => [newPost, ...prev]);
        
        // Initialize likes and comments for new post
        setLikes(prev => ({ ...prev, [newPost.id]: { count: 0, isLiked: false } }));
        setComments(prev => ({ ...prev, [newPost.id]: [] }));
      } 
      else if (notification.data?.type === 'new_comment') {
        setToastMessage(`${notification.data.username} commented on a post`);
        setShowToast(true);
        
        // Add comment to the specific post
        const postId = parseInt(notification.data.postId);
        if (postId) {
          const newCommentObj = {
            id: Date.now(),
            user: notification.data.username,
            text: notification.body || "",
            time: "Just now"
          };
          setComments(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), newCommentObj]
          }));
        }
      }
      else if (notification.data?.type === 'post_like') {
        setToastMessage(`${notification.data.username} liked your post`);
        setShowToast(true);
      }
      else if (notification.data?.type === 'group_announcement') {
        setToastMessage(`Group Admin: ${notification.body}`);
        setShowToast(true);
      }
    },
    onNotificationActionPerformed: (notification: ActionPerformed) => {
      console.log("[GroupFeed] Notification tapped:", notification);
      
      // Navigate to specific post if postId is provided
      if (notification.notification.data?.postId) {
        const postId = parseInt(notification.notification.data.postId);
        openComments(postId);
      }
      
      // Clear new posts count when user opens the app
      setNewPostsCount(0);
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

  const handleLeaveGroup = () => {
    console.log("User left the group");
    history.push("/HomeModule/homeM1");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1" />
          </IonButtons>
          <IonTitle>
            Group Feed
            {newPostsCount > 0 && (
              <IonBadge color="danger" style={{ marginLeft: '8px', verticalAlign: 'super' }}>
                {newPostsCount}
              </IonBadge>
            )}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowActionSheet(true)}>
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div className="feed-tab">
          {/* Post Creation Input */}
          <IonCard className="post-input-card" routerLink="/create-post">
            <IonItem lines="none">
              <IonAvatar slot="start">
                <IonImg src={ProfilePic} />
              </IonAvatar>
              <input 
                type="text" 
                placeholder="What's on your mind?" 
                className="post-input" 
                style={{border: 'none', outline: 'none', width: '100%', padding: '10px'}} 
                readOnly 
              />
            </IonItem>
          </IonCard>

          {/* Feed Posts */}
          <div className="feed-posts">
            {posts.map((post) => (
              <IonCard key={post.id} className="post-card">
                <IonCardHeader>
                  <div className="post-header" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <IonAvatar>
                      <IonImg src={ProfilePic} />
                    </IonAvatar>
                    <div className="user-info">
                      <div style={{fontWeight: 'bold'}}>{post.user}</div>
                      <div style={{fontSize: '0.85rem', color: '#666'}}>{post.time}</div>
                    </div>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  <p className="post-text">{post.text}</p>
                  <IonImg src={post.image} className="post-image" style={{borderRadius: '8px', marginTop: '10px'}} />
                  <div className="post-actions" style={{display: 'flex', gap: '20px', marginTop: '15px', padding: '10px 0', borderTop: '1px solid #eee'}}>
                    <div 
                      className="action-item" 
                      onClick={() => handleLike(post.id)}
                      style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                    >
                      <IonIcon 
                        icon={likes[post.id]?.isLiked ? heart : heartOutline} 
                        color={likes[post.id]?.isLiked ? "danger" : "medium"} 
                      /> 
                      <span>{likes[post.id]?.count || 0}</span>
                    </div>
                    <div 
                      className="action-item" 
                      onClick={() => openComments(post.id)}
                      style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                    >
                      <IonIcon icon={chatbubbleOutline} color="medium" /> 
                      <span>{comments[post.id]?.length || 0}</span>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        </div>

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
            
            <div style={{position: 'fixed', bottom: '0', left: '0', right: '0', padding: '10px', background: 'black', borderTop: '1px solid #535252ff'}}>
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

        {/* Action Sheet for Group Options */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: 'Leave Group',
              role: 'destructive',
              icon: exitOutline,
              handler: () => {
                setShowLeaveAlert(true);
              }
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />

        {/* Leave Group Confirmation Alert */}
        <IonAlert 
          isOpen={showLeaveAlert}
          onDidDismiss={() => setShowLeaveAlert(false)}
          header="Leave Group"
          message="Are you sure you want to leave this group? You won't be able to see posts or participate anymore."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Leave',
              role: 'destructive',
              handler: handleLeaveGroup
            }
          ]}
        />

        {/* Toast for Push Notifications */}
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

export default GroupFeed;