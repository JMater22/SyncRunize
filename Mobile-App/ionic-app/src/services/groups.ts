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
}

export const GroupsApi = {
  // Get all groups
  getAllGroups: async (): Promise<Group[]> => {
    const { data } = await api.get('/groups');
    return data;
  },

  // Get single group
  getGroup: async (groupId: number): Promise<Group> => {
    const { data } = await api.get(`/groups/${groupId}`);
    return data;
  },

  // Create group
  createGroup: async (groupData: CreateGroupData): Promise<Group> => {
    const { data } = await api.post('/groups', groupData);
    return data;
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
    const { data } = await api.get(`/groups/${groupId}/leaderboard`, { params });
    return data;
  },

  // Get group posts
  getGroupPosts: async (groupId: number): Promise<GroupPost[]> => {
    const { data } = await api.get(`/groups/${groupId}/posts`);
    return data;
  },

  // Create group post
  createGroupPost: async (groupId: number, postData: CreateGroupPostData): Promise<GroupPost> => {
    const { data } = await api.post(`/groups/${groupId}/posts`, postData);
    return data;
  },

  // Like group post
  likeGroupPost: async (groupId: number, postId: number): Promise<any> => {
    const { data } = await api.post(`/groups/${groupId}/posts/${postId}/like`);
    return data;
  },

  // Comment on group post
  commentOnGroupPost: async (groupId: number, postId: number, content: string): Promise<any> => {
    const { data } = await api.post(`/groups/${groupId}/posts/${postId}/comments`, { content });
    return data;
  },
};
