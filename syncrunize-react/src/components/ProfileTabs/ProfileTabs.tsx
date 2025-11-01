import React from 'react';
import { IonIcon } from '@ionic/react';
import { statsChart, trophy, flame } from 'ionicons/icons';
import './ProfileTabs.css';

type TabType = 'activities' | 'badges' | 'challenges';

interface ProfileTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="nav-tabs-container">
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === "activities" ? "active" : ""}`}
          onClick={() => onTabChange("activities")}
        >
          <IonIcon icon={statsChart} />
          <span>Activities</span>
        </button>
        <button
          className={`nav-tab ${activeTab === "badges" ? "active" : ""}`}
          onClick={() => onTabChange("badges")}
        >
          <IonIcon icon={trophy} />
          <span>Badges</span>
        </button>
        <button
          className={`nav-tab ${activeTab === "challenges" ? "active" : ""}`}
          onClick={() => onTabChange("challenges")}
        >
          <IonIcon icon={flame} />
          <span>Challenges</span>
        </button>
      </div>
    </div>
  );
};