import api from '../lib/api';

export interface ToggleLikeResponse {
  liked: boolean;
  likes: number;
}

export interface Liker {
  user_id: number;
  name: string;
  username: string;
  profile_picture?: string;
}

export const LikesApi = {
  // Toggle like on a post
  toggleLike: async (postId: number): Promise<ToggleLikeResponse> => {
    const { data } = await api.post(`/likes/${postId}/toggle`);
    return data;
  },

  // Get list of users who liked a post
  getLikers: async (postId: number): Promise<Liker[]> => {
    const { data } = await api.get(`/likes/${postId}/users`);
    return data;
  },
};
