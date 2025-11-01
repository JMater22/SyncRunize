import React from 'react';
import { IonImg } from '@ionic/react';
import './ProfileHeader.css';

interface ProfileHeaderProps {
  banner: string;
  profilePic: string;
  name: string;
  description: string;
  followersCount: number;
  followingCount: number;
  activitiesCount: number;
  onFollowersClick: (type: 'followers' | 'following') => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  banner,
  profilePic,
  name,
  description,
  followersCount,
  followingCount,
  activitiesCount,
  onFollowersClick
}) => {
  return (
    <div className="profile-header-section">
      <div className="banner-container">
        <IonImg src={banner} alt="Banner" className="banner-image" />
        <div className="banner-overlay"></div>
      </div>
      
      <div className="profile-info-card">
        <div className="profile-avatar-container">
          <IonImg src={profilePic} alt="Profile" className="profile-avatar" />
          <div className="online-indicator"></div>
        </div>
        
        <div className="profile-details">
          <div className="profile-text">
            <h1 className="profile-name">{name}</h1>
            <p className="profile-username">@{name.toLowerCase()}</p>
            <div className="profile-bio">
              <span>{description}</span>
            </div>
          </div>
          
          <div className="profile-stats-row">
            <div 
              className="stat-item clickable-stat" 
              onClick={() => onFollowersClick("followers")}
            >
              <span className="stat-number">{followersCount}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-divider"></div>
            <div  
              className="stat-item clickable-stat" 
              onClick={() => onFollowersClick("following")}
            >
              <span className="stat-number">{followingCount}</span>
              <span className="stat-label">Following</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{activitiesCount}</span>
              <span className="stat-label">Activities</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};