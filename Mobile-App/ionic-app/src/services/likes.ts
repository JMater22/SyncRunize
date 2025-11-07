import api from '../lib/api';

export interface ToggleLikeResponse {
  liked: boolean;
  likes: number;
}

export const LikesApi = {
  // Toggle like on a post
  toggleLike: async (postId: number): Promise<ToggleLikeResponse> => {
    const { data } = await api.post(`/likes/${postId}/toggle`);
    return data;
  },
};
