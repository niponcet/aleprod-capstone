import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { LiquidGlassView } from '../../../core/components/LiquidGlassView';
import { triggerHaptic } from '../../../core/utils/haptics';
import {
  provisionPalmeta,
  generateLoteIngreso,
  ProvisionResult,
} from '../../../core/api/palmetas';

interface ToastState {
  type: 'success' | 'duplicate' | 'offline' | 'error';
  title: string;
  message: string;
  code: string;
}

export const ScannerScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState<'inspection' | 'burst'>('inspection');
  const [burstCount, setBurstCount] = useState<number>(0);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentLote] = useState<string>(() => generateLoteIngreso());
  const [toast, setToast] = useState<ToastState | null>(null);

  // Animación del banner toast rápido
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.spring(toastAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, 2600);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }]}>
        <StatusBar barStyle="light-content" />
        <TouchableOpacity
          style={[styles.closeButtonRight, { top: Math.max(insets.top + 6, 44) }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={22} color="#EF4444" />
        </TouchableOpacity>
        <Ionicons name="camera-outline" size={48} color={colors.primaryAmber} style={{ marginBottom: 16 }} />
        <Text style={styles.permissionText}>
          Necesitamos acceso a la cámara para escanear los QR de las palmetas LED.
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

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned || isProcessing) return;
    setScanned(true);

    if (mode === 'inspection') {
      // Modo Inspección: Navegar al detalle del activo
      triggerHaptic('success');
      router.push({
        pathname: '/asset-detail',
        params: {
          uuid: data,
          title: data.length > 8 ? `Módulo #${data.slice(-4).toUpperCase()}` : `Módulo #${data}`,
          status: '• Operativo',
        },
      });
      setTimeout(() => setScanned(false), 1500);
      return;
    }

    // Modo Ráfaga (HU-13): Aprovisionamiento masivo continuo
    setIsProcessing(true);
    try {
      const result: ProvisionResult = await provisionPalmeta(data, currentLote);

      if (result.status === 'duplicate') {
        // Manejo de duplicados: aviso visual rápido (toast) sin romper la ráfaga
        triggerHaptic('warning');
        setToast({
          type: 'duplicate',
          title: 'PALMETA YA REGISTRADA',
          message: 'Este código QR ya se encuentra en el inventario',
          code: data,
        });
      } else if (result.status === 'cloud_created') {
        // Inserción exitosa en Supabase (palmetas_led)
        triggerHaptic('success');
        setBurstCount((prev) => prev + 1);
        setLastScannedCode(data);
        setToast({
          type: 'success',
          title: 'ENROLADA EN SUPABASE',
          message: `Lote asignado: ${result.lote} · Estado: Operativo`,
          code: data,
        });
      } else if (result.status === 'offline_queued') {
        // Resiliencia offline: guardada en SQLite (palmetas_pendientes)
        triggerHaptic('success');
        setBurstCount((prev) => prev + 1);
        setLastScannedCode(data);
        setToast({
          type: 'offline',
          title: 'GUARDADA OFFLINE (SQLITE)',
          message: 'Sin internet · Se sincronizará automáticamente',
          code: data,
        });
      } else {
        triggerHaptic('error');
        setToast({
          type: 'error',
          title: 'ERROR DE REGISTRO',
          message: result.message || 'No fue posible registrar la palmeta',
          code: data,
        });
      }
    } catch (err: any) {
      console.error('Error durante escaneo en ráfaga:', err);
      triggerHaptic('error');
      setToast({
        type: 'error',
        title: 'ERROR EN EL PROCESO',
        message: err?.message || 'Error inesperado al aprovisionar',
        code: data,
      });
    } finally {
      setIsProcessing(false);
      // Reanudar cámara en 1.2 segundos para escaneo rápido continuo
      setTimeout(() => {
        setScanned(false);
      }, 1200);
    }
  };

  const handleSimulateScan = () => {
    // Generar código UUID de muestra para simular aprovisionamiento
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const sampleUuid = `aleprod-p39-${randomHex}-cl`;
    handleBarcodeScanned({ type: 'qr', data: sampleUuid });
  };

  const handleSimulateDuplicate = () => {
    if (lastScannedCode) {
      handleBarcodeScanned({ type: 'qr', data: lastScannedCode });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Cámara de fondo */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned || isProcessing ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      {/* Botón Cerrar (✕) */}
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
        <Ionicons name="close" size={22} color="#EF4444" />
      </TouchableOpacity>

      {/* Selector Superior de Modo con LiquidGlass */}
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
              name="flash"
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

        {/* Banner Toast Flotante para Feedback Visual Rápido sin Detener Ráfaga */}
        {toast && (
          <Animated.View
            style={[
              styles.toastAnimatedContainer,
              {
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.toastCard,
                toast.type === 'duplicate' && styles.toastCardDuplicate,
                toast.type === 'success' && styles.toastCardSuccess,
                toast.type === 'offline' && styles.toastCardOffline,
                toast.type === 'error' && styles.toastCardError,
              ]}
            >
              <View style={styles.toastIconWrapper}>
                {toast.type === 'duplicate' && (
                  <Ionicons name="warning" size={20} color="#F59E0B" />
                )}
                {toast.type === 'success' && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                )}
                {toast.type === 'offline' && (
                  <Ionicons name="cloud-offline" size={20} color={colors.primaryAmber} />
                )}
                {toast.type === 'error' && (
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                )}
              </View>

              <View style={styles.toastContent}>
                <View style={styles.toastHeaderRow}>
                  <Text
                    style={[
                      styles.toastTitle,
                      toast.type === 'duplicate' && { color: '#F59E0B' },
                      toast.type === 'success' && { color: colors.success },
                      toast.type === 'offline' && { color: colors.primaryAmber },
                      toast.type === 'error' && { color: '#EF4444' },
                    ]}
                  >
                    {toast.title}
                  </Text>
                  <Text style={styles.toastCode} numberOfLines={1}>
                    #{toast.code.slice(-6).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.toastMessage}>{toast.message}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Overlay del Visor con esquinas doradas */}
      <View style={styles.viewfinderCenterWrapper}>
        <View style={styles.viewfinderBox}>
          {/* Esquinas doradas */}
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />

          {/* Línea animada / Mira */}
          <View style={styles.scanTargetHole}>
            {isProcessing && (
              <View style={styles.processingCenter}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.processingText}>Enrolando...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Indicador de Modo / Contador Ráfaga con LiquidGlass */}
        {mode === 'burst' ? (
          <LiquidGlassView borderRadius={16} style={styles.burstCounterCard}>
            <View style={styles.burstHeaderRow}>
              <View style={styles.burstLoteBadge}>
                <Ionicons name="cube-outline" size={11} color={colors.primaryAmber} style={{ marginRight: 4 }} />
                <Text style={styles.burstLoteText}>{currentLote}</Text>
              </View>
              <Text style={styles.burstCounterTitle}>ENROLAMIENTO CONTINUO</Text>
            </View>

            <Text style={styles.burstCounterNumber}>{burstCount} palmetas</Text>

            {lastScannedCode ? (
              <Text style={styles.lastScannedText} numberOfLines={1}>
                Última: #{lastScannedCode.slice(-6).toUpperCase()} ✓
              </Text>
            ) : (
              <Text style={styles.lastScannedPlaceholder}>Apunta a los QR sucesivamente</Text>
            )}
          </LiquidGlassView>
        ) : (
          <Text style={styles.viewfinderInstructions}>
            Apunta al código QR de la palmeta LED
          </Text>
        )}
      </View>

      {/* Barra Inferior con Controles de Simulación dentro de LiquidGlass */}
      <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
        <LiquidGlassView borderRadius={16} style={styles.bottomGlassCard}>
          <View style={styles.bottomControlsRow}>
            <TouchableOpacity
              style={[styles.simulateButton, isProcessing && { opacity: 0.6 }]}
              onPress={handleSimulateScan}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles-outline" size={18} color={colors.primaryAmber} style={{ marginRight: 8 }} />
              <Text style={styles.simulateButtonText}>
                {isProcessing ? 'Enrolando...' : 'Simular Nuevo QR'}
              </Text>
            </TouchableOpacity>

            {mode === 'burst' && lastScannedCode && (
              <TouchableOpacity
                style={[styles.duplicateButton, isProcessing && { opacity: 0.6 }]}
                onPress={handleSimulateDuplicate}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Ionicons name="copy-outline" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={styles.duplicateButtonText}>Probar Duplicado</Text>
              </TouchableOpacity>
            )}
          </View>
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
    paddingHorizontal: 16,
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
  toastAnimatedContainer: {
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '92%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(20, 23, 28, 0.95)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  toastCardDuplicate: {
    borderColor: 'rgba(245, 158, 11, 0.65)',
    backgroundColor: 'rgba(30, 24, 15, 0.96)',
  },
  toastCardSuccess: {
    borderColor: 'rgba(16, 185, 129, 0.65)',
    backgroundColor: 'rgba(12, 32, 24, 0.96)',
  },
  toastCardOffline: {
    borderColor: 'rgba(212, 175, 55, 0.65)',
    backgroundColor: 'rgba(32, 28, 16, 0.96)',
  },
  toastCardError: {
    borderColor: 'rgba(239, 68, 68, 0.65)',
    backgroundColor: 'rgba(35, 15, 15, 0.96)',
  },
  toastIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  toastContent: {
    flex: 1,
  },
  toastHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  toastTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  toastCode: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  toastMessage: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingCenter: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    color: colors.primaryAmber,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
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
    minWidth: 240,
  },
  burstHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  burstLoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  burstLoteText: {
    color: colors.primaryAmber,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  burstCounterTitle: {
    color: colors.textSecondary,
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
  lastScannedPlaceholder: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  bottomControls: {
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
  },
  bottomGlassCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 6,
  },
  bottomControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  simulateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  simulateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  duplicateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 10,
    marginLeft: 8,
  },
  duplicateButtonText: {
    color: colors.primaryAmber,
    fontSize: 12,
    fontWeight: '700',
  },
});
