import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

export const useChallenges = (userId: number | null) => {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchChallenges();
  }, [userId]);

  const fetchChallenges = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/routes/challenges/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChallenges(Array.isArray(response.data.challenges) 
        ? response.data.challenges 
        : []
      );
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  return { challenges, loading };
};