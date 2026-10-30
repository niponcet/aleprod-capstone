import React from 'react';
import { Platform, View, ViewProps } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useEdgeInsets } from '../hooks/useEdgeInsets';

export interface ScreenSafeContainerProps extends ViewProps {
  edges?: Edge[];
  children?: React.ReactNode;
}

/**
 * Contenedor seguro multiplataforma para pantallas completas (Login, Recuperación, Detalles).
 * - En Web: Renderiza un <View> estándar con estilos CSS puros (env(safe-area-inset-*)),
 *   erradicando el bug de concatenación aritmética ("env(...)0") de SafeAreaView.web.js.
 * - En Nativo (iOS/Android): Renderiza <SafeAreaView> preservando la medición nativa y edges originales.
 */
export const ScreenSafeContainer: React.FC<ScreenSafeContainerProps> = ({
  style,
  edges = ['top', 'bottom', 'left', 'right'],
  children,
  ...rest
}) => {
  const { safeAreaStyle } = useEdgeInsets();

  if (Platform.OS === 'web') {
    return (
      <View style={[style, safeAreaStyle]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView style={style} edges={edges} {...rest}>
      {children}
    </SafeAreaView>
  );
};

export default ScreenSafeContainer;

