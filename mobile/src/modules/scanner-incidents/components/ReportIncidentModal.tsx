import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../core/theme/colors';
import { LiquidGlassView } from '../../../core/components/LiquidGlassView';
import { triggerHaptic } from '../../../core/utils/haptics';
import { insertLocalIncidencia } from '../../../core/db/database';
import { reportIncident, fetchActiveEvents, ActiveEventOption } from '../../../core/api/incidencias';
import { useToast } from '../../../core/context/ToastContext';
import { useAuth } from '../../../core/context/AuthContext';

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
  eventoNombre,
  onSuccess,
  onRequestScan,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeQr, setActiveQr] = useState<string>(qrUuid || '');
  const [isManualInput, setIsManualInput] = useState<boolean>(!qrUuid);
  const [selectedComponent, setSelectedComponent] = useState<string>('Conector de poder');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [observations, setObservations] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Selector Dinámico de Eventos en Curso (HU-10/HU-11)
  const [activeEvents, setActiveEvents] = useState<ActiveEventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventoId || '');
  const [selectedEventNombre, setSelectedEventNombre] = useState<string>(eventoNombre || '');
  const [isEventPickerOpen, setIsEventPickerOpen] = useState<boolean>(false);

  // Consulta de eventos en curso al abrir el modal
  useEffect(() => {
    if (!visible) {
      setIsEventPickerOpen(false);
      return;
    }

    let isMounted = true;
    const loadActiveEvents = async () => {
      setLoadingEvents(true);
      try {
        const list = await fetchActiveEvents();
        if (!isMounted) return;
        setActiveEvents(list);

        if (eventoId) {
          setSelectedEventId(eventoId);
          const match = list.find((e) => e.id === eventoId);
          if (match) {
            setSelectedEventNombre(match.nombre);
          } else if (eventoNombre) {
            setSelectedEventNombre(eventoNombre);
          }
        } else if (list.length > 0) {
          // Pre-seleccionar el primer evento activo para ahorrar clics si solo hay 1
          setSelectedEventId((prev) => {
            const existing = list.find((e) => e.id === prev);
            if (existing) {
              setSelectedEventNombre(existing.nombre);
              return existing.id;
            }
            setSelectedEventNombre(list[0].nombre);
            return list[0].id;
          });
        } else {
          setSelectedEventId('');
          setSelectedEventNombre('');
        }
      } catch (err) {
        console.warn('Error cargando eventos activos:', err);
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    };

    loadActiveEvents();

    return () => {
      isMounted = false;
    };
  }, [visible, eventoId, eventoNombre]);

  // Gesto PanResponder para bajar/deslizar el modal y cerrarlo
  const panY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible, panY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.6) {
          triggerHaptic('light');
          Animated.timing(panY, {
            toValue: 700,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            panY.setValue(0);
          });
        } else {
          Animated.spring(panY, {
            toValue: 0,
            tension: 70,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

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

  const handleSave = async () => {
    const cleanQr = activeQr.trim();
    if (!cleanQr) {
      triggerHaptic('warning');
      Alert.alert(
        'Palmeta Requerida',
        'Debes escanear o ingresar el código identificador de la palmeta. Si no se asocia, bodega no podrá rastrear el activo para su reparación.'
      );
      return;
    }

    if (!selectedEventId) {
      triggerHaptic('warning');
      Alert.alert(
        'Evento Requerido',
        'Debes seleccionar un evento en curso para asociar la incidencia.'
      );
      return;
    }

    setSaving(true);
    const effectiveEvent = selectedEventNombre || selectedEventId;

    try {
      // Flujo Online-First con Offline-Fallback automático y trazabilidad de usuario
      const result = await reportIncident({
        qrUuid: cleanQr,
        tipoFalla: selectedComponent,
        fotoUri: photoUri ?? undefined,
        observaciones: observations.trim() || undefined,
        eventoId: selectedEventId,
        eventoIdOrNombre: effectiveEvent,
        usuarioId: user?.id,
      });

      setSaving(false);
      onClose();

      if (result.mode === 'cloud') {
        showToast({
          type: 'success',
          title: 'FALLA REPORTADA',
          message: 'Incidencia sincronizada en tiempo real con Supabase.',
          code: cleanQr,
        });
      } else {
        showToast({
          type: 'offline',
          title: 'GUARDADO LOCALMENTE',
          message: 'Guardado localmente. Se sincronizará cuando haya conexión.',
          code: cleanQr,
        });
      }

      onSuccess?.();
    } catch (error: any) {
      triggerHaptic('error');
      setSaving(false);
      showToast({
        type: 'error',
        title: 'ERROR AL GUARDAR',
        message: error?.message || 'Ocurrió un error al registrar la incidencia.',
        code: cleanQr,
      });
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
          <Animated.View style={[styles.animatedSheet, { transform: [{ translateY: panY }] }]}>
            <LiquidGlassView
              borderRadius={24}
              intensity={90}
              style={styles.sheetGlass}
            >
              {/* Handle Superior y Header con Gesto de Deslizamiento para Cerrar */}
              <View {...panResponder.panHandlers}>
                <View style={styles.handleBarTouchArea}>
                  <View style={styles.handleBar} />
                </View>

                {/* Cabecera del Bottom Sheet */}
                <View style={styles.sheetHeader}>
                  <View style={styles.headerTitleBox}>
                    <View style={styles.headerIconCircle}>
                      <Ionicons
                        name="build-outline"
                        size={18}
                        color="#60A5FA"
                      />
                    </View>
                    <View>
                      <Text style={styles.sheetTitle}>Reportar Falla</Text>
                      <Text style={styles.sheetSubtitle}>
                        Diagnóstico técnico de palmeta en terreno
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sheetBody}
                keyboardShouldPersistTaps="handled"
              >
                {/* Sección: Selector Obligatorio de Evento Asociado (Stateless HU-10/HU-11) */}
                <View style={styles.eventSectionHeader}>
                  <Text style={styles.sectionLabel}>EVENTO ASOCIADO *</Text>
                  {activeEvents.length > 0 && (
                    <View style={styles.eventCountBadge}>
                      <View style={styles.eventDotActive} />
                      <Text style={styles.eventCountText}>{activeEvents.length} activo{activeEvents.length > 1 ? 's' : ''}</Text>
                    </View>
                  )}
                </View>

                {loadingEvents ? (
                  <View style={styles.eventLoadingCard}>
                    <ActivityIndicator size="small" color="#60A5FA" style={{ marginRight: 10 }} />
                    <Text style={styles.eventLoadingText}>Consultando montajes en curso...</Text>
                  </View>
                ) : activeEvents.length === 0 ? (
                  <View style={styles.noEventsWarningBox}>
                    <Ionicons name="alert-circle" size={20} color="#F59E0B" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.noEventsWarningTitle}>Sin montajes en curso</Text>
                      <Text style={styles.noEventsWarningSubtitle}>
                        A la espera de que Jefatura o Coordinación inicie un evento para registrar incidencias.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.eventPickerContainer}>
                    <TouchableOpacity
                      style={[
                        styles.eventSelectorCard,
                        isEventPickerOpen && styles.eventSelectorCardOpen,
                        !selectedEventId && styles.eventSelectorCardMissing,
                      ]}
                      onPress={() => {
                        triggerHaptic('light');
                        setIsEventPickerOpen(!isEventPickerOpen);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.eventSelectorIconBox}>
                        <Ionicons name="calendar-outline" size={16} color="#60A5FA" />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.eventSelectorTitle} numberOfLines={1}>
                          {selectedEventNombre || 'Selecciona un montaje activo...'}
                        </Text>
                        <Text style={styles.eventSelectorSubtitle}>
                          {selectedEventId ? '● Montaje asignado a la falla' : 'Requerido para guardar'}
                        </Text>
                      </View>
                      <Ionicons
                        name={isEventPickerOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>

                    {/* Desplegable de Selección de Evento */}
                    {isEventPickerOpen && (
                      <View style={styles.dropdownListContainer}>
                        {activeEvents.map((ev) => {
                          const isSelected = ev.id === selectedEventId;
                          return (
                            <TouchableOpacity
                              key={ev.id}
                              style={[
                                styles.dropdownItem,
                                isSelected && styles.dropdownItemActive,
                              ]}
                              onPress={() => {
                                triggerHaptic('selection');
                                setSelectedEventId(ev.id);
                                setSelectedEventNombre(ev.nombre);
                                setIsEventPickerOpen(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.dropdownItemTitle,
                                    isSelected && styles.dropdownItemTitleActive,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {ev.nombre}
                                </Text>
                                {ev.locacion ? (
                                  <Text style={styles.dropdownItemLocation} numberOfLines={1}>
                                    📍 {ev.locacion}
                                  </Text>
                                ) : null}
                              </View>
                              {isSelected && (
                                <View style={styles.dropdownCheckCircle}>
                                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}

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
                      <Ionicons name="camera-outline" size={13} color="#60A5FA" style={{ marginRight: 4 }} />
                      <Text style={styles.rescanLinkText}>Escanear</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {!isManualInput && activeQr ? (
                  <View style={styles.assetCard}>
                    <View style={styles.assetCardLeft}>
                      <Ionicons name="qr-code" size={16} color="#60A5FA" style={{ marginRight: 8 }} />
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
                      <Ionicons name="pencil-outline" size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.manualInputWrapper}>
                    <Ionicons name="barcode-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.manualInput}
                      placeholder="Escribe código (ej: ALEP-P39-0045)..."
                      placeholderTextColor="#64748B"
                      value={activeQr}
                      onChangeText={setActiveQr}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                    {activeQr.length > 0 && (
                      <TouchableOpacity onPress={() => setActiveQr('')} style={{ padding: 6 }}>
                        <Ionicons name="close-circle" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Sección: Componente Defectuoso (Regla de 3 Taps con Haptics — Grid 2x2) */}
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
                        disabled={saving}
                      >
                        <View style={styles.componentLeft}>
                          <View
                            style={[
                              styles.componentIconBox,
                              isSelected && styles.componentIconBoxActive,
                            ]}
                          >
                            <Ionicons
                              name={item.icon}
                              size={15}
                              color={isSelected ? '#FFFFFF' : '#94A3B8'}
                            />
                          </View>
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

                        <View
                          style={[
                            styles.checkboxCircle,
                            isSelected && styles.checkboxCircleActive,
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                          )}
                        </View>
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
                  disabled={saving}
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
                        <Ionicons name="camera-outline" size={20} color="#60A5FA" />
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
                  placeholderTextColor="#64748B"
                  value={observations}
                  onChangeText={setObservations}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!saving}
                />

                {/* Botón Principal Guardar Registro */}
                {(() => {
                  const isFormInvalid = !selectedEventId || !activeQr.trim();
                  return (
                    <TouchableOpacity
                      style={[
                        styles.saveButtonWrapper,
                        (saving || isFormInvalid) && styles.buttonDisabled,
                      ]}
                      onPress={handleSave}
                      disabled={saving || isFormInvalid}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={
                          saving
                            ? ['#1E40AF', '#1D4ED8']
                            : isFormInvalid
                            ? ['#1E293B', '#1E293B']
                            : ['#2563EB', '#1D4ED8']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButtonGradient}
                      >
                        {saving ? (
                          <View style={styles.savingRow}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={[styles.saveButtonText, { marginLeft: 10 }]}>
                              Guardando en SQLite...
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.savingRow}>
                            <Ionicons
                              name={isFormInvalid ? "alert-circle-outline" : "checkmark-sharp"}
                              size={18}
                              color={isFormInvalid ? '#94A3B8' : '#FFFFFF'}
                              style={{ marginRight: 8 }}
                            />
                            <Text
                              style={[
                                styles.saveButtonText,
                                isFormInvalid && styles.saveButtonTextDisabled,
                              ]}
                            >
                              {!selectedEventId
                                ? 'Selecciona un Evento para Guardar'
                                : !activeQr.trim()
                                ? 'Ingresa o Escanea Palmeta'
                                : 'Guardar Registro'}
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })()}

                {/* Pie Informativo */}
                <View style={styles.footerRow}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={14}
                    color="#94A3B8"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.footerText}>
                    Se guardará en SQLite y sincronizará automáticamente
                  </Text>
                </View>
              </ScrollView>
            </LiquidGlassView>
          </Animated.View>
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
  animatedSheet: {
    width: '100%',
  },
  sheetGlass: {
    paddingTop: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleBarTouchArea: {
    paddingTop: 8,
    paddingBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 4,
    marginBottom: 16,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
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
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  sheetBody: {
    paddingHorizontal: 22,
    paddingBottom: 32,
  },
  assetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
    marginTop: 4,
  },
  rescanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  rescanLinkText: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '600',
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  editAssetBtn: {
    padding: 4,
  },
  manualInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1422',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  manualInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  componentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  componentButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121620',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  componentButtonActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: '#2563EB',
  },
  componentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  componentIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  componentIconBoxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1422',
  },
  checkboxCircleActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  componentLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  componentLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  photoContainer: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#0F1422',
    marginBottom: 16,
    overflow: 'hidden',
    minHeight: 116,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cameraIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  photoPlaceholderTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  photoPlaceholderSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
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
    backgroundColor: '#0F1422',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 70,
    marginBottom: 16,
  },
  saveButtonWrapper: {
    marginTop: 4,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  saveButtonTextDisabled: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  eventSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  eventCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  eventDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
    marginRight: 5,
  },
  eventCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
  },
  eventLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0F1422',
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  eventLoadingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  noEventsWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  noEventsWarningTitle: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  noEventsWarningSubtitle: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 15,
  },
  eventPickerContainer: {
    marginBottom: 14,
  },
  eventSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121620',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eventSelectorCardOpen: {
    borderColor: '#2563EB',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  eventSelectorCardMissing: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  eventSelectorIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  eventSelectorTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  eventSelectorSubtitle: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  dropdownListContainer: {
    backgroundColor: '#0B0F19',
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: '#2563EB',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
  },
  dropdownItemTitle: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownItemTitleActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dropdownItemLocation: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  dropdownCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 11,
  },
});
