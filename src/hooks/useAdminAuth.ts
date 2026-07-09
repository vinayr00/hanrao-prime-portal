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
    if (isSupabaseUnconfigured()) {
      const session = db.auth.getSession();
      setUser(session ? { id: session.user.id, email: session.user.email } : null);
      setLoading(false);
      return;
    }

    // Real Supabase auth
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u ? { id: u.id, email: u.email ?? '' } : null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? '' } : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isSupabaseUnconfigured()) {
      db.auth.login(email, password);
      const session = db.auth.getSession();
      setUser(session ? { id: session.user.id, email: session.user.email } : null);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseUnconfigured()) {
      db.auth.logout();
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (isSupabaseUnconfigured()) {
      // In dev mode, just pretend it worked
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    if (error) throw new Error(error.message);
  }, []);

  return { user, loading, signIn, signOut, sendPasswordReset };
}
