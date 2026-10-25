import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';

export type UserRole = 'admin' | 'coordinador' | 'tecnico';

export interface UserProfile {
  id: string;
  nombre_completo: string;
  rol: UserRole;
  telefono?: string | null;
  activo: boolean;
}

const PROFILE_STORAGE_KEY = '@aleprod_user_profile';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCoordinador: boolean;
  isTecnico: boolean;
  canStartEvent: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: 'tecnico',
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  isCoordinador: false,
  isTecnico: true,
  canStartEvent: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('tecnico');
  const [loading, setLoading] = useState(true);

  // Cargar perfil desde caché local (Offline-First)
  const loadCachedProfile = async (): Promise<UserProfile | null> => {
    try {
      const cached = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached) as UserProfile;
      }
    } catch (e) {
      console.warn('Error al leer perfil desde caché local:', e);
    }
    return null;
  };

  // Guardar perfil en caché local
  const cacheProfile = async (p: UserProfile | null) => {
    try {
      if (p) {
        await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(p));
      } else {
        await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Error al persistir perfil en caché local:', e);
    }
  };

  // Obtener perfil desde Supabase Cloud con resiliencia offline
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, rol, telefono, activo')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Advertencia al consultar perfil remoto:', error.message);
        return await loadCachedProfile();
      }

      if (data) {
        const rawRole = (data.rol || '').toLowerCase();
        const validRole: UserRole =
          rawRole === 'admin'
            ? 'admin'
            : rawRole === 'coordinador'
            ? 'coordinador'
            : 'tecnico';

        const loadedProfile: UserProfile = {
          id: data.id,
          nombre_completo: data.nombre_completo || 'Usuario',
          rol: validRole,
          telefono: data.telefono,
          activo: data.activo ?? true,
        };

        await cacheProfile(loadedProfile);
        return loadedProfile;
      }

      return null;
    } catch (err) {
      console.warn('Excepción al sincronizar perfil:', err);
      return await loadCachedProfile();
    }
  }, []);

  const syncUserAndProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user?.id) {
      setProfile(null);
      setRole('tecnico');
      await cacheProfile(null);
      return;
    }

    // 1. Cargar caché inmediatamente para cero latencia
    const cached = await loadCachedProfile();
    if (cached) {
      setProfile(cached);
      setRole(cached.rol);
    }

    // 2. Refrescar con la nube
    const remote = await fetchProfile(currentSession.user.id);
    if (remote) {
      setProfile(remote);
      setRole(remote.rol);
    }
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // Obtener sesión inicial directamente desde Supabase Auth (AsyncStorage)
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initSession } }) => {
        if (!mounted) return;
        setSession(initSession);
        if (initSession) {
          await syncUserAndProfile(initSession);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Error al recuperar sesión inicial:', err);
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      });

    // Escuchar activamente eventos de cambio de estado
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      await syncUserAndProfile(newSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserAndProfile]);

  const refreshProfile = async () => {
    if (session?.user?.id) {
      const p = await fetchProfile(session.user.id);
      if (p) {
        setProfile(p);
        setRole(p.rol);
      }
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error al cerrar sesión:', err);
    } finally {
      setSession(null);
      setProfile(null);
      setRole('tecnico');
      await cacheProfile(null);
    }
  };

  const isAuthenticated = Boolean(session);
  const isAdmin = role === 'admin';
  const isCoordinador = role === 'coordinador';
  const isTecnico = role === 'tecnico';
  const canStartEvent = isAdmin || isCoordinador;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        role,
        loading,
        isAuthenticated,
        isAdmin,
        isCoordinador,
        isTecnico,
        canStartEvent,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

