import api from '../lib/api';

export interface Post {
  post_id: number;
  user_id: number;
  route_id?: number;
  content?: string;
  route_name?: string;
  distance_km?: number;
  duration_seconds?: number;
  average_pace?: string;
  estimated_calories?: number;
  snapshot_url?: string;
  visibility: 'public' | 'private';
  created_at: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface CreatePostData {
  content?: string;
  route_id?: number;
  visibility?: 'public' | 'private';
}

export interface UpdatePostData {
  content?: string;
  visibility?: 'public' | 'private';
}

export const PostsApi = {
  // Get personal feed (posts from followed users)
  getFeed: async (): Promise<Post[]> => {
    const { data } = await api.get('/posts/feed');
    return data;
  },

  // Get user's own posts
  getMyPosts: async (): Promise<Post[]> => {
    const { data } = await api.get('/posts/my');
    return data;
  },

  // Get single post by ID
  getPost: async (postId: number): Promise<Post> => {
    const { data } = await api.get(`/posts/${postId}`);
    return data;
  },

  // Create new post
  createPost: async (postData: CreatePostData): Promise<Post> => {
    const { data } = await api.post('/posts', postData);
    return data;
  },

  // Update post
  updatePost: async (postId: number, updates: UpdatePostData): Promise<Post> => {
    const { data } = await api.put(`/posts/${postId}`, updates);
    return data;
  },

  // Delete post
  deletePost: async (postId: number): Promise<void> => {
    await api.delete(`/posts/${postId}`);
  },
};
