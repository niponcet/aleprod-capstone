import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { LiquidGlassView } from '../../../core/components/LiquidGlassView';
import { triggerHaptic } from '../../../core/utils/haptics';
import { insertLocalIncidencia } from '../../../core/db/database';

export const ScannerScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState<'inspection' | 'burst'>('inspection');
  const [burstCount, setBurstCount] = useState<number>(0);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <TouchableOpacity
          style={[styles.closeButtonRight, { top: Math.max(insets.top + 6, 44) }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={22} color="#F87171" />
        </TouchableOpacity>
        <Ionicons name="camera-outline" size={48} color={colors.primaryAmber} style={{ marginBottom: 16 }} />
        <Text style={styles.permissionText}>
          Necesitamos acceso a la cámara para escanear los QR de las pantallas.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Otorgar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    triggerHaptic('success');

    if (mode === 'inspection') {
      // Modo Inspección: Navegar al detalle del activo
      router.push({
        pathname: '/asset-detail',
        params: {
          uuid: data,
          title: data.length > 8 ? `Módulo #${data.slice(-4).toUpperCase()}` : `Módulo #${data}`,
          status: '• Operativo',
        },
      });
      // Rehabilitar escaneo tras navegación
      setTimeout(() => setScanned(false), 1500);
    } else {
      // Modo Ráfaga (HU-13): Enrolamiento continuo
      try {
        insertLocalIncidencia(
          data,
          'Aprovisionamiento Masivo (Modo Ráfaga)',
          undefined,
          'Enrolamiento en bodega',
          'Bodega Central'
        );
        setBurstCount((prev) => prev + 1);
        setLastScannedCode(data);
      } catch (err) {
        console.error('Error enrolando en ráfaga:', err);
      }
      // Reanudar inmediatamente en 1.2 segundos para el siguiente código
      setTimeout(() => setScanned(false), 1200);
    }
  };

  const handleSimulateScan = () => {
    const sampleUuid = `aleprod-p39-${Math.floor(1000 + Math.random() * 9000)}-cl`;
    handleBarcodeScanned({ type: 'qr', data: sampleUuid });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Cámara de fondo */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      {/* Botón Cerrar (✕) ajustado a la esquina superior derecha, más arriba que el toggle y en rojo suave */}
      <TouchableOpacity
        style={[
          styles.closeButtonRight,
          {
            top: Math.max(insets.top + 6, 44),
          },
        ]}
        onPress={() => {
          triggerHaptic('selection');
          router.back();
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={22} color="#F87171" />
      </TouchableOpacity>

      {/* Selector Superior de Modo con LiquidGlass posicionado más abajo para mejor ergonomía */}
      <View
        style={[
          styles.modeToggleContainer,
          {
            marginTop: Math.max(insets.top + 50, 96),
          },
        ]}
      >
        <LiquidGlassView borderRadius={24} style={styles.modeToggleGroup}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'inspection' && styles.modeButtonActive,
            ]}
            onPress={() => {
              triggerHaptic('selection');
              setMode('inspection');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="search-outline"
              size={15}
              color={mode === 'inspection' ? '#000000' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.modeButtonText,
                mode === 'inspection' && styles.modeButtonTextActive,
              ]}
            >
              Inspección
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'burst' && styles.modeButtonActive,
            ]}
            onPress={() => {
              triggerHaptic('selection');
              setMode('burst');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flash-outline"
              size={15}
              color={mode === 'burst' ? '#000000' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.modeButtonText,
                mode === 'burst' && styles.modeButtonTextActive,
              ]}
            >
              Modo Ráfaga (HU-13)
            </Text>
          </TouchableOpacity>
        </LiquidGlassView>
      </View>

      {/* Overlay del Visor con esquinas doradas */}
      <View style={styles.viewfinderCenterWrapper}>
        <View style={styles.viewfinderBox}>
          {/* Esquinas doradas */}
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          {/* Línea animada de escaneo / Mira */}
          <View style={styles.scanTargetHole} />
        </View>

        {/* Indicador de Modo / Contador Ráfaga con LiquidGlass */}
        {mode === 'burst' ? (
          <LiquidGlassView borderRadius={16} style={styles.burstCounterCard}>
            <Text style={styles.burstCounterTitle}>ENROLAMIENTO CONTINUO</Text>
            <Text style={styles.burstCounterNumber}>{burstCount} palmetas</Text>
            {lastScannedCode && (
              <Text style={styles.lastScannedText} numberOfLines={1}>
                Última: #{lastScannedCode.slice(-4).toUpperCase()} ✓
              </Text>
            )}
          </LiquidGlassView>
        ) : (
          <Text style={styles.viewfinderInstructions}>
            Apunta al código QR de la palmeta LED
          </Text>
        )}
      </View>

      {/* Barra Inferior con Botón de Simulación dentro de LiquidGlass */}
      <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
        <LiquidGlassView borderRadius={16} style={styles.bottomGlassCard}>
          <TouchableOpacity
            style={styles.simulateButton}
            onPress={handleSimulateScan}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles-outline" size={18} color={colors.primaryAmber} style={{ marginRight: 8 }} />
            <Text style={styles.simulateButtonText}>
              Simular Escaneo (#LED-A45)
            </Text>
          </TouchableOpacity>
        </LiquidGlassView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  permissionText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 28,
    fontSize: 15,
  },
  permissionButton: {
    backgroundColor: colors.primaryAmber,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  closeButtonRight: {
    position: 'absolute',
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    zIndex: 20,
  },
  modeToggleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 10,
  },
  modeToggleGroup: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  modeButtonActive: {
    backgroundColor: colors.primaryAmber,
  },
  modeButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  viewfinderCenterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderBox: {
    width: 250,
    height: 250,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: colors.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  scanTargetHole: {
    width: 210,
    height: 210,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 14,
    borderStyle: 'dashed',
  },
  viewfinderInstructions: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  burstCounterCard: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  burstCounterTitle: {
    color: colors.primaryAmber,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  burstCounterNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 2,
  },
  lastScannedText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  bottomControls: {
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  bottomGlassCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 20,
    width: '100%',
  },
  simulateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
