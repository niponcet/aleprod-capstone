import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../utils/haptics';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

// Constantes de diseño y geometría compacta y estilizada
const CAPSULE_HEIGHT = 58;
const BUTTON_SIZE = 58; // Mismo tamaño exacto que la cápsula para equilibrio simétrico
const GAP = 10;
const INNER_PAD_H = 4;
const INDICATOR_HEIGHT = 48;
const MIN_SIDE_MARGIN = 16;
const MAX_CAPSULE_WIDTH = 260;

// Paleta de colores oficial adaptada a Aleprod Terreno con translucidez Liquid Glass real
const COLORS = {
  glassBackground:
    Platform.OS === 'ios'
      ? 'rgba(10, 15, 28, 0.42)'
      : 'rgba(10, 15, 28, 0.70)',
  solidFallback:
    Platform.OS === 'ios' ? 'transparent' : 'rgba(15, 20, 34, 0.75)',
  highlight: 'rgba(255, 255, 255, 0.12)',
  border: 'rgba(255, 255, 255, 0.14)',
  highlightBorder: 'rgba(255, 255, 255, 0.22)',
  active: '#FFFFFF',
  inactive: '#94A3B8',
  qrButton: '#2563EB',
  qrBorder: 'rgba(255, 255, 255, 0.22)',
};

// Configuración de Spring elástica y ultra-fluida (Apple Liquid Glass physics)
const SPRING_CONFIG = {
  bounciness: 12,
  speed: 16,
  useNativeDriver: true,
};

interface TabConfig {
  name: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    name: 'index',
    label: 'Inicio',
    activeIcon: 'grid',
    inactiveIcon: 'grid-outline',
  },
  eventos: {
    name: 'eventos',
    label: 'Eventos',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  ajustes: {
    name: 'ajustes',
    label: 'Ajustes',
    activeIcon: 'settings',
    inactiveIcon: 'settings-outline',
  },
};

