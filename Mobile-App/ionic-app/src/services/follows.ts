import api from '../lib/api';

export interface FollowCounts {
  followers: number;
  following: number;
}

export interface FollowUser {
  user_id: number;
  name: string;
  username: string;
  profile_picture?: string;
  location?: string;
  isFollowedBack?: boolean;
}

export interface FollowStatusResponse {
  isFollowing: boolean;
}

export interface ToggleFollowResponse {
  isFollowing: boolean;
  message: string;
}

export const FollowsApi = {
  // Get follow status
  getFollowStatus: async (userId: number): Promise<FollowStatusResponse> => {
    const { data } = await api.get(`/follows/status/${userId}`);
    return data;
  },

  // Toggle follow/unfollow
  toggleFollow: async (userId: number): Promise<ToggleFollowResponse> => {
    const { data } = await api.post(`/follows/${userId}/toggle`);
    return data;
  },

  // Get follower/following counts
  getFollowCounts: async (userId: number): Promise<FollowCounts> => {
    const { data } = await api.get(`/follows/${userId}/counts`);
    return data;
  },

  // Get followers list
  getFollowers: async (userId: number): Promise<FollowUser[]> => {
    const { data } = await api.get(`/follows/${userId}/followers`);
    return data;
  },

  // Get following list
  getFollowing: async (userId: number): Promise<FollowUser[]> => {
    const { data } = await api.get(`/follows/${userId}/following`);
    return data;
  },
};
