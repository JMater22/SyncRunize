import api from '../lib/api';

export interface Comment {
  comment_id: number;
  user_id: number;
  post_id?: number;
  group_post_id?: number;
  content: string;
  created_at: string;
  username: string;
  name: string;
  profile_picture?: string;
}

export interface CreateCommentData {
  content: string;
}

export const CommentsApi = {
  // Get comments for a post
  getComments: async (postId: number): Promise<Comment[]> => {
    const { data } = await api.get(`/comments/${postId}`);
    return data;
  },

  // Add comment to a post
  addComment: async (postId: number, commentData: CreateCommentData): Promise<Comment> => {
    const { data } = await api.post(`/comments/${postId}`, commentData);
    return data;
  },

  // Delete comment
  deleteComment: async (commentId: number): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  },
};
