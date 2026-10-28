import { Alert, Platform, AlertButton } from 'react-native';

/**
 * Polyfill de Alert.alert para React Native Web / PWA.
 * En react-native-web, Alert.alert es una función vacía (static alert() {}).
 * Este polyfill redirige las alertas informativas a window.alert y las
 * alertas con opciones de acción/cancelación a window.confirm.
 */
export function setupAlertPolyfill() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  Alert.alert = (
    title?: string,
    message?: string,
    buttons?: AlertButton[]
  ) => {
    const dialogMessage = [title, message].filter(Boolean).join('\n\n');

    // 1. Sin botones o con un único botón informativo (ej: [{ text: 'Entendido' }])
    if (!buttons || buttons.length <= 1) {
      window.alert(dialogMessage);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
      return;
    }

    // 2. Múltiples botones (confirmación o acción destructiva vs cancelar)
    const cancelButton = buttons.find((b) => b.style === 'cancel');
    const confirmButton =
      buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];

    const confirmed = window.confirm(dialogMessage);
    if (confirmed) {
      confirmButton?.onPress?.();
    } else {
      cancelButton?.onPress?.();
    }
  };
}

