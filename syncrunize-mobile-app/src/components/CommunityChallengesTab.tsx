import React, { useMemo, useState, useEffect } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonImg,
  IonSearchbar,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import ChallengePic from './assets/istockphoto-143920084-612x612.jpg';
import { useChallenges } from '../contexts/ChallengesContext';
import { useUser } from '../contexts/UserContext';
import { ChallengeWithStatus } from '../services/challenges';

type ToastColor = 'success' | 'danger';

interface CommunityChallengesTabProps {
  focusChallengeId?: number;
  onFocusHandled?: () => void;
}

const CommunityChallengesTab: React.FC<CommunityChallengesTabProps> = ({
  focusChallengeId,
  onFocusHandled,
}) => {
  const { currentUser } = useUser();
  const {
    challenges,
    loading,
    error,
    fetchChallenges,
    joinChallenge,
    leaveChallenge,
  } = useChallenges();

  const [searchQuery, setSearchQuery] = useState('');
  const [joining, setJoining] = useState<Record<number, boolean>>({});
  const [toastState, setToastState] = useState<{ open: boolean; message: string; color: ToastColor }>({
    open: false,
    message: '',
    color: 'success',
  });

  const filteredChallenges = useMemo(() => {
    if (!searchQuery) {
      return challenges;
    }

    const query = searchQuery.toLowerCase();
    return challenges.filter((challenge) => {
      const name = (challenge.challenge_name ?? '').toLowerCase();
      const description = (challenge.challenge_description ?? challenge.description ?? '').toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [challenges, searchQuery]);

  const showToast = (message: string, color: ToastColor = 'success') => {
    setToastState({ open: true, message, color });
  };

  useEffect(() => {
    if (!focusChallengeId) return;
    const numericId = Number(focusChallengeId);
    if (!Number.isFinite(numericId)) return;

    const challengeExists = challenges.some(
      (challenge) => Number(challenge.challenge_id) === numericId
    );
    if (!challengeExists) return;

    const timeout = setTimeout(() => {
      const card = document.querySelector(`[data-challenge-id="${numericId}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      onFocusHandled?.();
    }, 200);

    return () => clearTimeout(timeout);
  }, [focusChallengeId, challenges, onFocusHandled]);

  const handleJoin = async (challengeId: number) => {
    if (!currentUser) {
      showToast('Please log in to join challenges', 'danger');
      return;
    }

    setJoining((prev) => ({ ...prev, [challengeId]: true }));

    try {
      await joinChallenge(challengeId);
      await fetchChallenges();
      showToast('Challenge joined successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to join challenge:', err);
      showToast(err?.message || 'Failed to join challenge', 'danger');
    } finally {
      setJoining((prev) => ({ ...prev, [challengeId]: false }));
    }
  };

  const handleLeave = async (challengeId: number) => {
    if (!currentUser) {
      showToast('Please log in to leave challenges', 'danger');
      return;
    }

    setJoining((prev) => ({ ...prev, [challengeId]: true }));

    try {
      await leaveChallenge(challengeId);
      await fetchChallenges();
      showToast('Challenge left successfully', 'success');
    } catch (err: any) {
      console.error('Failed to leave challenge:', err);
      showToast(err?.message || 'Failed to leave challenge', 'danger');
    } finally {
      setJoining((prev) => ({ ...prev, [challengeId]: false }));
    }
  };

  const renderActionSection = (challenge: ChallengeWithStatus) => {
    const challengeId = Number(challenge.challenge_id);
    const isBusy = joining[challengeId];
    const progress = Math.max(0, Math.min(Number(challenge.progress_percent) || 0, 100));

    if (challenge.joined && challenge.completed) {
      return (
        <IonButton expand="block" color="success" disabled>
          Challenge Completed
        </IonButton>
      );
    }

    if (challenge.joined) {
      return (
        <>
          <div className="progress-section">
            <span className="progress-label">Progress: {progress.toFixed(1)}%</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <IonButton
            expand="block"
            color="danger"
            fill="outline"
            onClick={() => handleLeave(challengeId)}
            disabled={isBusy}
          >
            {isBusy ? <IonSpinner name="dots" /> : 'Leave Challenge'}
          </IonButton>
        </>
      );
    }

    return (
      <IonButton
        expand="block"
        className="join-challenge-btn"
        onClick={() => handleJoin(challengeId)}
        disabled={isBusy}
      >
        {isBusy ? <IonSpinner name="dots" /> : 'Join Challenge'}
      </IonButton>
    );
  };

  const renderContent = () => {
    if (!currentUser) {
      return (
        <div className="ion-text-center ion-padding">
          <p style={{ color: 'var(--ion-color-medium)' }}>Please log in to view challenges.</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="ion-text-center ion-padding">
          <IonSpinner name="crescent" />
          <p>Loading challenges...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="ion-text-center ion-padding">
          <p style={{ color: 'var(--ion-color-danger)' }}>{error}</p>
          <IonButton onClick={() => fetchChallenges()} size="small">
            Retry
          </IonButton>
        </div>
      );
    }

    if (filteredChallenges.length === 0) {
      return (
        <div className="ion-text-center ion-padding">
          <p style={{ color: 'var(--ion-color-medium)' }}>
            {searchQuery ? 'No challenges match your search.' : 'No challenges available at the moment.'}
          </p>
        </div>
      );
    }

    return (
      <div className="suggested-section">
        {filteredChallenges.map((challenge) => {
          const imageSrc = challenge.challenge_image ||  ChallengePic;
          const name = challenge.challenge_name ?? 'Unnamed Challenge';
          const description = challenge.challenge_description ?? challenge.description ?? 'No description available.';
          const targetDistance = challenge.target_distance_km ? `${challenge.target_distance_km} km` : 'Flexible';
          const duration = challenge.challenge_duration_days ?? 0;
          const cardId = Number(challenge.challenge_id);

          return (
            <IonCard
              className="suggested-challenge-card"
              key={`${cardId}-${name}`}
              data-challenge-id={cardId}
            >
              <div className="challenge-image-container">
                <IonImg src={imageSrc} alt={name} />
              </div>
              <IonCardHeader>
                <IonCardTitle className="suggested-title">{name}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent className="suggested-content">
                <p className="suggested-description">{description}</p>
                <p className="suggested-date">
                  Target: {targetDistance} &bull; Duration: {duration} days
                </p>
                {renderActionSection(challenge)}
              </IonCardContent>
            </IonCard>
          );
        })}
      </div>
    );
  };

  return (
    <div className="challenges-tab">
      <div className="search-container">
        <IonSearchbar
          placeholder="Search challenges"
          className="challenge-search"
          value={searchQuery}
          onIonInput={(e) => setSearchQuery(e.detail.value || '')}
        />
      </div>

      {renderContent()}

      <IonToast
        isOpen={toastState.open}
        message={toastState.message}
        color={toastState.color}
        duration={2500}
        position="bottom"
        onDidDismiss={() => setToastState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default CommunityChallengesTab;
