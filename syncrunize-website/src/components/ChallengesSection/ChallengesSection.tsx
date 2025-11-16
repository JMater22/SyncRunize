import React from 'react';
import { IonCard, IonCardContent, IonImg, IonButton } from '@ionic/react';
import './ChallengesSection.css';

interface Challenge {
  challenge_name: string;
  challenge_description: string;
  challenge_image: string;
  challenge_duration_days: number;
  progress_percent: number;
}

interface ChallengesSectionProps {
  challenges: Challenge[];
  onBrowseMore?: () => void;
}

export const ChallengesSection: React.FC<ChallengesSectionProps> = ({ 
  challenges, 
  onBrowseMore 
}) => {
  return (
    <div className="content-section">
      <div className="section-header">
        <h2>Active Challenges</h2>
        <IonButton fill="clear" className="browse-challenges" onClick={onBrowseMore}>
          Browse More
        </IonButton>
      </div>

      <div className="challenges-grid">
        {challenges.length === 0 ? (
          <p>No active challenges yet.</p>
        ) : (
          challenges.map((challenge, i) => (
            <IonCard key={i} className="challenge-card-modern">
              <div className="challenge-image-container">
                <IonImg src={challenge.challenge_image} alt={challenge.challenge_name} />
                <div className="challenge-progress-overlay">
                  <div className="progress-circle">
                    <span className="progress-text">{challenge.progress_percent || 0}%</span>
                  </div>
                </div>
              </div>
              <IonCardContent>
                <h4 className="challenge-title">{challenge.challenge_name}</h4>
                <p className="challenge-target">{challenge.challenge_description}</p>
                <p className="challenge-duration">{challenge.challenge_duration_days} days</p>
              </IonCardContent>
            </IonCard>
          ))
        )}
      </div>
    </div>
  );
};