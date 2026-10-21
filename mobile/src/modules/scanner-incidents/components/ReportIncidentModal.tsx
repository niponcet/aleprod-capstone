import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { LiquidGlassView } from '../../../core/components/LiquidGlassView';
import { triggerHaptic } from '../../../core/utils/haptics';
import { insertLocalIncidencia } from '../../../core/db/database';

export interface ReportIncidentModalProps {
  visible: boolean;
  onClose: () => void;
  qrUuid?: string;
  eventoId?: string;
  eventoNombre?: string;
  onSuccess?: () => void;
  onRequestScan?: () => void;
}

interface ComponentOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const COMPONENTS: ComponentOption[] = [
  { id: 'Cable de datos', label: 'Cable de datos', icon: 'git-network-outline' },
  { id: 'Conector de poder', label: 'Conector de poder', icon: 'power-outline' },
  { id: 'Placa LED', label: 'Placa LED', icon: 'grid-outline' },
  { id: 'Fuente', label: 'Fuente', icon: 'flash-outline' },
];

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  visible,
  onClose,
  qrUuid,
  eventoId,
  eventoNombre = 'Festival Estadio Nacional',
  onSuccess,
  onRequestScan,
}) => {
  const [activeQr, setActiveQr] = useState<string>(qrUuid || '');
  const [isManualInput, setIsManualInput] = useState<boolean>(!qrUuid);
  const [selectedComponent, setSelectedComponent] = useState<string>('Conector de poder');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [observations, setObservations] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Sincronizar activeQr cuando qrUuid cambia
  useEffect(() => {
    if (qrUuid) {
      setActiveQr(qrUuid);
      setIsManualInput(false);
    } else {
      setActiveQr('');
      setIsManualInput(true);
    }
  }, [qrUuid, visible]);

  const handlePickPhoto = async () => {
    triggerHaptic('light');
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        const galleryResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!galleryResult.canceled && galleryResult.assets[0]) {
          setPhotoUri(galleryResult.assets[0].uri);
        }
        return;
      }

      const cameraResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!cameraResult.canceled && cameraResult.assets[0]) {
        setPhotoUri(cameraResult.assets[0].uri);
      }
    } catch (error) {
      try {
        const fallbackResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!fallbackResult.canceled && fallbackResult.assets[0]) {
          setPhotoUri(fallbackResult.assets[0].uri);
        }
      } catch (galleryError) {
        Alert.alert('Error', 'No se pudo acceder a la cámara ni a la galería de fotos.');
      }
    }
  };

  const handleSave = () => {
    const cleanQr = activeQr.trim();
    if (!cleanQr) {
      triggerHaptic('warning');
      Alert.alert(
        'Palmeta Requerida',
        'Debes escanear o ingresar el código identificador de la palmeta. Si no se asocia, bodega no podrá rastrear el activo para su reparación.'
      );
      return;
    }

    setSaving(true);
    try {
      const effectiveEvent = eventoNombre || eventoId || 'Festival Estadio Nacional';

      insertLocalIncidencia(
        cleanQr,
        selectedComponent,
        photoUri ?? undefined,
        observations.trim() || undefined,
        effectiveEvent
      );

      triggerHaptic('success');
      setSaving(false);
      onClose();
      Alert.alert(
        'Falla Reportada con Éxito',
        `Palmeta: ${cleanQr}\nFalla: ${selectedComponent}\nEvento: ${effectiveEvent}\n\nEl reporte se guardó en la base de datos SQLite local y se sincronizará automáticamente cuando haya internet.`,
        [{ text: 'Entendido', onPress: () => onSuccess?.() }]
      );
    } catch (error) {
      triggerHaptic('warning');
      setSaving(false);
      Alert.alert('Error', 'Ocurrió un error al guardar la incidencia localmente.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainerWrapper}
        >
          <LiquidGlassView
            borderRadius={24}
            intensity={90}
            style={styles.sheetGlass}
          >
            {/* Handle Superior */}
            <View style={styles.handleBar} />

            {/* Cabecera del Bottom Sheet */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Reportar Falla</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetBody}
            >
              {/* Sección: Identificación del Activo (QR Escaneado o Manual) */}
              <View style={styles.assetHeaderRow}>
                <Text style={styles.sectionLabel}>PALMETA / CÓDIGO QR</Text>
                {onRequestScan && (
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('light');
                      onRequestScan();
                    }}
                    style={styles.rescanLink}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera-outline" size={13} color={colors.primaryAmber} style={{ marginRight: 4 }} />
                    <Text style={styles.rescanLinkText}>Escanear</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!isManualInput && activeQr ? (
                <View style={styles.assetCard}>
                  <View style={styles.assetCardLeft}>
                    <Ionicons name="qr-code" size={16} color={colors.primaryAmber} style={{ marginRight: 8 }} />
                    <Text style={styles.assetCodeText} numberOfLines={1}>{activeQr}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('light');
                      setIsManualInput(true);
                    }}
                    style={styles.editAssetBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.manualInputWrapper}>
                  <TextInput
                    style={styles.manualInput}
                    placeholder="Escribe código (ej: ALEP-P39-0045)..."
                    placeholderTextColor={colors.textMuted}
                    value={activeQr}
                    onChangeText={setActiveQr}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  {activeQr.length > 0 && (
                    <TouchableOpacity onPress={() => setActiveQr('')} style={{ padding: 6 }}>
                      <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Sección: Componente Defectuoso (Regla de 3 Taps con Haptics — Grid Original 2x2) */}
              <Text style={styles.sectionLabel}>COMPONENTE DEFECTUOSO</Text>
              <View style={styles.componentsGrid}>
                {COMPONENTS.map((item) => {
                  const isSelected = selectedComponent === item.label;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.componentButton,
                        isSelected && styles.componentButtonActive,
                      ]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setSelectedComponent(item.label);
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={styles.componentLeft}>
                        <Ionicons
                          name={item.icon}
                          size={18}
                          color={isSelected ? colors.primaryAmber : colors.textSecondary}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={[
                            styles.componentLabel,
                            isSelected && styles.componentLabelActive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </View>

                      {isSelected && (
                        <Ionicons
                          name="checkmark-sharp"
                          size={16}
                          color={colors.primaryAmber}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Sección: Evidencia Fotográfica (HU-12) */}
              <Text style={styles.sectionLabel}>EVIDENCIA FOTOGRÁFICA</Text>
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={handlePickPhoto}
                activeOpacity={0.8}
              >
                {photoUri ? (
                  <View style={styles.photoPreviewWrapper}>
                    <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />
                    <View style={styles.changePhotoBadge}>
                      <Ionicons name="camera-reverse-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.changePhotoText}>Cambiar foto</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <View style={styles.cameraIconCircle}>
                      <Ionicons name="camera-outline" size={22} color={colors.primaryAmber} />
                    </View>
                    <Text style={styles.photoPlaceholderTitle}>Tomar fotografía</Text>
                    <Text style={styles.photoPlaceholderSubtitle}>
                      Apunta directamente a la falla
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Sección: Observaciones Adicionales */}
              <Text style={styles.sectionLabel}>OBSERVACIONES ADICIONALES</Text>
              <TextInput
                style={styles.observationsInput}
                placeholder="Agrega comentarios o repuestos usados..."
                placeholderTextColor={colors.textMuted}
                value={observations}
                onChangeText={setObservations}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Botón Guardar Registro (Original) */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-sharp" size={20} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.saveButtonText}>Guardar Registro</Text>
              </TouchableOpacity>

              {/* Pie Informativo */}
              <View style={styles.footerRow}>
                <Ionicons name="cloud-offline-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={styles.footerText}>
                  Se guardará en SQLite y sincronizará automáticamente
                </Text>
              </View>
            </ScrollView>
          </LiquidGlassView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContainerWrapper: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheetGlass: {
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 16,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  sheetBody: {
    paddingHorizontal: 22,
    paddingBottom: 34,
  },
  assetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 10,
    marginTop: 6,
  },
  rescanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  rescanLinkText: {
    fontSize: 12,
    color: colors.primaryAmber,
    fontWeight: '600',
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(229, 152, 25, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  assetCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  editAssetBtn: {
    padding: 4,
  },
  manualInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  manualInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    paddingVertical: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  componentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  componentButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  componentButtonActive: {
    backgroundColor: 'rgba(229, 152, 25, 0.15)',
    borderColor: colors.primaryAmber,
  },
  componentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  componentLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  componentLabelActive: {
    color: colors.primaryAmber,
    fontWeight: '700',
  },
  photoContainer: {
    borderWidth: 1.5,
    borderColor: '#323745',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: colors.backgroundDark,
    marginBottom: 18,
    overflow: 'hidden',
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  cameraIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(229, 152, 25, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  photoPlaceholderTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  photoPlaceholderSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  photoPreviewWrapper: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  changePhotoBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  observationsInput: {
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
    minHeight: 74,
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryAmber,
    borderRadius: 14,
    height: 50,
    shadowColor: colors.primaryAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 14,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
