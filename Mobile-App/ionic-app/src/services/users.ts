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
};

export const UsersApi = {
  me: async (): Promise<MeResponse> => {
    const { data } = await api.get('/users/me');
    return data;
  },
  updateMe: async (updates: Partial<MeResponse>) => {
    const { data } = await api.put('/users/update-me', updates);
    return data as MeResponse;
  },
};
