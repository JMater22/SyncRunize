import api from '../lib/api';

export interface Group {
  group_id: number;
  name: string;
  description: string;
  location?: string;
  group_picture: string;
  banner_link?: string;
  privacy: boolean; // true = private, false = public
  created_by: number;
  created_at: string;
  member_count?: number;
}

export interface GroupMember {
  group_id: number;
  user_id: number;
  role: 'admin' | 'member';
  joined_at: string;
  users?: {
    name: string;
    username: string;
    profile_picture: string;
    location?: string;
  };
}

export interface GroupPost {
  post_id: number;
  group_id: number;
  user_id: number;
  title?: string;
  content: string;
  images?: string[];
  created_at: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  name: string;
  avatar: string;
  distance: string;
  runs: number;
  longest: string;
  total_time?: string;
}

export interface CreateGroupData {
  name: string;
  description: string;
  location?: string;
  group_picture?: string;
  banner_link?: string;
  privacy?: boolean;
}

export interface CreateGroupPostData {
  title?: string;
  content: string;
  images?: string[];
  userId?: number;
}

export const GroupsApi = {
  // Get all groups with pagination
  getAllGroups: async (limit: number = 20, offset: number = 0): Promise<Group[]> => {
    const { data } = await api.get('/groups', {
      params: { limit, offset }
    });
    return data;
  },

  // Get single group
  getGroup: async (groupId: number): Promise<Group> => {
    const { data } = await api.get(`/groups/${groupId}`);
    return data;
  },

  // Create group
  createGroup: async (userId: number, groupData: CreateGroupData): Promise<Group> => {
    // Backend expects userId in the path
    const { data } = await api.post(`/groups/create/${userId}`, groupData);
    return data;
  },

  // Get user's joined groups
  getUserJoinedGroups: async (userId: number): Promise<Group[]> => {
    const { data } = await api.get(`/group-members/${userId}/joined-groups`);
    return data;
  },

  // Check user membership and role
  checkMembership: async (groupId: number, userId: number): Promise<{ isMember: boolean; role: 'admin' | 'member' | null }> => {
    const { data } = await api.get(`/group-members/${groupId}/check/${userId}`);
    return data;
  },

  // Update group
  updateGroup: async (groupId: number, updates: Partial<CreateGroupData>): Promise<Group> => {
    const { data } = await api.put(`/groups/${groupId}`, updates);
    return data;
  },

  // Delete group (admin only)
  deleteGroup: async (groupId: number): Promise<void> => {
    await api.delete(`/groups/${groupId}`);
  },

  // Get group members
  getGroupMembers: async (groupId: number): Promise<GroupMember[]> => {
    const { data } = await api.get(`/group-members/${groupId}/members`);
    return data;
  },

  // Join group
  joinGroup: async (groupId: number): Promise<void> => {
    await api.post(`/group-members/${groupId}/addMembers`);
  },

  // Leave group
  leaveGroup: async (groupId: number, userId: number): Promise<void> => {
    await api.delete(`/group-members/${groupId}/members/${userId}`);
  },

  // Invite user to group
  inviteToGroup: async (groupId: number, userId: number): Promise<void> => {
    await api.post(`/group-members/${groupId}/invite`, { user_id: userId });
  },

  // Get group leaderboard
  getLeaderboard: async (groupId: number, week?: 'current' | 'last'): Promise<LeaderboardEntry[]> => {
    const params = week ? { week } : {};
    const { data } = await api.get(`/groups/${groupId}/leaderboard/weekly`, { params });
    return data;
  },

  // Get last week's top 3 leaders
  getLastWeekLeaders: async (groupId: number): Promise<LeaderboardEntry[]> => {
    const { data } = await api.get(`/groups/${groupId}/leaderboard/last-week/leaders`);
    return data;
  },

  // Get group posts
  getGroupPosts: async (groupId: number, userId?: number, limit?: number, offset?: number): Promise<GroupPost[]> => {
    const params: any = {};
    if (userId) params.userId = userId;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const { data } = await api.get(`/group-posts/${groupId}`, { params });
    return data;
  },

  // Create group post
  createGroupPost: async (groupId: number, postData: CreateGroupPostData): Promise<GroupPost> => {
    const { data } = await api.post(`/group-posts/${groupId}`, postData);
    return data;
  },

  // Update group post
  updateGroupPost: async (groupId: number, postId: number, updates: Partial<CreateGroupPostData>): Promise<GroupPost> => {
    const { data } = await api.put(`/group-posts/${groupId}/posts/${postId}`, updates);
    return data;
  },

  // Delete group post
  deleteGroupPost: async (groupId: number, postId: number): Promise<void> => {
    await api.delete(`/group-posts/${groupId}/posts/${postId}`);
  },

  // Toggle like on group post
  toggleLikeGroupPost: async (postId: number): Promise<{ liked: boolean; likes: number }> => {
    const { data } = await api.post(`/group-likes/${postId}/toggle`);
    return data;
  },

  // Get group post comments
  getGroupPostComments: async (postId: number): Promise<any[]> => {
    const { data } = await api.get(`/group-comments/${postId}/comments`);
    return data;
  },

  // Comment on group post
  commentOnGroupPost: async (postId: number, content: string): Promise<any> => {
    const { data } = await api.post(`/group-comments/${postId}/comments`, { content });
    return data;
  },

  // Update comment
  updateGroupPostComment: async (postId: number, commentId: number, content: string): Promise<any> => {
    const { data } = await api.put(`/group-comments/${postId}/comments/${commentId}`, { content });
    return data;
  },

  // Delete comment
  deleteGroupPostComment: async (postId: number, commentId: number): Promise<void> => {
    await api.delete(`/group-comments/${postId}/comments/${commentId}`);
  },
};
