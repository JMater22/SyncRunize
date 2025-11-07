import api from '../lib/api';

export interface Challenge {
  challenge_id: number;
  name: string;
  challenge_slug: string;
  challenge_description: string;
  challenge_image: string;
  challenge_duration_days: number;
  target_distance_km?: number;
  target_runs?: number;
  badge_name?: string;
  badge_tier?: 'Bronze' | 'Silver' | 'Gold';
  badge_image_url?: string;
  badge_description?: string;
}

export interface UserChallenge {
  user_challenge_id: number;
  user_id: number;
  challenge_id: number;
  challenge_name: string;
  challenge_description: string;
  challenge_image: string;
  challenge_duration_days: number;
  progress_percent: number;
  completed: boolean;
  started_at: string;
  completed_at?: string;
}

export interface Badge {
  badge_id: number;
  badge_name: string;
  badge_tier: 'Bronze' | 'Silver' | 'Gold';
  badge_image_url: string;
  badge_description: string;
  earned_at: string;
}

export interface ChallengeWithStatus extends Challenge {
  joined?: boolean;
  completed?: boolean;
  progress_percent?: number;
  user_challenge_id?: number;
  description:string;
}

export const ChallengesApi = {
  // Get all challenges with user's join status
  getAllChallengesWithStatus: async (userId: number): Promise<ChallengeWithStatus[]> => {
    const { data } = await api.get(`/challenges/${userId}/all`);
    const challenges = Array.isArray(data) ? data : (Array.isArray(data.challenges) ? data.challenges : []);

    // Transform backend properties to match mobile expectations
    return challenges.map(ch => ({
      ...ch,
      challenge_name: ch.challenge_name || ch.name,
      challenge_slug: ch.challenge_slug || ch.slug,
      challenge_description: ch.challenge_description || ch.description,
      challenge_image: ch.challenge_image || ch.image_url,
      challenge_duration_days: ch.challenge_duration_days || ch.duration_days,
      description: ch.description || ch.challenge_description,
    }));
  },

  // Get all available challenges (legacy - keeping for backward compatibility)
  getAllChallenges: async (): Promise<Challenge[]> => {
    const { data } = await api.get('/challenges');
    return Array.isArray(data) ? data : [];
  },

  // Get user's challenges (active and completed)
  getUserChallenges: async (userId: number): Promise<UserChallenge[]> => {
    const { data } = await api.get(`/challenges/user/`);
    return Array.isArray(data) ? data : [];
  },

  // Get user's earned badges
  getUserBadges: async (userId: number): Promise<Badge[]> => {
    const { data } = await api.get(`/routes/badges/${userId}`);
    return data;
  },

  // Join a challenge
  joinChallenge: async (currentUser:number,challengeId: number): Promise<UserChallenge> => {
    const { data } = await api.post(`/challenges/${currentUser}/join`, 
      {challenge_id:challengeId }
    );
    return data;
  },

  // Leave a challenge
  leaveChallenge: async (userId: number, challengeId: number): Promise<void> => {
    await api.delete(`/challenges/${userId}/leave/${challengeId}`);
  },
};
 