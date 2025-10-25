import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from "@ionic/react";
import {
  location,
  chatbubbles,
} from "ionicons/icons";
import "./GroupFeed.css";

// Import local images
import BannerImage from "../../assets/Banner UP.png";
import GroupImage from "../../assets/GROUP 1.png";
import ProfileImage from "../../assets/MAN5.png";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  distance: string;
  runs: number;
  longest: string;
}

interface Member {
  id: number;
  name: string;
  location: string;
  avatar: string;
  isAdmin?: boolean;
}

const GroupFeed: React.FC = () => {
  const [activeSegment, setActiveSegment] = useState<string>("leaderboard");

  const lastWeekLeaders = {
    distance: [
      { name: "Amir Haha", avatar: ProfileImage, value: "130.5 km" },
      { name: "Hero Berms", avatar: ProfileImage, value: "70.9 km" },
      { name: "Carl Tayag", avatar: ProfileImage, value: "66.6 km" },
    ],
    time: [
      { name: "Jam Losañez", avatar: ProfileImage, value: "96:10:49" },
      { name: "Amir Haha", avatar: ProfileImage, value: "22:55:10" },
      { name: "PATRICK JARV", avatar: ProfileImage, value: "7:51:55" },
    ],
  };

  const thisWeekLeaderboard: LeaderboardEntry[] = [
    { rank: 1, name: "Amir Haha", avatar: ProfileImage, distance: "69.9 km", runs: 6, longest: "21.2 km" },
    { rank: 2, name: "Carl Tayag", avatar: ProfileImage, distance: "49.3 km", runs: 5, longest: "12.3 km" },
    { rank: 3, name: "Darrell Castro", avatar: ProfileImage, distance: "48.4 km", runs: 4, longest: "18.0 km" },
    { rank: 4, name: "Derick Climaco", avatar: ProfileImage, distance: "47.2 km", runs: 3, longest: "32.2 km" },
    { rank: 5, name: "Callifter Eugenio", avatar: ProfileImage, distance: "43.0 km", runs: 5, longest: "12.0 km" },
    { rank: 6, name: "Michael John Agustin", avatar: ProfileImage, distance: "41.2 km", runs: 3, longest: "21.0 km" },
    { rank: 7, name: "Pima", avatar: ProfileImage, distance: "39.9 km", runs: 4, longest: "17.8 km" },
    { rank: 8, name: "Joypsii", avatar: ProfileImage, distance: "39.7 km", runs: 7, longest: "15.0 km" },
    { rank: 9, name: "Gil Timothy Lactaoen", avatar: ProfileImage, distance: "39.0 km", runs: 4, longest: "12.0 km" },
  ];

  const clubMembers: Member[] = [
    { id: 1, name: "Yobs V. Cabrera", location: "Tarlac City, Tarlac, Philippines", avatar: ProfileImage, isAdmin: true },
    { id: 2, name: "Aaron Andres", location: "Mabalacat, Pampanga, Philippines", avatar: ProfileImage },
    { id: 3, name: "Aaron Castañeda", location: "Tarlac, Central Luzon, Philippines", avatar: ProfileImage },
    { id: 4, name: "Aaron Gomez", location: "Cabanatuan City, Central Luzon, Philippines", avatar: ProfileImage },
    { id: 5, name: "Ace Ronald Ampong", location: "Tarlac, TARLAC", avatar: ProfileImage },
    { id: 6, name: "Adhi Abana", location: "Mabalacat City, Central Luzon, Philippines", avatar: ProfileImage },
    { id: 7, name: "Aenean Cay", location: "Capas, Tarlac, Philippines", avatar: ProfileImage },
    { id: 8, name: "Aeron Belleza", location: "Tarlac City, Central Luzon, Philippines", avatar: ProfileImage },
    { id: 9, name: "Allan Rey Agustin", location: "Aurora, Isabela, Philippines", avatar: ProfileImage },
    { id: 10, name: "Ajay Guileb", location: "Gerona, Tarlac, Philippines", avatar: ProfileImage },
    { id: 11, name: "Aldrin Acob", location: "Gerona, Tarlac, Philippines", avatar: ProfileImage },
    { id: 12, name: "Alex Martinez", location: "San Jose, Tarlac, Philippines", avatar: ProfileImage },
    { id: 13, name: "Angelo Santos", location: "Bamban, Tarlac, Philippines", avatar: ProfileImage },
    { id: 14, name: "Benjamin Cruz", location: "Concepcion, Tarlac, Philippines", avatar: ProfileImage },
    { id: 15, name: "Carlos Reyes", location: "Victoria, Tarlac, Philippines", avatar: ProfileImage },
    { id: 16, name: "Daniel Garcia", location: "Paniqui, Tarlac, Philippines", avatar: ProfileImage },
    { id: 17, name: "Edward Flores", location: "La Paz, Tarlac, Philippines", avatar: ProfileImage },
    { id: 18, name: "Francis Lopez", location: "Camiling, Tarlac, Philippines", avatar: ProfileImage },
    { id: 19, name: "Gabriel Torres", location: "Mayantoc, Tarlac, Philippines", avatar: ProfileImage },
    { id: 20, name: "Henry Pascual", location: "Capas, Tarlac, Philippines", avatar: ProfileImage },
  ];

  return (
    <IonPage>
      <IonContent>
        {/* Hero Banner */}
        <div className="club-hero-banner">
          <img 
            src={BannerImage}
            alt="Club banner" 
            className="hero-image"
          />
          <div className="club-hero-overlay">
            <div className="club-hero-content">
              <div className="club-avatar">
                <img 
                  src={GroupImage}
                  alt="Club logo" 
                />
              </div>
              <div className="club-info">
                <h1 className="club-name">Tarlac City Runners</h1>
                <div className="club-location">
                  <IonIcon icon={location} />
                  <span>Tarlac City, Tarlac, Philippines</span>
                </div>
                <p className="club-description">Let's Run Tarlakenos</p>
              </div>
              <IonButton className="join-club-btn">
                Join Club
              </IonButton>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="club-navigation">
          <IonSegment value={activeSegment} onIonChange={(e) => setActiveSegment(e.detail.value as string)}>
            <IonSegmentButton value="leaderboard">
              <IonLabel>Club Leaderboard</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="members">
              <IonLabel>Members</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="posts">
              <IonLabel>Posts <span className="post-count">57 NEW</span></IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Main Content Area */}
        <div className="club-main-content">
          <div className="club-content-grid">
            {/* Left Content */}
            <div className="club-left-content">
              {activeSegment === "leaderboard" && (
                <>
                  {/* Last Week's Leaders */}
                  <section className="leaders-section">
                    <h2 className="section-heading">Last Week's Leaders</h2>
                    <div className="leaders-grid">
                      {/* Distance */}
                      <div className="leader-category">
                        <h3 className="category-title">Distance</h3>
                        {lastWeekLeaders.distance.map((leader, index) => (
                          <div key={index} className="leader-item">
                            <div className="leader-medal">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</div>
                            <img src={leader.avatar} alt={leader.name} className="leader-avatar" />
                            <span className="leader-name">{leader.name}</span>
                            <span className="leader-value">{leader.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total Running Time */}
                      <div className="leader-category">
                        <h3 className="category-title">Total Running Time</h3>
                        {lastWeekLeaders.time.map((leader, index) => (
                          <div key={index} className="leader-item">
                            <div className="leader-medal">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</div>
                            <img src={leader.avatar} alt={leader.name} className="leader-avatar" />
                            <span className="leader-name">{leader.name}</span>
                            <span className="leader-value">{leader.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* This Week's Leaderboard */}
                  <section className="leaderboard-section">
                    <div className="leaderboard-header">
                      <h2 className="section-heading">This Week's Leaderboard</h2>
                      <div className="week-toggle">
                        <button className="week-btn">Last Week</button>
                        <button className="week-btn active">This Week</button>
                      </div>
                    </div>

                    <div className="leaderboard-table">
                      <div className="table-header">
                        <div className="th rank-col">Rank</div>
                        <div className="th athlete-col">Athlete</div>
                        <div className="th">Distance ▼</div>
                        <div className="th">Runs</div>
                        <div className="th">Longest ▼</div>
                      </div>

                      {thisWeekLeaderboard.map((entry) => (
                        <div key={entry.rank} className="table-row">
                          <div className="td rank-col">{entry.rank}</div>
                          <div className="td athlete-col">
                            <img src={entry.avatar} alt={entry.name} className="athlete-avatar" />
                            <span className="athlete-name">{entry.name}</span>
                          </div>
                          <div className="td">{entry.distance}</div>
                          <div className="td">{entry.runs}</div>
                          <div className="td">{entry.longest}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {activeSegment === "members" && (
                <div className="members-content">
                  {/* Invite Section */}
                  <div className="invite-section">
                    <div className="invite-header">
                      <h2 className="section-heading">Invite Athletes to This Club</h2>
                      <IonButton className="invite-btn-inline">
                        Invite Athletes
                      </IonButton>
                    </div>
                    <p className="invite-description">
                      The bigger your Club, the more fun you can have. Compare your training,
                      view recent accomplishments, and chat with Club members.
                    </p>
                  </div>

                  {/* Admins Section */}
                  <section className="admins-section">
                    <h3 className="subsection-heading">Admins</h3>
                    <div className="members-list">
                      {clubMembers.filter(member => member.isAdmin).map((admin) => (
                        <div key={admin.id} className="member-item">
                          <img src={admin.avatar} alt={admin.name} className="member-avatar" />
                          <div className="member-info">
                            <span className="member-name">{admin.name}</span>
                            <span className="member-location">{admin.location}</span>
                          </div>
                          <span className="member-badge">Owner</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Members Section */}
                  <section className="members-list-section">
                    <h3 className="subsection-heading">Members</h3>
                    <div className="members-list">
                      {clubMembers.filter(member => !member.isAdmin).map((member) => (
                        <div key={member.id} className="member-item">
                          <img src={member.avatar} alt={member.name} className="member-avatar" />
                          <div className="member-info">
                            <span className="member-name">{member.name}</span>
                            <span className="member-location">{member.location}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeSegment === "posts" && (
                <div className="empty-state">
                  <IonIcon icon={chatbubbles} className="empty-icon" />
                  <p>Club posts will appear here</p>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="club-right-sidebar">
              <div className="invite-card">
                <h3 className="invite-title">Invite Athletes to This Club</h3>
                <IonButton className="invite-btn" expand="block">
                  Invite Athletes
                </IonButton>
              </div>

              <div className="members-card">
                <h3 className="members-count">698 members</h3>
                <div className="members-avatars">
                  <img src={ProfileImage} alt="Member" />
                  <img src={ProfileImage} alt="Member" />
                  <img src={ProfileImage} alt="Member" />
                  <span className="more-members">and 695 others</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GroupFeed;