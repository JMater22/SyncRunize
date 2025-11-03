import React from "react";
import {
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonAvatar,
  IonImg,
  IonIcon
} from "@ionic/react";
import { heartOutline, heart, chatbubbleOutline } from "ionicons/icons";

interface PostCardProps {
  id: number;
  username: string;
  timestamp: string;
  content: string;
  imageSrc: string;
  profilePic: string;
  likes: {
    count: number;
    isLiked: boolean;
  };
  commentCount: number;
  onLike: (postId: number) => void;
  onOpenComments: (postId: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  username,
  timestamp,
  content,
  imageSrc,
  profilePic,
  likes,
  commentCount,
  onLike,
  onOpenComments
}) => {
  return (
    <IonCard className="post-card">
      <IonCardHeader>
        <div className="post-header">
          <IonAvatar>
            <IonImg src={profilePic} />
          </IonAvatar>
          <div className="user-info">
            <span className="username">{username}</span>
            <span className="timestamp">{timestamp}</span>
          </div>
        </div>
      </IonCardHeader>
      <IonCardContent>
        <p className="post-text">{content}</p>
        <IonImg src={imageSrc} className="post-image" />
        <div className="post-actions">
          <div className="action-item" onClick={() => onLike(id)}>
            <IonIcon 
              icon={likes.isLiked ? heart : heartOutline} 
              style={{ color: likes.isLiked ? '#ff4444' : '' }} 
            /> 
            {likes.count}
          </div>
          <div className="action-item" onClick={() => onOpenComments(id)}>
            <IonIcon icon={chatbubbleOutline} /> {commentCount}
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default PostCard;