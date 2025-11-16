import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import axios from 'axios';

export const useProfile = () => {
  const [profileData, setProfileData] = useState({
    Name: "",
    description: "",
    profilePic: ""
  });
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const token = session.access_token;
      const { data: user } = await axios.get(
        `${import.meta.env.VITE_API_URL}/users/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentUserId(user.user_id);
      setProfileData({
        Name: user.name || "Unknown User",
        description: user.description || "",
        profilePic: user.profilePic || "",
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<typeof profileData>) => {
    setProfileData(prev => ({ ...prev, ...updates }));
    // Add API call to save to backend
  };

  return { profileData, currentUserId, loading, updateProfile };
};