import api from '../lib/api';

export type DevicePlatform = 'ios' | 'android' | 'web' | 'unknown';

export interface RegisterDeviceTokenPayload {
  token: string;
  platform?: DevicePlatform;
}

export const DevicesApi = {
  async register(payload: RegisterDeviceTokenPayload) {
    const { data } = await api.post('/devices/register', payload);
    return data?.data ?? data;
  },

  async unregister(token: string) {
    const { data } = await api.post('/devices/unregister', { token });
    return data?.data ?? data;
  },
};

export default DevicesApi;

