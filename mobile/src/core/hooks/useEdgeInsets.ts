import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface EdgeInsetsResult {
  /**
   * Padding superior para Headers.
   * En Web: usa la variable CSS var(--sat) con fallback defensivo.
   * En Nativo: usa insets.top o fallback mínimo de 20px.
   */
  topPadding: number | string;
  /**
   * Padding inferior para ScrollViews.
   * En Web: usa la variable CSS var(--sab) + extraBottomSpace (ej. 120px).
   * En Nativo: usa insets.bottom + extraBottomSpace.
   */
  bottomPadding: number | string;
  /**
   * Despeje inferior para barras flotantes (TabBar).
   */
  tabBarBottomOffset: number | string;
  /**
   * Clase CSS auxiliar para Webkit (Capa 4/5 Fleect).
   */
  headerClassName?: string;
  /**
   * Clase CSS auxiliar para ScrollView Webkit (Capa 4/5 Fleect).
   */
  scrollClassName?: string;
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Hook multiplataforma para Safe Area Insets (Edge-to-Edge).
 * En la Web delega el cálculo a variables CSS puras (--sat, --sab) mitigando
 * el letterboxing y los glitches de 0px de WebKit en iOS.
 * En Nativo utiliza los valores numéricos de react-native-safe-area-context.
 */
export function useEdgeInsets(extraBottomSpace = 120, extraTopSpace = 0): EdgeInsetsResult {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'web') {
    return {
      topPadding: extraTopSpace > 0 ? `calc(var(--sat) + ${extraTopSpace}px)` : 'var(--sat)',
      bottomPadding: `calc(var(--sab) + ${extraBottomSpace}px)`,
      tabBarBottomOffset: `calc(var(--sab) + 20px)`,
      headerClassName: 'edge-to-edge-pt',
      scrollClassName: 'edge-to-edge-pb',
      insets,
    };
  }

  return {
    topPadding: Math.max(insets.top, 20) + extraTopSpace,
    bottomPadding: insets.bottom + extraBottomSpace,
    tabBarBottomOffset: Math.max(insets.bottom, 16) + 10,
    headerClassName: undefined,
    scrollClassName: undefined,
    insets,
  };
}

