import api from '../lib/api';

export type MeResponse = {
  user_id: number;
  auth_id: string;
  email: string;
  name: string;
  username: string;
  profile_picture?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  age?: number | null;
  weight_kg?: number | null;
  description?: string | null;
  location?: string | null;
  activities_visibility?: 'public' | 'private';
  distance_unit?: 'km' | 'mi';
};

export interface UpdateAccountSettingsData {
  name?: string;
  weight_kg?: number;
  gender?: 'male' | 'female' | 'other';
  location?: string;
}

export interface UpdatePrivacySettingsData {
  activities_visibility: 'public' | 'private';
}

export interface SearchUserResult {
  user_id: number;
  name: string;
  username: string;
  profile_picture?: string;
  location?: string;
}

export const UsersApi = {
  me: async (): Promise<MeResponse> => {
    const { data } = await api.get('/users/me');
    return data;
  },

  updateMe: async (updates: Partial<MeResponse>) => {
    const { data } = await api.put('/users/update-me', updates);
    return data as MeResponse;
  },

  // Get user by ID
  getUser: async (userId: number): Promise<MeResponse> => {
    const { data } = await api.get(`/users/${userId}`);
    return data;
  },

  // Search users
  searchUsers: async (query: string): Promise<SearchUserResult[]> => {
    const { data } = await api.get('/users/search', { params: { q: query } });
    return data;
  },

  // Update account settings
  updateAccountSettings: async (settings: UpdateAccountSettingsData): Promise<void> => {
    await api.put('/users/settings/account', settings);
  },

  // Update privacy settings
  updatePrivacySettings: async (settings: UpdatePrivacySettingsData): Promise<void> => {
    await api.put('/users/settings/privacy', settings);
  },
};
