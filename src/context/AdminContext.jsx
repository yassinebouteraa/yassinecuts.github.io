import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../lib/supabase.js';

const AdminContext = createContext(null);

/**
 * Admin state now comes from a real Supabase Auth session instead of a
 * password hash embedded in the bundle. Anyone can still *open* the login
 * form; only a valid session (plus the RLS policies) lets writes through.
 */
export function AdminProvider({ children }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    getSupabase().then((supabase) => {
      if (!active) return;
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setChecking(false);
      });

      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ isAdmin: Boolean(session), session, checking, signIn, signOut }),
    [session, checking, signIn, signOut]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}
