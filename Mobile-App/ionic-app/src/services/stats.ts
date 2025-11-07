import api from '../lib/api';

export type StatsPeriod = 'day' | 'week' | 'month';

export interface AggregatedStat {
  period_start: string;
  total_distance?: number | null;
  avg_pace?: number | null;
  total_calories?: number | null;
  runs_count?: number | null;
}

export interface CurrentStatsResponse extends AggregatedStat {
  user_id?: number;
  period?: StatsPeriod;
  current?: boolean;
}

export const StatsApi = {
  getAggregatedStats: async (userId: number, period: StatsPeriod): Promise<AggregatedStat[]> => {
    const { data } = await api.get(`/stats/${userId}`, {
      params: { period },
    });

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    // Some responses might return the array itself
    return Array.isArray(data) ? data : [];
  },

  getCurrentStats: async (userId: number, period: StatsPeriod): Promise<CurrentStatsResponse | null> => {
    const { data } = await api.get(`/stats/${userId}/current`, {
      params: { period },
    });

    return data ?? null;
  },
};
