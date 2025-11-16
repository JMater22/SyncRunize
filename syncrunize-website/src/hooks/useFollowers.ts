import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

export const useFollowers = (userId: number | null) => {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchCounts();
  }, [userId]);

  const fetchCounts = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const { data: counts } = await axios.get(
        `${import.meta.env.VITE_API_URL}/follows/${userId}/counts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFollowersCount(counts.followers);
      setFollowingCount(counts.following);
    } catch (error) {
      console.error("Error fetching counts:", error);
    } finally {
      setLoading(false);
    }
  };

  return { followersCount, followingCount, loading };
};