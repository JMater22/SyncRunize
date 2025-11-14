import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let retryTimeout: NodeJS.Timeout;

    const loadSession = async (retryCount = 0) => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          if (!cancelled) setSession(null);
        } else {
          if (!cancelled) setSession(data.session ?? null);
        }

        // If session is null during initial load and we haven't retried much,
        // wait a bit and try again (helps with race conditions during login)
        if (!data.session && retryCount < 2 && !cancelled) {
          retryTimeout = setTimeout(() => loadSession(retryCount + 1), 150);
        }

      } finally {
        if (!cancelled && (retryCount >= 2 || session !== null)) {
          setLoading(false);
        }
      }
    };

    loadSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!cancelled) {
        setSession(newSession);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(retryTimeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading } as const;
}

