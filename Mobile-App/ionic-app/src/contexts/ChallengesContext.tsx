import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
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

  const fetchChallenges = useCallback(async () => {
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
  }, [currentUser]);

  const fetchUserChallenges = useCallback(async () => {
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
  }, [currentUser]);

  const fetchBadges = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const response = await ChallengesApi.getUserBadges(currentUser.user_id);

      console.log('[ChallengesContext] getUserBadges raw response:', response);
      console.log('[ChallengesContext] Response type:', typeof response);
      console.log('[ChallengesContext] Is array?', Array.isArray(response));
      console.log('[ChallengesContext] Response.data exists?', !!(response as any)?.data);

      // The API returns { success: true, data: [...] }
      // Handle both direct array and wrapped response
      let data: any[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if ((response as any)?.data) {
        data = (response as any).data;
      }

      console.log('[ChallengesContext] Extracted data:', data);
      console.log('[ChallengesContext] Data length:', data?.length || 0);
      console.log('[ChallengesContext] First item:', data?.[0]);

      // Filter for completed challenges with badges
      const completedChallenges = data.filter((item: any) => item.completed && item.badge_image_url);

      console.log('[ChallengesContext] Completed challenges with badges:', completedChallenges.length);

      // Group badges by badge_name to avoid duplicates
      const badgeGroups = completedChallenges.reduce((acc: any, challenge: any) => {
        const badgeName = challenge.badge_name || "Badge";

        if (!acc[badgeName]) {
          // Capitalize the first letter of badge_tier to match Badge page filter
          const tier = challenge.badge_tier || 'Bronze';
          const capitalizedTier = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();

          acc[badgeName] = {
            badge_id: challenge.badge_id || 0,
            badge_name: badgeName,
            badge_tier: capitalizedTier,
            badge_image_url: challenge.badge_image_url,
            badge_description: challenge.badge_description || "Achievement unlocked",
            earned_at: challenge.updated_at || challenge.earned_at,
            challenges: []
          };
        }

        // Add this challenge to the badge's history
        acc[badgeName].challenges.push({
          challenge_name: challenge.challenge_name || "Challenge",
          completed_date: new Date(challenge.updated_at).toLocaleDateString(),
          updated_at: challenge.updated_at
        });

        return acc;
      }, {});

      // Convert to array and sort challenges by date (most recent first)
      const badges = Object.values(badgeGroups).map((badge: any) => ({
        ...badge,
        count: badge.challenges.length,
        challenges: badge.challenges.sort((a: any, b: any) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
      }));

      console.log('[ChallengesContext] Final badges array:', badges);
      console.log('[ChallengesContext] Badges count:', badges.length);
      console.log('[ChallengesContext] First badge:', badges[0]);

      setBadges(badges);
    } catch (err: any) {
      console.error('Failed to fetch badges:', err);
      setError(err.message || 'Failed to fetch badges');
      setBadges([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const joinChallenge = useCallback(async (challengeId: number) => {
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
  }, [currentUser]);

  const leaveChallenge = useCallback(async (challengeId: number) => {
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
  }, [currentUser]);

  // Fetch data when user changes
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!currentUser) {
        setUserChallenges([]);
        setBadges([]);
        return;
      }

      if (cancelled) return;

      await Promise.all([
        fetchChallenges(),
        fetchUserChallenges(),
        fetchBadges()
      ]);
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [currentUser, fetchChallenges, fetchUserChallenges, fetchBadges]);

  const value = useMemo(
    () => ({
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
    }),
    [challenges, userChallenges, badges, loading, error, fetchChallenges, fetchUserChallenges, fetchBadges, joinChallenge, leaveChallenge]
  );

  return (
    <ChallengesContext.Provider value={value}>
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
