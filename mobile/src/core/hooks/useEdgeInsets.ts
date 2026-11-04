import { Platform, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface EdgeInsetsResult {
  /**
   * Padding superior para Headers.
   * En Web: usa CSS env(safe-area-inset-top) + webTopSpace con un piso defensivo de 20px (Desktop/Android).
   * En Nativo: usa insets.top + nativeTopSpace con un piso mínimo de 20px (nativeTopSpace = 8 estandariza el despeje visual del Header frente al Notch/Dynamic Island).
   */
  topPadding: number | string;
  /**
   * Padding inferior para ScrollViews.
   * En Web: usa CSS env(safe-area-inset-bottom) + bottomSpace (74px por defecto).
   * En Nativo: usa bottomSpace directamente (UIKit/react-native-screens ya inyecta insets.bottom automáticamente al ScrollView).
   */
  bottomPadding: number | string;
  /**
   * Despeje inferior para barras flotantes (TabBar).
   * En Web: max(calc(env(safe-area-inset-bottom, 0px) - 14px), 12px).
   * En Nativo: Math.max(insets.bottom - 14, 12) (aproximadamente 20px en iPhone con Face ID).
   */
  tabBarBottomOffset: number | string;
  /**
   * Padding lateral izquierdo para recortes o modo apaisado.
   */
  leftPadding: number | string;
  /**
   * Padding lateral derecho para recortes o modo apaisado.
   */
  rightPadding: number | string;
  /**
   * Estilo de Safe Area completo para contenedores de pantalla completa (Login, Detalles).
   * En Web: inyecta env(safe-area-inset-*) para todos los bordes.
   * En Nativo: objeto vacío para que <SafeAreaView> gestione los insets sin duplicación.
   */
  safeAreaStyle: ViewStyle;
  /**
   * Insets numéricos crudos (provistos por react-native-safe-area-context en nativo).
   */
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Hook central multiplataforma para Safe Area Insets (Edge-to-Edge).
 * - En Web: delega el cálculo a variables de entorno CSS puras (env(safe-area-inset-*)),
 *   solucionando la limitación de React Native Web / Expo Router que devuelven ceros.
 * - En Nativo: utiliza mediciones de react-native-safe-area-context preservando
 *   la geometría original sin agregar desfases artificiales (nativeTopSpace = 0 por defecto).
 *
 * @param bottomSpace Margen adicional inferior para ScrollViews (por defecto 74px para despejar la barra flotante).
 * @param webTopSpace Margen adicional superior para Headers en Web (por defecto 12px sobre el área segura de la Dynamic Island/Notch).
 * @param nativeTopSpace Margen adicional superior para Headers en Nativo (por defecto 8px para respiración visual frente a la Dynamic Island/Notch).
 */
export function useEdgeInsets(
  bottomSpace: number = 70,
  webTopSpace: number = 12,
  nativeTopSpace: number = 8
): EdgeInsetsResult {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'web') {
    const barHeight = 58;
    const barOffset = `max(calc(env(safe-area-inset-bottom, 0px) - 22px), 12px)`;
    const tabOffset = `calc(${barOffset} - var(--gap, 0px))`;
    return {
      topPadding: `max(calc(env(safe-area-inset-top, 0px) + ${webTopSpace}px), 20px)`,
      bottomPadding: `calc(${barHeight + 12}px + ${barOffset})`,
      tabBarBottomOffset: tabOffset,
      leftPadding: 'env(safe-area-inset-left, 0px)',
      rightPadding: 'env(safe-area-inset-right, 0px)',
      safeAreaStyle: {
        paddingTop: ('env(safe-area-inset-top, 0px)' as any),
        paddingBottom: ('env(safe-area-inset-bottom, 0px)' as any),
        paddingLeft: ('env(safe-area-inset-left, 0px)' as any),
        paddingRight: ('env(safe-area-inset-right, 0px)' as any),
      },
      insets,
    };
  }

  return {
    topPadding: Math.max(insets.top + nativeTopSpace, 20),
    bottomPadding: bottomSpace,
    tabBarBottomOffset: Math.max(insets.bottom - 22, 10),
    leftPadding: insets.left,
    rightPadding: insets.right,
    safeAreaStyle: {},
    insets,
  };
}
