import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../src/core/utils/haptics';
import {
  TAB_OFFSET,
  BUTTON_SIZE,
  GAP,
  PILL_HALF_WIDTH,
} from '../../src/core/constants/navigation';

// Subcomponentes oficiales de NativeTabs
const { Icon, Label } = NativeTabs.Trigger;

// Paleta corporativa con acento en Amarillo Suave
const SOFT_YELLOW = "#FACC15"; // Amarillo suave / oro sutil
const INACTIVE_COLOR = "#71717A"; // Zinc 500 apagado y sobrio

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Calibración de centrado geométrico simétrico del bloque [Tabs Pill] + (QR):
  // 1. Un pill de 3 tabs en iOS 18 mide ~276pt (PILL_HALF_WIDTH = 138).
  // 2. Con un botón de 54pt y gap de 8pt, el bloque total mide 338pt.
  // 3. Al ampliar el host a (screenWidth + TAB_OFFSET) con marginLeft: -TAB_OFFSET:
  //    - El extremo derecho del host queda exactamente en screenWidth (sin franja negra).
  //    - UIKit centra el pill en: -TAB_OFFSET + ((screenWidth + TAB_OFFSET) / 2) = screenWidth/2 - 31pt.
  //    - Extremo derecho del pill: (screenWidth/2 - 31) + 138 = screenWidth/2 + 107.
  //    - Posición del botón QR: (screenWidth/2 + 107) + 8 = screenWidth/2 + 115.
  //    - Margen izquierdo de la pantalla al pill: (screenWidth - 338)/2.
  //    - Margen derecho de la pantalla al botón: (screenWidth - 338)/2.
  //    ¡Ambos lados son EXACTAMENTE simétricos y el bloque queda 100% centrado en la pantalla!
  const pillCenterOnScreen = -TAB_OFFSET + ((screenWidth + TAB_OFFSET) / 2);
  const pillRightEdge = pillCenterOnScreen + PILL_HALF_WIDTH;
  const buttonLeft = pillRightEdge + GAP;

  // Nivelación vertical precisa con la cápsula nativa de iOS 18 (botón de 54pt)
  const buttonBottom = insets.bottom > 0 ? insets.bottom - 7 : 6;

  return (
    <View style={styles.container}>
      {/* 1. Barra Nativa con Liquid Glass real de iOS y SF Symbols calibrada para centrado perfecto */}
      <View style={[styles.tabsHostWrapper, { width: screenWidth + TAB_OFFSET, marginLeft: -TAB_OFFSET }]}>
        <NativeTabs
          blurEffect="systemThinMaterialDark"
          backgroundColor="rgba(11, 13, 16, 0.75)"
          tintColor={SOFT_YELLOW}
          iconColor={{
            default: INACTIVE_COLOR,
            selected: SOFT_YELLOW,
          }}
          labelStyle={{
            default: { color: INACTIVE_COLOR },
            selected: { color: SOFT_YELLOW },
          }}
          disableTransparentOnScrollEdge={true}
        >
          <NativeTabs.Trigger name="index" disableScrollToTop>
            <Icon
              sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
              md="grid_view"
            />
            <Label>Inicio</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="eventos">
            <Icon
              sf="calendar"
              md="event"
            />
            <Label>Eventos</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="ajustes">
            <Icon
              sf="slider.horizontal.3"
              md="settings"
            />
            <Label>Ajustes</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </View>

      {/* 2. Botón Individual Circular de Escáner QR perfectamente nivelado al lado del tabs */}
      <TouchableOpacity
        style={[
          styles.floatingFab,
          {
            left: buttonLeft,
            bottom: buttonBottom,
          },
        ]}
        onPress={() => {
          triggerHaptic('medium');
          router.push('/scanner');
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="qr-code-outline" size={26} color="#0B0D10" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#0B0D10',
  },
  tabsHostWrapper: {
    flex: 1,
  },
  floatingFab: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: SOFT_YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: SOFT_YELLOW,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.45,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
});
