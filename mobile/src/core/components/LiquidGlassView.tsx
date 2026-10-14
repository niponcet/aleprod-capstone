import React from 'react';
import { StyleSheet, View, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, GlassStyle } from 'expo-glass-effect';

export interface LiquidGlassViewProps extends ViewProps {
  glassEffectStyle?: GlassStyle;
  isInteractive?: boolean;
  tintColor?: string;
  intensity?: number;
  borderRadius?: number;
  children?: React.ReactNode;
}

// Determinar si UIGlassEffect está soportado nativamente en tiempo de ejecución
let isNativeGlassAvailable = false;
try {
  isNativeGlassAvailable =
    Platform.OS === 'ios' &&
    typeof isGlassEffectAPIAvailable === 'function' &&
    isGlassEffectAPIAvailable();
} catch {
  isNativeGlassAvailable = false;
}

export const LiquidGlassView: React.FC<LiquidGlassViewProps> = ({
  glassEffectStyle = 'regular',
  isInteractive = false,
  tintColor,
  intensity = 80,
  borderRadius,
  style,
  children,
  ...rest
}) => {
  if (isNativeGlassAvailable) {
    return (
      <GlassView
        style={[
          styles.glassBase,
          borderRadius !== undefined && { borderRadius },
          style,
        ]}
        glassEffectStyle={glassEffectStyle}
        isInteractive={isInteractive}
        colorScheme="dark"
        tintColor={tintColor}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  // Fallback de alta fidelidad con BlurView + capa translúcida y borde especular
  return (
    <View
      style={[
        styles.fallbackContainer,
        borderRadius !== undefined && { borderRadius },
        style,
      ]}
      {...rest}
    >
      <BlurView
        intensity={intensity}
        tint="systemChromeMaterialDark"
        style={[
          StyleSheet.absoluteFill,
          borderRadius !== undefined && { borderRadius },
        ]}
      />
      <View
        style={[
          styles.innerTint,
          borderRadius !== undefined && { borderRadius },
          tintColor ? { backgroundColor: tintColor } : null,
        ]}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  glassBase: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  fallbackContainer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    position: 'relative',
  },
  innerTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 23, 28, 0.55)',
  },
});
