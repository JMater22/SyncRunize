import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonButton,
} from "@ionic/react";
 
import Group1 from "../assets/GROUP 1.png";
import "../components/Challenges/Challenge.css";
import SevenDayStarter from "../assets/The 7-Day Starter.jpg";
import ThirtyDayStreak from "../assets/30-Day Streak.jpg";
import FiveKImprover from "../assets/5K Improver.jpg";
import WeekendLongRun from "../assets/Weekend Long Run.jpg";
import FiftyKMonth from "../assets/The 50K Month.jpg";
import ThreeTimesAWeek from "../assets/Three Times a Week.jpg";
import TenKBeginner from "../assets/10K Beginner.jpg";
import FifteenMinuteDailyRun from "../assets/15-Minute Daily Run.jpg";
import HundredKQuarter from "../assets/The 100K Quarte.jpg";
import HalfMarathonTraining from "../assets/Half Marathon Training.jpg";
import TenKInSixtyMinutes from "../assets/10K in 60 Minutes.jpg";
import MarathonPrep from "../assets/Marathon Prep.jpg";

const Challenges: React.FC = () => {
  // State to track which challenges have been joined
  const [joinedChallenges, setJoinedChallenges] = useState<{[key: string]: boolean}>({});
  const [showingJoined, setShowingJoined] = useState<{[key: string]: boolean}>({});

  const handleJoinClick = (challengeId: string) => {
    // Show "Joined" text briefly
    setShowingJoined(prev => ({ ...prev, [challengeId]: true }));
    
    // After 800ms, transition to joined state with progress bar and Leave button
    setTimeout(() => {
      setJoinedChallenges(prev => ({ ...prev, [challengeId]: true }));
      setShowingJoined(prev => ({ ...prev, [challengeId]: false }));
    }, 800);
  };

  const handleLeaveClick = (challengeId: string) => {
    // Remove from joined challenges
    setJoinedChallenges(prev => {
      const updated = { ...prev };
      delete updated[challengeId];
      return updated;
    });
  };

  const renderButton = (challengeId: string, className: string) => {
    const isJoined = joinedChallenges[challengeId];
    const isShowingJoined = showingJoined[challengeId];

    return (
      <div className={`button-animation-container ${isJoined ? 'joined' : ''}`}>
        {/* Join Challenge Button - shows initially */}
        {!isJoined && (
          <IonButton 
            expand="block" 
            className={`${className} ${isShowingJoined ? 'show-joined' : ''}`}
            onClick={() => handleJoinClick(challengeId)}
            disabled={isShowingJoined}
          >
            {isShowingJoined ? 'Joined' : 'Join Challenge'}
          </IonButton>
        )}
        
        {/* Progress Section and Leave Button - shows after joining */}
        {isJoined && (
          <>
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">Progress</span>
                <span className="progress-percentage">0%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: '0%' }}></div>
              </div>
              <p className="progress-text">Start your challenge!</p>
            </div>
            
            <IonButton 
              expand="block" 
              className={`${className} leave-challenge-btn`}
              onClick={() => handleLeaveClick(challengeId)}
            >
              Leave Challenge
            </IonButton>
          </>
        )}
      </div>
    );
  };

  return ( 
    <IonPage>
      <IonContent className="ion-padding challenges-page">
        <IonGrid>
          {/* ✅ Main Challenge Section */}
          <IonRow className="main-challenge-row ion-align-items-center">
            <IonCol size="12" sizeMd="6" sizeLg="3">
              <IonCard className="challenge-card">
                <IonCardHeader>
                  <IonCardTitle className="challenge-title">
                    COUCH TO 5K
                  </IonCardTitle>
                </IonCardHeader> 
                <IonCardContent>
                  <p className="friends-info">2 friends have joined</p>
                  <IonGrid>
                    <IonRow className="challenge-details">
                      <IonCol size="12">
                        <div className="detail-item">
                          <span>Build from walking to running 5K continuously</span>
                        </div>
                      </IonCol>
                      <IonCol size="12">
                        <div className="detail-item">
                          <span>56 days (8 weeks)</span>
                        </div>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                  {renderButton('main-challenge', 'join-challenge-btn')}
                </IonCardContent>
              </IonCard> 
            </IonCol>

            <IonCol size="12" sizeMd="6" className="challenge-image-col">
              <IonImg src={Group1} alt="Main Challenge Banner" />
            </IonCol>
          </IonRow>

          <div className="suggested-container">
            {/* ✅ Suggested Challenges Section */}
            <IonRow>
              <IonCol size="12">
                <h3 className="suggested-header">Suggested Challenges</h3>
              </IonCol>
            </IonRow>

            {/* Suggested Grid */}
            <IonRow className="suggested-row">
              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={SevenDayStarter} alt="7-Day Starter" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">The 7-Day Starter</h4>
                    <p className="challenge-description">
                      Run at least 1 kilometer every day for a week.
                    </p>
                    <p className="challenge-date">
                      Target: 1 km daily • Duration: 7 days
                    </p>
                    {renderButton('challenge-1', 'suggested-join-btn')}
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={ThirtyDayStreak} alt="30-Day Streak" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">30-Day Streak</h4>
                    <p className="challenge-description">Run at least 1 mile every day for a month.</p>
                    <p className="challenge-date">Target: 1.6 km daily • Duration: 30 days</p>
                    {renderButton('challenge-2', 'suggested-join-btn')}
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={FiveKImprover} alt="5K Improver" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">5K Improver</h4>
                    <p className="challenge-description">Improve your 5K time with structured training.</p>
                    <p className="challenge-date">Target: 5 km (better time) • Duration: 42 days</p>
                    {renderButton('challenge-3', 'suggested-join-btn')}
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={WeekendLongRun} alt="Weekend Long Run" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">Weekend Long Run</h4>
                    <p className="challenge-description">Run 10k every weekend.</p>
                    <p className="challenge-date">Target: Build to 10 km • Duration: 56 days</p>
                    {renderButton('challenge-4', 'suggested-join-btn')}
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={FiftyKMonth} alt="50K Month" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">The 50K Month</h4>
                    <p className="challenge-description">50 kilometers total over the month.</p>
                    <p className="challenge-date">Target: 50 km total • Duration: 30 days</p>
                    {renderButton('challenge-5', 'suggested-join-btn')}
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={ThreeTimesAWeek} alt="Three Times a Week" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">Three Times a Week</h4>
                    <p className="challenge-description">Run three days per week.</p>
                    <p className="challenge-date">Target: 3-5 km per run • Duration: 30 days</p>
                    {renderButton('challenge-6', 'suggested-join-btn')}
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={TenKBeginner} alt="10K Beginner" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">10K Beginner</h4>
                    <p className="challenge-description">Progress from 5K to completing 10K distance.</p>
                    <p className="challenge-date">Target: 10 km • Duration: 63 days (9 weeks)</p>
                    {renderButton('challenge-7', 'suggested-join-btn')}
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={FifteenMinuteDailyRun} alt="15-Minute Daily Run" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">15-Minute Daily Run</h4>
                    <p className="challenge-description">Run for 15 minutes every day.</p>
                    <p className="challenge-date">Target: 1.5-2.5 km daily • Duration: 30 days</p>
                    {renderButton('challenge-8', 'suggested-join-btn')}
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={HundredKQuarter} alt="100K Quarter" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">The 100K Quarter</h4>
                    <p className="challenge-description">100 kilometers over three months.</p>
                    <p className="challenge-date">Target: 100 km total • Duration: 90 days</p>
                    {renderButton('challenge-9', 'suggested-join-btn')}
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={HalfMarathonTraining} alt="Half Marathon Training" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">Half Marathon Training</h4>
                    <p className="challenge-description">Train to complete a half marathon distance.</p>
                    <p className="challenge-date">Target: 21.1 km • Duration: 84 days (12 weeks)</p>
                    {renderButton('challenge-10', 'suggested-join-btn')}
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={TenKInSixtyMinutes} alt="10K in 60 Minutes" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">10K in 60 Minutes</h4>
                    <p className="challenge-description">Complete 10 kilometers in under 60 minutes.</p>
                    <p className="challenge-date">Target: 10 km (under 60 min) • Duration: 56 days</p>
                    {renderButton('challenge-11', 'suggested-join-btn')}
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6" sizeLg="3">
                <IonCard className="suggested-card">
                  <IonImg src={MarathonPrep} alt="Marathon Prep" />
                  <IonCardContent>
                    <h4 className="challenge-subtitle">Marathon Prep</h4>
                    <p className="challenge-description">Complete a full marathon distance.</p>
                    <p className="challenge-date">Target: 42.2 km • Duration: 112 days (16 weeks)</p>
                    {renderButton('challenge-12', 'suggested-join-btn')}
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </div>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Challenges;