export const LiquidGlassTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [optimisticIndex, setOptimisticIndex] = useState<number | null>(null);

  // Dimensionamiento simétrico y responsivo del bloque [Cápsula] + [Gap] + [Botón QR]
  const availableWidth = screenWidth - MIN_SIDE_MARGIN * 2;
  const capsuleWidth = Math.min(
    MAX_CAPSULE_WIDTH,
    availableWidth - BUTTON_SIZE - GAP
  );
  const totalBlockWidth = capsuleWidth + GAP + BUTTON_SIZE;
  const blockSideMargin = Math.max(MIN_SIDE_MARGIN, (screenWidth - totalBlockWidth) / 2);

  // Ancho exacto de cada ítem dentro de la cápsula
  const tabCount = Math.max(state.routes.length, 1);
  const usableWidth = capsuleWidth - INNER_PAD_H * 2;
  const itemWidth = usableWidth / tabCount;

  // Límites horizontales para el indicador
  const minX = INNER_PAD_H;
  const maxX = INNER_PAD_H + (tabCount - 1) * itemWidth;

  // Referencias reactivas para evitar stale closures en PanResponder
  const stateRef = useRef(state);
  stateRef.current = state;

  const navigationRef = useRef(navigation);
  navigationRef.current = navigation;

  const itemWidthRef = useRef(itemWidth);
  itemWidthRef.current = itemWidth;

  const tabCountRef = useRef(tabCount);
  tabCountRef.current = tabCount;

  const minXRef = useRef(minX);
  minXRef.current = minX;

  const maxXRef = useRef(maxX);
  maxXRef.current = maxX;

  // Valor animado nativo para la traslación horizontal
  const activeIndex = state.index;
  const indicatorX = useRef(new Animated.Value(INNER_PAD_H + activeIndex * itemWidth)).current;

  // Referencias mutables para cálculo gestual continuo
  const startIndicatorX = useRef(INNER_PAD_H + activeIndex * itemWidth);
  const lastHapticIndex = useRef(activeIndex);
  const lastAnimatedTargetX = useRef<number>(INNER_PAD_H + activeIndex * itemWidth);
  const isDragging = useRef(false);

  // Sincronización cuando cambia el índice activo desde navegación externa o al completarse la transición
  useEffect(() => {
    setOptimisticIndex(null);
    if (!isDragging.current) {
      const targetX = INNER_PAD_H + activeIndex * itemWidth;
      // Prevenir reseteo de animación si ya está en curso hacia el mismo destino
      if (Math.abs(lastAnimatedTargetX.current - targetX) > 0.5) {
        lastAnimatedTargetX.current = targetX;
        indicatorX.stopAnimation();
        Animated.spring(indicatorX, {
          toValue: targetX,
          ...SPRING_CONFIG,
        }).start();
      }
      startIndicatorX.current = targetX;
      lastHapticIndex.current = activeIndex;
    }
  }, [activeIndex, itemWidth, indicatorX]);

  // Gestor de toques y arrastre en tiempo real con PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 2,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => Math.abs(gestureState.dx) > 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        isDragging.current = true;
        indicatorX.stopAnimation();
        const touchX = evt.nativeEvent.locationX;
        const currentItemWidth = itemWidthRef.current;
        const currentTabCount = tabCountRef.current;
        const currentMinX = minXRef.current;
        const currentMaxX = maxXRef.current;

        // Centrar el selector en el toque para seguimiento gestual
        const targetPos = Math.min(
          Math.max(touchX - currentItemWidth / 2, currentMinX),
          currentMaxX
        );
        startIndicatorX.current = targetPos;

        const fingerInside = touchX - INNER_PAD_H;
        const touchedIndex = Math.min(
          Math.max(Math.floor(fingerInside / currentItemWidth), 0),
          currentTabCount - 1
        );
        lastHapticIndex.current = touchedIndex;
        triggerHaptic('light');
      },
      onPanResponderMove: (_, gestureState) => {
        const currentItemWidth = itemWidthRef.current;
        const currentTabCount = tabCountRef.current;
        const currentMinX = minXRef.current;
        const currentMaxX = maxXRef.current;

        // Desplazamiento puro en el hilo UI nativo (cero re-renders de React)
        const newPos = Math.min(
          Math.max(startIndicatorX.current + gestureState.dx, currentMinX),
          currentMaxX
        );
        indicatorX.setValue(newPos);

        // Feedback háptico ligero al cruzar umbrales
        const centerPos = newPos + currentItemWidth / 2 - INNER_PAD_H;
        const hoverIdx = Math.min(
          Math.max(Math.floor(centerPos / currentItemWidth), 0),
          currentTabCount - 1
        );

        if (hoverIdx !== lastHapticIndex.current) {
          lastHapticIndex.current = hoverIdx;
          triggerHaptic('selection');
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        isDragging.current = false;
        const currentItemWidth = itemWidthRef.current;
        const currentTabCount = tabCountRef.current;
        const currentMinX = minXRef.current;
        const currentMaxX = maxXRef.current;
        const currentState = stateRef.current;
        const currentNav = navigationRef.current;

        // Determinar índice final según si fue tap rápido o arrastre
        let finalIndex: number;
        if (Math.abs(gestureState.dx) < 6) {
          const touchX = evt.nativeEvent.locationX;
          const fingerInside = touchX - INNER_PAD_H;
          finalIndex = Math.min(
            Math.max(Math.floor(fingerInside / currentItemWidth), 0),
            currentTabCount - 1
          );
        } else {
          const finalPos = Math.min(
            Math.max(startIndicatorX.current + gestureState.dx, currentMinX),
            currentMaxX
          );
          const centerPos = finalPos + currentItemWidth / 2 - INNER_PAD_H;
          finalIndex = Math.min(
            Math.max(Math.floor(centerPos / currentItemWidth), 0),
            currentTabCount - 1
          );
        }

        // Activación visual optimista y disparo del spring con rebote elástico
        setOptimisticIndex(finalIndex);
        const snapTargetX = INNER_PAD_H + finalIndex * currentItemWidth;
        startIndicatorX.current = snapTargetX;
        lastAnimatedTargetX.current = snapTargetX;

        indicatorX.stopAnimation();
        Animated.spring(indicatorX, {
          toValue: snapTargetX,
          ...SPRING_CONFIG,
        }).start();

        // Ejecutar navegación en Expo Router garantizando acceso al estado real
        const isFocused = currentState.index === finalIndex;
        const targetRoute = currentState.routes[finalIndex];

        if (targetRoute) {
          const event = currentNav.emit({
            type: 'tabPress',
            target: targetRoute.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            triggerHaptic('medium');
            currentNav.navigate(targetRoute.name);
          }
        }
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        setOptimisticIndex(null);
        const currentItemWidth = itemWidthRef.current;
        const currentState = stateRef.current;
        const snapTargetX = INNER_PAD_H + currentState.index * currentItemWidth;
        startIndicatorX.current = snapTargetX;
        lastAnimatedTargetX.current = snapTargetX;
        indicatorX.stopAnimation();
        Animated.spring(indicatorX, {
          toValue: snapTargetX,
          ...SPRING_CONFIG,
        }).start();
      },
    })
  ).current;

  // Separación vertical de seguridad (respeta la barra de inicio de iOS y navbar de Android)
  const bottomOffset = Math.max(insets.bottom, 12) + 6;

  // Índice visual efectivo (resuelve taps inmediatos y sincronización instantánea)
  const effectiveIndex =
    optimisticIndex !== null ? optimisticIndex : state.index;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlayContainer,
        {
          bottom: bottomOffset,
          paddingHorizontal: blockSideMargin,
        },
      ]}
    >
      <View pointerEvents="box-none" style={styles.contentRow}>
        {/* 1. Cápsula Flotante Liquid Glass con Seguimiento Gestual */}
        <View
          style={[styles.capsuleWrapper, { width: capsuleWidth }]}
          {...panResponder.panHandlers}
        >
          {/* Fondo desenfocado real con fallback translúcido */}
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 45}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.glassOverlay]}
          />

          {/* Indicador Activo Deslizante con Rebote Spring */}
          <Animated.View
            pointerEvents="none"
            shouldRasterizeIOS
            renderToHardwareTextureAndroid
            style={[
              styles.slidingIndicator,
              {
                width: itemWidth,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          />

          {/* Botones de Pestañas (pointerEvents="none" para preservar las coordenadas exactas de la cápsula) */}
          <View pointerEvents="none" style={styles.tabsRow}>
            {state.routes.map((route, index) => {
              const effectiveFocused = effectiveIndex === index;
              const config = TAB_CONFIGS[route.name] || {
                name: route.name,
                label: route.name,
                activeIcon: 'ellipse' as const,
                inactiveIcon: 'ellipse-outline' as const,
              };

              return (
                <View
                  key={route.key}
                  style={[styles.tabButton, { width: itemWidth }]}
                >
                  <Ionicons
                    name={effectiveFocused ? config.activeIcon : config.inactiveIcon}
                    size={20.5}
                    color={effectiveFocused ? COLORS.active : COLORS.inactive}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      effectiveFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                    ]}
                    numberOfLines={1}
                  >
                    {config.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 2. Botón QR Circular Independiente en Azul Corporativo */}
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => {
            triggerHaptic('medium');
            router.push('/scanner');
          }}
          activeOpacity={0.85}
          accessibilityLabel="Escanear código QR"
          accessibilityRole="button"
        >
          <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleWrapper: {
    height: CAPSULE_HEIGHT,
    borderRadius: CAPSULE_HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: GAP,
    backgroundColor: COLORS.solidFallback,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.38,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  glassOverlay: {
    backgroundColor: COLORS.glassBackground,
  },
  slidingIndicator: {
    position: 'absolute',
    top: (CAPSULE_HEIGHT - INDICATOR_HEIGHT) / 2,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    backgroundColor: COLORS.highlight,
    borderWidth: 1,
    borderColor: COLORS.highlightBorder,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: INNER_PAD_H,
  },
  tabButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 1.5,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: COLORS.active,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: COLORS.inactive,
    fontWeight: '500',
  },
  qrButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: COLORS.qrButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.qrBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default LiquidGlassTabBar;
