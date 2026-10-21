import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { LiquidGlassView } from '../../../core/components/LiquidGlassView';
import { triggerHaptic } from '../../../core/utils/haptics';

interface IncidentScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (qrUuid: string) => void;
  onManualEntry: () => void;
  eventName?: string;
}

export const IncidentScannerModal: React.FC<IncidentScannerModalProps> = ({
  visible,
  onClose,
  onScanSuccess,
  onManualEntry,
  eventName = 'Evento en Curso',
}) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);
  const [torchActive, setTorchActive] = useState<boolean>(false);

  const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned || !data) return;
    setScanned(true);
    triggerHaptic('success');
    onScanSuccess(data.trim());

    // Reiniciar flag tras breve pausa
    setTimeout(() => setScanned(false), 1200);
  };

  const toggleTorch = () => {
    triggerHaptic('light');
    setTorchActive((prev) => !prev);
  };

  const handleSimulateScan = () => {
    const sampleUuid = `aleprod-p39-${Math.floor(1000 + Math.random() * 9000)}-cl`;
    handleBarcodeScanned({ type: 'qr', data: sampleUuid });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Cámara de pantalla completa */}
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torchActive}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
        ) : (
          <View style={[styles.permissionContainer, { paddingTop: insets.top + 40 }]}>
            <Ionicons name="camera-outline" size={54} color={colors.primaryAmber} />
            <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
            <Text style={styles.permissionDesc}>
              Para asociar la palmeta defectuosa a la incidencia necesitamos escanear su código QR.
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.permissionButtonText}>Habilitar Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                triggerHaptic('light');
                onManualEntry();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Ingresar código manualmente</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Capa de Retícula y Enfoque (Visual Aleprod) */}
        {permission?.granted && (
          <View style={styles.overlay} pointerEvents="box-none">
            {/* Header Flotante */}
            <View style={[styles.headerContainer, { top: insets.top + 10 }]}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  triggerHaptic('selection');
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>

              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>Escanear Palmeta</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {eventName}
                </Text>
              </View>

              {/* Botón Linterna (Crucial en eventos de noche) */}
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  torchActive && styles.headerButtonTorchActive,
                ]}
                onPress={toggleTorch}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={torchActive ? 'flash' : 'flash-outline'}
                  size={20}
                  color={torchActive ? '#000000' : colors.primaryAmber}
                />
              </TouchableOpacity>
            </View>

            {/* Recuadro de Escaneo Central con Esquinas Doradas */}
            <View style={styles.reticleContainer}>
              <View style={styles.reticleBox}>
                {/* Esquinas doradas */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />

                <Text style={styles.reticleInstruction}>
                  Apunta al código QR del activo
                </Text>
              </View>
            </View>

            {/* Barra Inferior de Acciones */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
              {/* Botón Fallback Manual */}
              <TouchableOpacity
                style={styles.manualEntryButton}
                onPress={() => {
                  triggerHaptic('selection');
                  onManualEntry();
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="keypad-outline"
                  size={18}
                  color={colors.primaryAmber}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.manualEntryText}>¿QR roto? Ingresar código manual</Text>
              </TouchableOpacity>

              {/* Atajo de Simulación para Pruebas / Desarrollo */}
              {__DEV__ && (
                <TouchableOpacity
                  style={styles.devSimulateButton}
                  onPress={handleSimulateScan}
                  activeOpacity={0.7}
                >
                  <Text style={styles.devSimulateText}>⚡ Simular QR Aleprod</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.background,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.primaryAmber,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.primaryAmber,
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  headerContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 23, 28, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonTorchActive: {
    backgroundColor: colors.primaryAmber,
    borderColor: colors.primaryLight,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.primaryAmber,
    marginTop: 2,
  },
  reticleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleBox: {
    width: 250,
    height: 250,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primaryAmber,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  reticleInstruction: {
    position: 'absolute',
    bottom: -36,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 23, 28, 0.88)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
  },
  manualEntryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  devSimulateButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(229, 152, 25, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 152, 25, 0.3)',
  },
  devSimulateText: {
    color: colors.primaryAmber,
    fontSize: 12,
    fontWeight: '600',
  },
});
