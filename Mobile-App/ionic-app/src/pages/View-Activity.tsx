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
  IonTextarea
} from "@ionic/react";
import {
  heartOutline,
  heart,
  chatbubbleOutline
} from "ionicons/icons";

import ChallengePic from '../components/assets/istockphoto-143920084-612x612.jpg';
import ProfilePic from '../components/assets/close-up-portrait-serious-man-with-curly-hair.jpg';

const ViewActivity: React.FC = () => {
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
    <IonPage>
      {/* Top Header */}
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/HomeModule/homeM1" />
          </IonButtons>
          <IonTitle>Activities</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Content */}
      <IonContent fullscreen className="ion-padding">
        <div className="feed-tab">


          {/* Feed Posts */}
          <div className="feed-posts">
            {/* Post 1 */}
            <IonCard className="post-card">
              <IonCardHeader>
                <div className="post-header" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <IonAvatar>
                    <IonImg src={ProfilePic} />
                  </IonAvatar>
                  <div className="user-info">
                    <div style={{fontWeight: 'bold'}}>Adams Smith</div>
                    <div style={{fontSize: '0.85rem', color: '#666'}}>3 hrs ago</div>
                  </div>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <p className="post-text">Just completed my first 10K! 🏃 Feeling amazing!</p>
                <IonImg src={ChallengePic} className="post-image" style={{borderRadius: '8px', marginTop: '10px'}} />
                <div className="post-actions" style={{display: 'flex', gap: '20px', marginTop: '15px', padding: '10px 0', borderTop: '1px solid #eee'}}>
                  <div 
                    className="action-item" 
                    onClick={() => handleLike(1)}
                    style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                  >
                    <IonIcon icon={likes[1].isLiked ? heart : heartOutline} color={likes[1].isLiked ? "danger" : "medium"} /> 
                    <span>{likes[1].count}</span>
                  </div>
                  <div 
                    className="action-item" 
                    onClick={() => openComments(1)}
                    style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                  >
                    <IonIcon icon={chatbubbleOutline} color="medium" /> 
                    <span>{comments[1].length}</span>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Post 2 */}
            <IonCard className="post-card">
              <IonCardHeader>
                <div className="post-header" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <IonAvatar>
                    <IonImg src={ProfilePic} />
                  </IonAvatar>
                  <div className="user-info">
                    <div style={{fontWeight: 'bold'}}>Adams Smith</div>
                    <div style={{fontSize: '0.85rem', color: '#666'}}>4 hrs ago</div>
                  </div>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <p className="post-text">Great run with the team today! Marathon training is on track! 🏃‍♀️🏃‍♂️</p>
                <IonImg src={ChallengePic} className="post-image" style={{borderRadius: '8px', marginTop: '10px'}} />
                <div className="post-actions" style={{display: 'flex', gap: '20px', marginTop: '15px', padding: '10px 0', borderTop: '1px solid #eee'}}>
                  <div 
                    className="action-item" 
                    onClick={() => handleLike(2)}
                    style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                  >
                    <IonIcon icon={likes[2].isLiked ? heart : heartOutline} color={likes[2].isLiked ? "danger" : "medium"} /> 
                    <span>{likes[2].count}</span>
                  </div>
                  <div 
                    className="action-item" 
                    onClick={() => openComments(2)}
                    style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                  >
                    <IonIcon icon={chatbubbleOutline} color="medium" /> 
                    <span>{comments[2].length}</span>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Post 3 */}
            <IonCard className="post-card">
              <IonCardHeader>
                <div className="post-header" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <IonAvatar>
                    <IonImg src={ProfilePic} />
                  </IonAvatar>
                  <div className="user-info">
                    <div style={{fontWeight: 'bold'}}>Adams Smith</div>
                    <div style={{fontSize: '0.85rem', color: '#666'}}>5 hrs ago</div>
                  </div>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <p className="post-text">Morning jog in the park. So refreshing! 🌳</p>
                <IonImg src={ChallengePic} className="post-image" style={{borderRadius: '8px', marginTop: '10px'}} />
                <div className="post-actions" style={{display: 'flex', gap: '20px', marginTop: '15px', padding: '10px 0', borderTop: '1px solid #eee'}}>
                  <div 
                    className="action-item" 
                    onClick={() => handleLike(3)}
                    style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                  >
                    <IonIcon icon={likes[3].isLiked ? heart : heartOutline} color={likes[3].isLiked ? "danger" : "medium"} /> 
                    <span>{likes[3].count}</span>
                  </div>
                  <div 
                    className="action-item" 
                    onClick={() => openComments(3)}
                    style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}
                  >
                    <IonIcon icon={chatbubbleOutline} color="medium" /> 
                    <span>{comments[3].length}</span>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
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
      </IonContent>
    </IonPage>
  );
};

export default ViewActivity;