// Unified auth — uses Supabase when configured, falls back to mock localStorage
import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseUnconfigured } from '@/integrations/supabase/client';
import { db } from '@/lib/mockDb';

export type AdminUser = {
  id: string;
  email: string;
};

export type AuthState = {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
};

export function useAdminAuth(): AuthState {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const sessionRaw = localStorage.getItem('hanrao_admin_session');
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session?.user?.email === 'admin@gmail.com') {
          setUser({ id: session.user.id, email: session.user.email });
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to parse admin session', e);
    }
    setUser(null);
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (email.trim() === 'admin@gmail.com' && password === 'admin123') {
      const session = { user: { id: 'admin-id', email: 'admin@gmail.com' }, access_token: 'token-admin' };
      localStorage.setItem('hanrao_admin_session', JSON.stringify(session));
      setUser({ id: 'admin-id', email: 'admin@gmail.com' });
      return;
    }
    throw new Error('Invalid email or password.');
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('hanrao_admin_session');
    setUser(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    // Static admin account does not support password resets.
    return;
  }, []);

  return { user, loading, signIn, signOut, sendPasswordReset };
}
