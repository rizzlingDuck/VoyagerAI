import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "./authContextObject";

/**
 * Provides Supabase auth state to the entire app.
 * Exposes: user, loading, signOut, getAccessToken
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  /** Returns the current JWT for use in backend Authorization headers */
  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}
