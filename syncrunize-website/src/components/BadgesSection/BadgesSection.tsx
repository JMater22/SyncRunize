import React from 'react';
import { IonCard, IonCardContent, IonImg, IonSpinner } from '@ionic/react';
import './BadgesSection.css';

interface Badge {
  title: string;
  description: string;
  tier: string;
  date: string;
  image: string;
}

interface BadgesSectionProps {
  badges: Badge[];
  loading: boolean;
}

export const BadgesSection: React.FC<BadgesSectionProps> = ({ badges, loading }) => {
  if (loading) {
    return (
      <div className="loading-center">
        <IonSpinner name="crescent" />
        <p>Loading badges...</p>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="loading-center">
        <p>No badges earned yet. Complete challenges to earn badges!</p>
      </div>
    );
  }

  return (
    <div className="content-section">
      <div className="section-header">
        <h2>Achievement Badges</h2>
        <span className="badge-count">{badges.length} earned</span>
      </div>

      <div className="badges-grid">
        {badges.map((badge, i) => (
          <IonCard key={i} className="badge-card-modern">
            <div className={`badge-glow ${badge.tier.toLowerCase()}`}></div>
            <IonImg src={badge.image} alt={badge.title} className="badge-image" />
            <IonCardContent>
              <h4 className="badge-title">{badge.title}</h4>
              <p className="badge-description">{badge.description}</p>
              <div className="badge-earned">Earned {badge.date}</div>
            </IonCardContent>
          </IonCard>
        ))}
      </div>
    </div>
  );
};