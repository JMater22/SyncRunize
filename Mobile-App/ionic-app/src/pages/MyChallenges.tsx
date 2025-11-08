import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from "@ionic/react";
import { people, timeOutline, trophy, checkmarkCircle } from "ionicons/icons";
import { useChallenges } from "../contexts/ChallengesContext";
import "../theme/MyChallenges.css";

const MyChallenges: React.FC = () => {
  const { userChallenges, loading } = useChallenges();
  const [selectedSegment, setSelectedSegment] = useState<'active' | 'completed'>('active');

  // Debug: Log challenges data
  React.useEffect(() => {
    console.log('[MyChallenges] userChallenges:', userChallenges);
    console.log('[MyChallenges] First challenge:', userChallenges[0]);
  }, [userChallenges]);

  // Separate active and completed challenges
  const activeChallenges = userChallenges.filter(c => !c.completed);
  const completedChallenges = userChallenges.filter(c => c.completed);

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>My Challenges</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ color: '#92C628', marginTop: '50px' }} />
          <p style={{ color: '#999', marginTop: '10px' }}>Loading challenges...</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>My Challenges</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="my-challenges-content">
        {/* Segment Control */}
        <div className="segment-container">
          <IonSegment
            value={selectedSegment}
            onIonChange={(e) => setSelectedSegment(e.detail.value as 'active' | 'completed')}
            className="challenges-segment"
          >
            <IonSegmentButton value="active">
              <IonLabel>Active ({activeChallenges.length})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="completed">
              <IonLabel>Completed ({completedChallenges.length})</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {/* Active Challenges */}
        {selectedSegment === 'active' && (
          <div className="challenges-container">
            {activeChallenges.length === 0 ? (
              <div className="empty-state">
                <IonIcon icon={people} className="empty-icon" />
                <h3>No Active Challenges</h3>
                <p>Join a challenge from the Community tab to get started!</p>
              </div>
            ) : (
              <div className="challenges-grid">
                {activeChallenges.map((challenge) => (
                  <IonCard key={challenge.user_challenge_id} className="challenge-card active">
                    <div className="challenge-image-wrapper">
                      {challenge.challenge_image ? (
                        <img
                          src={challenge.challenge_image}
                          alt={challenge.challenge_name}
                          className="challenge-image"
                          onLoad={() => console.log('[MyChallenges] Image loaded:', challenge.challenge_image)}
                          onError={(e) => {
                            console.error('[MyChallenges] Image load failed:', challenge.challenge_image);
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/400x200/92C628/ffffff?text=Challenge';
                          }}
                        />
                      ) : (
                        <div className="challenge-image placeholder-gradient" style={{
                          background: 'linear-gradient(135deg, #92C628 0%, #6a9520 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '18px',
                          fontWeight: '700'
                        }}>
                          Challenge
                        </div>
                      )}
                      <div className="challenge-overlay">
                        <div className="challenge-status-badge active-badge">
                          <IonIcon icon={people} />
                          <span>Active</span>
                        </div>
                      </div>
                    </div>
                    <IonCardContent className="challenge-content">
                      <h3 className="challenge-name">{challenge.challenge_name}</h3>
                      <p className="challenge-description">{challenge.challenge_description}</p>

                      {/* Days Remaining */}
                      {challenge.days_remaining !== null && (
                        <div className={`days-remaining ${challenge.days_remaining <= 3 ? 'urgent' : ''}`}>
                          <IonIcon icon={timeOutline} />
                          <span>
                            {challenge.days_remaining === 0 ? 'Last day!' :
                             challenge.days_remaining === 1 ? '1 day remaining' :
                             `${challenge.days_remaining} days remaining`}
                          </span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="progress-container">
                        <div className="progress-header">
                          <span className="progress-label">Progress</span>
                          <span className="progress-percentage">{challenge.progress_percent.toFixed(0)}%</span>
                        </div>
                        <div className="progress-bar-wrapper">
                          <div
                            className="progress-bar-fill active-progress"
                            style={{ width: `${challenge.progress_percent}%` }}
                          />
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed Challenges */}
        {selectedSegment === 'completed' && (
          <div className="challenges-container">
            {completedChallenges.length === 0 ? (
              <div className="empty-state">
                <IonIcon icon={trophy} className="empty-icon" />
                <h3>No Completed Challenges</h3>
                <p>Complete your first challenge to earn badges and rewards!</p>
              </div>
            ) : (
              <div className="challenges-grid">
                {completedChallenges.map((challenge) => (
                  <IonCard key={challenge.user_challenge_id} className="challenge-card completed">
                    <div className="challenge-image-wrapper">
                      {challenge.challenge_image ? (
                        <img
                          src={challenge.challenge_image}
                          alt={challenge.challenge_name}
                          className="challenge-image"
                          onLoad={() => console.log('[MyChallenges] Completed image loaded:', challenge.challenge_image)}
                          onError={(e) => {
                            console.error('[MyChallenges] Completed image load failed:', challenge.challenge_image);
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/400x200/FFD700/ffffff?text=Completed';
                          }}
                        />
                      ) : (
                        <div className="challenge-image placeholder-gradient" style={{
                          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '18px',
                          fontWeight: '700'
                        }}>
                          Completed
                        </div>
                      )}
                      <div className="challenge-overlay completed-overlay">
                        <div className="challenge-status-badge completed-badge">
                          <IonIcon icon={checkmarkCircle} />
                          <span>Completed</span>
                        </div>
                      </div>
                    </div>
                    <IonCardContent className="challenge-content">
                      <h3 className="challenge-name">{challenge.challenge_name}</h3>
                      <p className="challenge-description">{challenge.challenge_description}</p>

                      {/* Completion Date */}
                      {challenge.completed_at && (
                        <div className="completion-info">
                          <IonIcon icon={checkmarkCircle} />
                          <span>Completed on {new Date(challenge.completed_at).toLocaleDateString()}</span>
                        </div>
                      )}

                      {/* Badge Info */}
                      {challenge.badge_name && (
                        <div className="badge-earned">
                          <IonIcon icon={trophy} />
                          <span>{challenge.badge_name} Badge Earned</span>
                        </div>
                      )}

                      {/* Progress Bar (100%) */}
                      <div className="progress-container">
                        <div className="progress-header">
                          <span className="progress-label">Progress</span>
                          <span className="progress-percentage">100%</span>
                        </div>
                        <div className="progress-bar-wrapper">
                          <div className="progress-bar-fill completed-progress" style={{ width: '100%' }} />
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MyChallenges;
