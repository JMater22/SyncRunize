import React from "react";
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonImg,
  IonIcon
} from "@ionic/react";
import { people } from "ionicons/icons";

interface ChallengeCardProps {
  id: string;
  title: string;
  description: string;
  targetDistance: string;
  duration: string;
  imageSrc: string;
  isJoined: boolean;
  progress?: number;
  onJoinToggle: (id: string) => void;
  isCurrent?: boolean;
  participants?: number;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  id,
  title,
  description,
  targetDistance,
  duration,
  imageSrc,
  isJoined,
  progress = 0,
  onJoinToggle,
  isCurrent = false,
  participants
}) => {
  if (isCurrent) {
    return (
      <IonCard className="current-challenge-card">
        <div className="challenge-image-container">
          <IonImg src={imageSrc} alt={title} />
          <div className="challenge-overlay">
            <h3 className="challenge-title">{title}</h3>
            {participants && (
              <div className="participants">
                <IonIcon icon={people} className="participants-icon" />
                <span>{participants.toLocaleString()} participants</span>
              </div>
            )}
          </div>
        </div>
        <IonCardContent className="challenge-content">
          <div className="progress-section">
            <span className="progress-label">Current Progress: {targetDistance}</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard className="suggested-challenge-card">
      <div className="challenge-image-container">
        <IonImg src={imageSrc} alt={title} />
        <div className="suggested-overlay">
          <IonButton 
            size="small" 
            className="join-challenge-btn"
            onClick={() => onJoinToggle(id)}
          >
            {isJoined ? 'Leave Challenge' : 'Join Challenge'}
          </IonButton>
        </div>
      </div>
      <IonCardContent className="suggested-content">
        <h3 className="suggested-title">{title}</h3>
        <p className="suggested-description">{description}</p>
        <p className="suggested-date">
          <span>Target Distance: {targetDistance}</span> • Duration: {duration}
        </p>
        
        {isJoined && (
          <div className="progress-section" style={{marginTop: '15px'}}>
            <span className="progress-label">Your Progress: {progress}%</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default ChallengeCard;