import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../api/supabase';

// Handler global de notificaciones cuando la app está en primer plano:
// shouldShowAlert: false y shouldPlaySound: false evitan el banner/sonido nativo del sistema
// cuando la app está en uso, permitiendo que los listeners capturen el evento para el modal interactivo.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Función desacoplada para solicitar permisos y obtener el token push de Expo.
 * Soporta de forma resiliente tanto plataformas nativas (iOS / Android) como Web (PWA).
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  try {
    // 1. Manejo seguro para Web (PWA)
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
          } catch (e) {
            console.warn('[PushNotifications] Error al solicitar permisos de notificación en navegador:', e);
          }
        }
      }

      const vapidKey = process.env.EXPO_PUBLIC_VAPID_KEY;
      if (
        !vapidKey ||
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window)
      ) {
        console.log(
          '[PushNotifications] Web Push omitido: VAPID key no configurada o PushManager no disponible en este navegador.'
        );
        return null;
      }
    }

    // 2. Configurar canal de notificación prioritario en Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('eventos_montaje', {
        name: 'Eventos y Montajes',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
        sound: 'default',
      });
    }

    // 3. Verificar y solicitar permisos de usuario
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PushNotifications] Permisos de notificación no otorgados por el usuario.');
      return null;
    }

    // 4. Resolver projectId del proyecto EAS de Expo
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId ||
      'ef8044d4-7418-4841-8782-6aad48e5146a';

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
      ...(Platform.OS === 'web' && process.env.EXPO_PUBLIC_VAPID_KEY
        ? { vapidKey: process.env.EXPO_PUBLIC_VAPID_KEY }
        : {}),
    });

    const token = tokenData?.data || null;
    if (token) {
      console.log('[PushNotifications] Expo Push Token obtenido con éxito:', token);
    }
    return token;
  } catch (error: any) {
    console.warn('[PushNotifications] Error al obtener Expo Push Token:', error?.message);
    return null;
  }
};

/**
 * Persiste el token push en la tabla `public.perfiles` de Supabase Cloud.
 * Si la columna `push_token` aún no existe en la base de datos remota, captura el error grácilmente.
 */
export const savePushTokenToSupabase = async (
  token: string,
  userId?: string
): Promise<boolean> => {
  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: authData } = await supabase.auth.getUser();
      targetUserId = authData?.user?.id;
    }

    if (!targetUserId || !token) {
      return false;
    }

    const { error } = await supabase
      .from('perfiles')
      .update({ push_token: token } as any)
      .eq('id', targetUserId);

    if (error) {
      console.warn(
        '[PushNotifications] Advertencia al persistir push_token en Supabase (posible columna aún ausente en perfiles):',
        error.message
      );
      return false;
    }

    console.log(`[PushNotifications] push_token guardado exitosamente para el usuario: ${targetUserId}`);
    return true;
  } catch (err: any) {
    console.warn('[PushNotifications] Excepción al guardar push_token en perfiles:', err?.message);
    return false;
  }
};

/**
 * Función combinada para registrar y sincronizar el token push tras el inicio de sesión.
 */
export const registerAndSyncPushToken = async (userId?: string): Promise<string | null> => {
  const token = await registerForPushNotificationsAsync();
  if (token) {
    await savePushTokenToSupabase(token, userId);
  }
  return token;
};

export interface PushNotificationHookResult {
  expoPushToken: string | null;
  loading: boolean;
  registerPushToken: (userId?: string) => Promise<string | null>;
  saveTokenToSupabase: (token: string, userId?: string) => Promise<boolean>;
}

/**
 * Hook personalizado `usePushNotifications` para componentes de React.
 */
export const usePushNotifications = (): PushNotificationHookResult => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const registerPushToken = useCallback(async (userId?: string): Promise<string | null> => {
    setLoading(true);
    try {
      const token = await registerAndSyncPushToken(userId);
      setExpoPushToken(token);
      return token;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveToken = useCallback(async (token: string, userId?: string): Promise<boolean> => {
    return await savePushTokenToSupabase(token, userId);
  }, []);

  return {
    expoPushToken,
    loading,
    registerPushToken,
    saveTokenToSupabase: saveToken,
  };
};
