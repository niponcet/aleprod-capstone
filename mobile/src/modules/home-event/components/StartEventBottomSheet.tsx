import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { LiquidGlassView } from '../../../core/components/LiquidGlassView';
import { triggerHaptic } from '../../../core/utils/haptics';
import { supabase } from '../../../core/api/supabase';
import { useAuth } from '../../../core/context/AuthContext';

export interface StartEventBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (newEvent: any) => void;
}

interface RecurrentVenue {
  id: string;
  name: string;
  commune: string;
}

const RECURRENT_VENUES: RecurrentVenue[] = [
  { id: '1', name: 'Estadio Nacional', commune: 'Ñuñoa' },
  { id: '2', name: 'Movistar Arena', commune: 'Parque O\'Higgins' },
  { id: '3', name: 'Espacio Riesco', commune: 'Huechuraba' },
  { id: '4', name: 'Quinta Vergara', commune: 'Viña del Mar' },
  { id: '5', name: 'CentroParque', commune: 'Las Condes' },
  { id: '6', name: 'Club Hípico', commune: 'Santiago' },
];

const PRESET_METERS = [20, 45, 70, 100, 140];

export const StartEventBottomSheet: React.FC<StartEventBottomSheetProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [meters, setMeters] = useState('70');

  // Selección multi-servicio: Pista LED (principal) + Pirotecnia (opcional / combinable)
  const [hasPista, setHasPista] = useState(true);
  const [hasPirotecnia, setHasPirotecnia] = useState(false);

  const [saving, setSaving] = useState(false);

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

  // Filtrado reactivo de recintos frecuentes
  const filteredVenues = RECURRENT_VENUES.filter(
    (v) =>
      v.name.toLowerCase().includes(venue.toLowerCase()) ||
      v.commune.toLowerCase().includes(venue.toLowerCase())
  );

  const handleSelectVenue = (selected: RecurrentVenue) => {
    triggerHaptic('selection');
    setVenue(`${selected.name} · ${selected.commune}`);
    setShowVenueDropdown(false);
  };

  const handleAdjustMeters = (delta: number) => {
    triggerHaptic('light');
    const current = parseFloat(meters) || 0;
    const updated = Math.max(5, current + delta);
    setMeters(updated.toString());
  };

  const resetForm = () => {
    setEventName('');
    setVenue('');
    setMeters('70');
    setHasPista(true);
    setHasPirotecnia(false);
    setShowVenueDropdown(false);
  };

  const handleSaveEvent = async () => {
    const trimmedName = eventName.trim();
    const trimmedVenue = venue.trim();

    if (!trimmedName) {
      Alert.alert('Campo requerido', 'Por favor ingresa un nombre identificatorio para el evento.');
      return;
    }

    if (!trimmedVenue) {
      Alert.alert('Campo requerido', 'Por favor especifica el sitio o recinto donde se realizará el montaje.');
      return;
    }

    if (!hasPista && !hasPirotecnia) {
      Alert.alert(
        'Equipamiento requerido',
        'Debes incluir al menos un servicio técnico: Pista de Baile LED o Pirotecnia.'
      );
      return;
    }

    let parsedMeters = parseFloat(meters);
    if (hasPista && (isNaN(parsedMeters) || parsedMeters <= 0)) {
      Alert.alert('Metros inválidos', 'Ingresa una cantidad de metros cuadrados válida para la pista.');
      return;
    }

    if (!hasPista) {
      parsedMeters = 0;
    }

    // Configuración combinada según lo seleccionado por el usuario
    let configLabel = 'Pista de Baile LED';
    if (hasPista && hasPirotecnia) {
      configLabel = 'Pista de Baile LED + Pirotecnia';
    } else if (hasPirotecnia && !hasPista) {
      configLabel = 'Solo Pirotecnia';
    }

    setSaving(true);
    triggerHaptic('medium');

    try {
      const newEventPayload = {
        nombre: trimmedName,
        locacion: trimmedVenue,
        metros_cuadrados: parsedMeters,
        tipo_pantalla: configLabel,
        estado: 'en_curso', // Activo de inmediato para el turno en terreno
        fecha_inicio: new Date().toISOString(),
        tecnico_id: user?.id ?? null,
      };

      const { data, error } = await supabase
        .from('eventos')
        .insert(newEventPayload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      triggerHaptic('success');
      Alert.alert(
        'Evento Iniciado con Éxito',
        `El evento "${trimmedName}" (${configLabel}) ha sido creado en Supabase Cloud y activado para tu turno.`,
        [
          {
            text: 'Continuar',
            onPress: () => {
              resetForm();
              onClose();
              onSuccess?.(data);
            },
          },
        ]
      );
    } catch (err: any) {
      triggerHaptic('warning');
      Alert.alert(
        'Error al crear el evento',
        err?.message || 'No fue posible guardar el evento en la nube. Verifica tu conexión.'
      );
    } finally {
      setSaving(false);
    }
  };

  const approxPalmetas = Math.round((parseFloat(meters) || 0) * 4);

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
                      <MaterialCommunityIcons
                        name="party-popper"
                        size={20}
                        color="#60A5FA"
                      />
                    </View>
                    <View>
                      <Text style={styles.sheetTitle}>Iniciar Evento</Text>
                      <Text style={styles.sheetSubtitle}>
                        Alta técnica de montaje en terreno
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
              {/* Sección 1: Nombre del Evento */}
              <View style={styles.inputGroup}>
                <Text style={styles.sectionLabel}>NOMBRE DEL EVENTO *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#94A3B8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Festival Estadio Nacional 2026"
                    placeholderTextColor={colors.textMuted}
                    value={eventName}
                    onChangeText={setEventName}
                    autoCapitalize="words"
                    editable={!saving}
                  />
                </View>
              </View>

              {/* Sección 2: Sitio / Recinto con Buscador y Dropdown */}
              <View style={styles.inputGroup}>
                <View style={styles.labelWithActionRow}>
                  <Text style={styles.sectionLabel}>SITIO / RECINTO DEL MONTAJE *</Text>
                  <TouchableOpacity
                    onPress={() => setShowVenueDropdown(!showVenueDropdown)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.toggleDropdownText}>
                      {showVenueDropdown ? 'Ocultar sugerencias' : 'Ver frecuentes'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color="#94A3B8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Escribe o busca un recinto recurrente..."
                    placeholderTextColor={colors.textMuted}
                    value={venue}
                    onChangeText={(val) => {
                      setVenue(val);
                      if (!showVenueDropdown && val.length > 0) setShowVenueDropdown(true);
                    }}
                    onFocus={() => setShowVenueDropdown(true)}
                    editable={!saving}
                  />
                  {venue.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setVenue('')}
                      style={{ padding: 4 }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Dropdown flotante de Recintos Frecuentes */}
                {showVenueDropdown && (
                  <View style={styles.venueDropdownContainer}>
                    <Text style={styles.dropdownSubtitle}>
                      RECINTOS FRECUENTES ALEPROD:
                    </Text>
                    {filteredVenues.length > 0 ? (
                      filteredVenues.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectVenue(item)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="business-outline"
                            size={16}
                            color="#60A5FA"
                            style={{ marginRight: 10 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dropdownItemTitle}>{item.name}</Text>
                            <Text style={styles.dropdownItemSub}>{item.commune}</Text>
                          </View>
                          <Ionicons
                            name="arrow-forward"
                            size={14}
                            color={colors.textMuted}
                          />
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.dropdownEmpty}>
                        <Text style={styles.dropdownEmptyText}>
                          Se usará el texto escrito como recinto personalizado.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Sección 3: Equipos y Servicios (Pista LED + Pirotecnia Opcional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.sectionLabel}>SERVICIOS / EQUIPOS DEL EVENTO *</Text>
                <View style={styles.servicesGrid}>
                  {/* Opción 1: Pista de Baile LED */}
                  <TouchableOpacity
                    style={[
                      styles.serviceCard,
                      hasPista && styles.serviceCardActive,
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setHasPista(!hasPista);
                    }}
                    activeOpacity={0.8}
                    disabled={saving}
                  >
                    <View style={styles.serviceHeader}>
                      <View
                        style={[
                          styles.serviceIconBox,
                          hasPista && styles.serviceIconBoxActive,
                        ]}
                      >
                        <Ionicons
                          name="grid-outline"
                          size={18}
                          color={hasPista ? '#FFFFFF' : '#94A3B8'}
                        />
                      </View>
                      <View
                        style={[
                          styles.checkboxCircle,
                          hasPista && styles.checkboxCircleActive,
                        ]}
                      >
                        {hasPista && (
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        )}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.serviceTitle,
                        hasPista && styles.serviceTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      Pista de Baile LED
                    </Text>
                    <Text style={styles.serviceDesc} numberOfLines={1}>
                      Palmetas interactivas
                    </Text>
                  </TouchableOpacity>

                  {/* Opción 2: Pirotecnia / Efectos (Opcional / Combinable) */}
                  <TouchableOpacity
                    style={[
                      styles.serviceCard,
                      hasPirotecnia && styles.serviceCardActive,
                    ]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setHasPirotecnia(!hasPirotecnia);
                    }}
                    activeOpacity={0.8}
                    disabled={saving}
                  >
                    <View style={styles.serviceHeader}>
                      <View
                        style={[
                          styles.serviceIconBox,
                          hasPirotecnia && styles.serviceIconBoxActive,
                        ]}
                      >
                        <Ionicons
                          name="flame-outline"
                          size={18}
                          color={hasPirotecnia ? '#FFFFFF' : '#94A3B8'}
                        />
                      </View>
                      <View
                        style={[
                          styles.checkboxCircle,
                          hasPirotecnia && styles.checkboxCircleActive,
                        ]}
                      >
                        {hasPirotecnia && (
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        )}
                      </View>
                    </View>
                    <View style={styles.titleWithBadgeRow}>
                      <Text
                        style={[
                          styles.serviceTitle,
                          hasPirotecnia && styles.serviceTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        Pirotecnia
                      </Text>
                      <View style={styles.optionalBadge}>
                        <Text style={styles.optionalBadgeText}>Opcional</Text>
                      </View>
                    </View>
                    <Text style={styles.serviceDesc} numberOfLines={1}>
                      Chispas frías y efectos
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sección 4: Metros Cuadrados (Visible cuando Pista LED está activa) */}
              {hasPista && (
                <View style={styles.inputGroup}>
                  <View style={styles.labelWithActionRow}>
                    <Text style={styles.sectionLabel}>SUPERFICIE ESTIMADA (M²)</Text>
                    <Text style={styles.calcBadge}>
                      ≈ {approxPalmetas} palmetas (50×50cm)
                    </Text>
                  </View>

                  {/* Stepper Numérico */}
                  <View style={styles.metersControlRow}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => handleAdjustMeters(-5)}
                      activeOpacity={0.75}
                      disabled={saving}
                    >
                      <Ionicons name="remove" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <View style={styles.metersInputBox}>
                      <TextInput
                        style={styles.metersInput}
                        keyboardType="numeric"
                        value={meters}
                        onChangeText={setMeters}
                        editable={!saving}
                      />
                      <Text style={styles.metersUnit}>m²</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => handleAdjustMeters(5)}
                      activeOpacity={0.75}
                      disabled={saving}
                    >
                      <Ionicons name="add" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Chips de Selección Rápida de m² */}
                  <View style={styles.chipsRow}>
                    {PRESET_METERS.map((preset) => {
                      const isSelected = meters === preset.toString();
                      return (
                        <TouchableOpacity
                          key={preset}
                          style={[
                            styles.presetChip,
                            isSelected && styles.presetChipActive,
                          ]}
                          onPress={() => {
                            triggerHaptic('selection');
                            setMeters(preset.toString());
                          }}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.presetChipText,
                              isSelected && styles.presetChipTextActive,
                            ]}
                          >
                            {preset} m²
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Botón Principal de Acción de Guardado */}
              <TouchableOpacity
                onPress={handleSaveEvent}
                disabled={saving}
                activeOpacity={0.85}
                style={[styles.saveButtonWrapper, saving && styles.buttonDisabled]}
              >
                <LinearGradient
                  colors={saving ? ['#1E40AF', '#1D4ED8'] : ['#2563EB', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}
                >
                  {saving ? (
                    <View style={styles.savingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={[styles.saveButtonText, { marginLeft: 10 }]}>
                        Registrando en Supabase...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.savingRow}>
                      <MaterialCommunityIcons
                        name="party-popper"
                        size={18}
                        color="#FFFFFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.saveButtonText}>Crear e Iniciar Evento</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Pie Informativo */}
              <View style={styles.footerRow}>
                <Ionicons
                  name="cloud-done-outline"
                  size={14}
                  color={colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.footerText}>
                  Activación inmediata en Supabase Cloud
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
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  sheetBody: {
    paddingHorizontal: 22,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  labelWithActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleDropdownText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  calcBadge: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  venueDropdownContainer: {
    marginTop: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
  },
  dropdownSubtitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    paddingHorizontal: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownItemSub: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  dropdownEmpty: {
    padding: 10,
  },
  dropdownEmptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#121620',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
  },
  serviceCardActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: '#2563EB',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconBoxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
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
  titleWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  serviceTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    flex: 1,
  },
  serviceTitleActive: {
    color: '#FFFFFF',
  },
  optionalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  optionalBadgeText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  serviceDesc: {
    color: colors.textMuted,
    fontSize: 11,
  },
  metersControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepperButton: {
    width: 48,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metersInputBox: {
    flex: 1,
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F1422',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
  },
  metersInput: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 50,
  },
  metersUnit: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
    borderColor: '#2563EB',
  },
  presetChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#60A5FA',
    fontWeight: '700',
  },
  saveButtonWrapper: {
    marginTop: 6,
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
});
