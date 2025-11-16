import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { UsersApi, MeResponse } from '../services/users';
import { supabase } from '../lib/supabaseClient';
import { clearSessionCache } from '../lib/api';

interface UserContextType {
  currentUser: MeResponse | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<MeResponse>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const userData = await UsersApi.me();
      setCurrentUser(userData);
    } catch (err: any) {
      console.error('[UserContext] Failed to fetch user:', err);
      setError(err.message || 'Failed to fetch user data');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const updateUser = async (updates: Partial<MeResponse>) => {
    try {
      const updatedUser = await UsersApi.updateMe(updates);
      setCurrentUser(updatedUser);
    } catch (err: any) {
      console.error('Failed to update user:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          console.log('[UserContext] User signed out, clearing session cache');
          clearSessionCache(); // Clear in-memory session cache
          setCurrentUser(null);
        } else if (event === 'SIGNED_IN' && session) {
          console.log('[UserContext] User signed in, fetching fresh user data');
          clearSessionCache(); // Clear old cache and fetch fresh session
          await fetchUser();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ currentUser, loading, error, refreshUser, updateUser }),
    [currentUser, loading, error, refreshUser, updateUser]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
