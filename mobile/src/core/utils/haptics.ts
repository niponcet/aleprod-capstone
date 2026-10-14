import * as Haptics from 'expo-haptics';

export type HapticType = 'selection' | 'light' | 'medium' | 'success' | 'warning';

/**
 * Dispara retroalimentación háptica nativa en dispositivos iOS/Android
 * de forma segura ante cualquier entorno (Expo Go, simuladores o web).
 */
export const triggerHaptic = (type: HapticType = 'selection') => {
  try {
    switch (type) {
      case 'selection':
        Haptics.selectionAsync().catch(() => {});
        break;
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        break;
    }
  } catch {
    // Silencioso si el dispositivo o runtime no soporta retroalimentación háptica
  }
};
