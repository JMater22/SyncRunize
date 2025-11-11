import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { PostsApi, Post } from '../services/posts';
import { LikesApi } from '../services/likes';
import { CommentsApi, Comment } from '../services/comments';

interface PostsContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  fetchFeed: () => Promise<void>;
  fetchMyPosts: () => Promise<void>;
  createPost: (content?: string, routeId?: number, visibility?: 'public' | 'private') => Promise<void>;
  deletePost: (postId: number) => Promise<void>;
  toggleLike: (postId: number) => Promise<void>;
  addComment: (postId: number, content: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const feedPosts = await PostsApi.getFeed();
      setPosts(feedPosts);
    } catch (err: any) {
      console.error('Failed to fetch feed:', err);
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const myPosts = await PostsApi.getMyPosts();
      setPosts(myPosts);
    } catch (err: any) {
      console.error('Failed to fetch my posts:', err);
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = useCallback(async (content?: string, routeId?: number, visibility: 'public' | 'private' = 'public') => {
    try {
      const newPost = await PostsApi.createPost({ content, route_id: routeId, visibility });
      setPosts(prev => [newPost, ...prev]);
    } catch (err: any) {
      console.error('Failed to create post:', err);
      throw err;
    }
  }, []);

  const deletePost = useCallback(async (postId: number) => {
    try {
      await PostsApi.deletePost(postId);
      setPosts(prev => prev.filter(post => post.post_id !== postId));
    } catch (err: any) {
      console.error('Failed to delete post:', err);
      throw err;
    }
  }, []);

  const toggleLike = useCallback(async (postId: number) => {
    // Optimistic update
    setPosts(prev =>
      prev.map(post =>
        post.post_id === postId
          ? {
              ...post,
              is_liked: !post.is_liked,
              likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
            }
          : post
      )
    );

    try {
      const result = await LikesApi.toggleLike(postId);

      // Update with actual server response
      setPosts(prev =>
        prev.map(post =>
          post.post_id === postId
            ? { ...post, is_liked: result.liked, likes_count: result.likes }
            : post
        )
      );
    } catch (err: any) {
      console.error('Failed to toggle like:', err);

      // Revert on error
      setPosts(prev =>
        prev.map(post =>
          post.post_id === postId
            ? {
                ...post,
                is_liked: !post.is_liked,
                likes_count: post.is_liked ? post.likes_count + 1 : post.likes_count - 1
              }
            : post
        )
      );
      throw err;
    }
  }, []);

  const addComment = useCallback(async (postId: number, content: string) => {
    try {
      await CommentsApi.addComment(postId, { content });

      // Update comment count
      setPosts(prev =>
        prev.map(post =>
          post.post_id === postId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );
    } catch (err: any) {
      console.error('Failed to add comment:', err);
      throw err;
    }
  }, []);

  const refreshPosts = useCallback(async () => {
    await fetchFeed();
  }, [fetchFeed]);

  const value = useMemo(
    () => ({
      posts,
      loading,
      error,
      fetchFeed,
      fetchMyPosts,
      createPost,
      deletePost,
      toggleLike,
      addComment,
      refreshPosts,
    }),
    [posts, loading, error, fetchFeed, fetchMyPosts, createPost, deletePost, toggleLike, addComment, refreshPosts]
  );

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};
