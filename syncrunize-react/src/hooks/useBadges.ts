import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

export const useBadges = (userId: number | null) => {
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const { data: response } = await axios.get(
        `${import.meta.env.VITE_API_URL}/routes/badges/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const raw = response.data
        .filter((c: any) => c.completed && c.badge_image_url)
        .map((c: any) => ({
          title: c.badge_name || "Badge",
          description: c.badge_description || "",
          tier: c.badge_tier || "Bronze",
          date: new Date(c.updated_at).toLocaleDateString(),
          image: c.badge_image_url,
          awardedFor: c.challenge_name || c.challenge_slug || undefined
        }));

      // Deduplicate by image URL (assumes same badge uses same asset)
      const seen = new Set<string>();
      const unique = raw.filter((b: any) => {
        const key = b.image || `${b.title}|${b.tier}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setEarnedBadges(unique);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  return { earnedBadges, loading };
};
