import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChallengesApi, UserChallenge, Badge, ChallengeWithStatus } from '../services/challenges';
import { useUser } from './UserContext';

interface ChallengesContextType {
  challenges: ChallengeWithStatus[];
  userChallenges: UserChallenge[];
  badges: Badge[];
  loading: boolean;
  error: string | null;
  fetchChallenges: () => Promise<void>;
  fetchUserChallenges: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  joinChallenge: (challengeId: number) => Promise<void>;
  leaveChallenge: (challengeId: number) => Promise<void>;
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export const ChallengesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useUser();
  const [challenges, setChallenges] = useState<ChallengeWithStatus[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = async () => {
    if (!currentUser) {
      setChallenges([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await ChallengesApi.getAllChallengesWithStatus(currentUser.user_id);
      console.log('Fetched challenges:', data);
      // Ensure data is an array
      setChallenges(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch challenges:', err);
      setError(err.message || 'Failed to fetch challenges');
      setChallenges([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchUserChallenges = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const data = await ChallengesApi.getUserChallenges(currentUser.user_id);
      // Ensure data is an array
      setUserChallenges(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch user challenges:', err);
      setError(err.message || 'Failed to fetch user challenges');
      setUserChallenges([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const data = await ChallengesApi.getUserBadges(currentUser.user_id);
      // Ensure data is an array before filtering
      if (Array.isArray(data)) {
        // Filter for completed badges only
        const earnedBadges = data.filter(badge => badge.earned_at);
        setBadges(earnedBadges);
      } else {
        setBadges([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch badges:', err);
      setError(err.message || 'Failed to fetch badges');
      setBadges([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: number) => {
    if (!currentUser) {
      throw new Error('User must be logged in to join challenges');
    }

    try {
      const newUserChallenge = await ChallengesApi.joinChallenge(currentUser.user_id, challengeId);

      setChallenges(prev =>
        prev.map(challenge =>
          challenge.challenge_id === challengeId
            ? {
                ...challenge,
                joined: true,
                completed: false,
                progress_percent: newUserChallenge?.progress_percent ?? 0,
                user_challenge_id: newUserChallenge?.user_challenge_id,
              }
            : challenge
        )
      );

      if (newUserChallenge) {
        setUserChallenges(prev => [...prev, newUserChallenge]);
      }
    } catch (err: any) {
      console.error('Failed to join challenge:', err);
      throw err;
    }
  };

  const leaveChallenge = async (challengeId: number) => {
    if (!currentUser) {
      throw new Error('User must be logged in to leave challenges');
    }

    try {
      await ChallengesApi.leaveChallenge(currentUser.user_id, challengeId);

      setChallenges(prev =>
        prev.map(challenge =>
          challenge.challenge_id === challengeId
            ? { ...challenge, joined: false, user_challenge_id: undefined, progress_percent: 0, completed: false }
            : challenge
        )
      );

      setUserChallenges(prev => prev.filter(uc => uc.challenge_id !== challengeId));
    } catch (err: any) {
      console.error('Failed to leave challenge:', err);
      throw err;
    }
  };

  // Fetch data when user changes
  useEffect(() => {
    if (currentUser) {
      fetchChallenges();
      fetchUserChallenges();
      fetchBadges();
    } else {
      setUserChallenges([]);
      setBadges([]);
    }
  }, [currentUser]);

  return (
    <ChallengesContext.Provider
      value={{
        challenges,
        userChallenges,
        badges,
        loading,
        error,
        fetchChallenges,
        fetchUserChallenges,
        fetchBadges,
        joinChallenge,
        leaveChallenge,
      }}
    >
      {children}
    </ChallengesContext.Provider>
  );
};

export const useChallenges = () => {
  const context = useContext(ChallengesContext);
  if (context === undefined) {
    throw new Error('useChallenges must be used within a ChallengesProvider');
  }
  return context;
};
