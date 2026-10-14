import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  devBypass: boolean;
  setDevBypass: (val: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  isAuthenticated: false,
  devBypass: false,
  setDevBypass: () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [devBypass, setDevBypass] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Obtener sesión inicial
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (mounted) {
          setSession(session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      if (session) {
        await supabase.auth.signOut();
      }
    } catch {}
    setDevBypass(false);
    setSession(null);
  };

  const isAuthenticated = Boolean(session || devBypass);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        isAuthenticated,
        devBypass,
        setDevBypass,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
