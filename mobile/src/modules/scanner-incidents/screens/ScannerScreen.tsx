import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { LiquidGlassView } from '../../../core/components/LiquidGlassView';
import { triggerHaptic } from '../../../core/utils/haptics';
import { insertLocalIncidencia } from '../../../core/db/database';

export const ScannerScreen = () => {
  const navigation = useNavigation<any>();
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
      <View style={styles.container}>
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
      navigation.navigate('AssetDetail', {
        uuid: data,
        title: data.length > 8 ? `Módulo #${data.slice(-4).toUpperCase()}` : `Módulo #${data}`,
        status: '• Operativo',
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
    <SafeAreaView style={styles.container} edges={['top']}>
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

      {/* Selector Superior de Modo con LiquidGlass */}
      <View style={styles.topSelectorContainer}>
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
      <View style={styles.bottomControls}>
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
    </SafeAreaView>
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
  topSelectorContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
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
    paddingBottom: 108,
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
