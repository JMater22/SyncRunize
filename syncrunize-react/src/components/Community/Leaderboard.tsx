import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { arrowBack, refresh } from "ionicons/icons";
import "./Leaderboard.css";

interface User {
  name: string;
  company: string;
  totalDistance: number;
  rankChange: number;
  isCurrentUser: boolean;
}

const Leaderboard: React.FC = () => {
  // ✅ Initial user data
  const [users, setUsers] = useState<User[]>([
    { name: "Floyd Miles", company: "Springworks", totalDistance: 2914, rankChange: 0, isCurrentUser: false },
    { name: "Wade Warren", company: "Microsoft", totalDistance: 2900, rankChange: 5, isCurrentUser: false },
    { name: "Esther Howard", company: "Springworks", totalDistance: 1664, rankChange: 0, isCurrentUser: true },
    { name: "Guy Hawkins", company: "Springworks", totalDistance: 2284, rankChange: 0, isCurrentUser: false },
    { name: "Devon Lane", company: "Springworks", totalDistance: 2466, rankChange: -2, isCurrentUser: false },
    { name: "Jane Cooper", company: "Zoho", totalDistance: 2089, rankChange: -2, isCurrentUser: false },
    { name: "Savannah Nguyen", company: "Springworks", totalDistance: 2100, rankChange: -3, isCurrentUser: false },
    { name: "Robert Fox", company: "Google", totalDistance: 1554, rankChange: 1, isCurrentUser: false },
  ]);

  // ✅ Sort users by distance
  const sortedUsers = [...users].sort((a, b) => b.totalDistance - a.totalDistance);

  // ✅ Handle refresh button
  const handleRefresh = () => {
    const updated = users.map((u) => ({
      ...u,
      totalDistance: Math.floor(Math.random() * 2000) + 1000,
      rankChange: Math.floor(Math.random() * 11) - 5,
    }));
    setUsers(updated);
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        {/* Go Back */}
        <div className="go-back-container">
          <IonButton routerLink="/group-feed" fill="clear" className="go-back-btn">
            <IonIcon icon={arrowBack} slot="start" />
            Go Back
          </IonButton>
        </div>

        {/* Top 3 */}
        <div className="top-3-container">
          {sortedUsers[1] && (
            <div className="top-user-card second-place">
              <span className="rank-badge">2</span>
              <div className="user-info">
                <div className="user-avatar"></div>
                <p className="user-name">{sortedUsers[1].name}</p>
                <p className="user-score">{sortedUsers[1].totalDistance}</p>
              </div>
            </div>
          )}

          {sortedUsers[0] && (
            <div className="top-user-card first-place">
              <span className="rank-badge">1</span>
              <div className="user-info">
                <div className="user-avatar"></div>
                <p className="user-name">{sortedUsers[0].name}</p>
                <p className="user-score">{sortedUsers[0].totalDistance}</p>
              </div>
            </div>
          )}

          {sortedUsers[2] && (
            <div className="top-user-card third-place">
              <span className="rank-badge">3</span>
              <div className="user-info">
                <div className="user-avatar"></div>
                <p className="user-name">{sortedUsers[2].name}</p>
                <p className="user-score">{sortedUsers[2].totalDistance}</p>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard List */}
        <div className="leaderboard-container">
          <div className="ranking-list-container">
            <div className="ranking-header">
              <h2>Ranking</h2>
              <div className="ranking-options">
                <span className="active">THIS WEEK</span>
                <span>THIS MONTH</span>
                <span>ALL TIME</span>
              </div>
              <IonButton fill="clear" className="refresh-btn" onClick={handleRefresh}>
                <IonIcon icon={refresh} />
              </IonButton>
            </div>

            <ul id="leaderboard-list">
              {sortedUsers.map((user, index) => {
                let rankChangeClass = "neutral";
                let rankChangeText = "--";
                if (user.rankChange > 0) {
                  rankChangeClass = "positive";
                  rankChangeText = `+${user.rankChange}`;
                } else if (user.rankChange < 0) {
                  rankChangeClass = "negative";
                  rankChangeText = `${user.rankChange}`;
                }

                return (
                  <li
                    key={index}
                    className={`leaderboard-item ${user.isCurrentUser ? "highlight" : ""}`}
                  >
                    <div className="user-details">
                      <div className="avatar"></div>
                      <span className="name">{user.name}</span>
                    </div>
                    <div className="rank-info">
                      <span className="total-distance">Total Distance: {user.totalDistance} KM</span>
                      <span className={`rank-change ${rankChangeClass}`}>Rank: {rankChangeText}</span>
                    </div>
                    <span className="company">{user.company}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Leaderboard;
