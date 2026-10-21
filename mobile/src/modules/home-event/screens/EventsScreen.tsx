import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { LiquidGlassView } from '../../../core/components/LiquidGlassView';
import { triggerHaptic } from '../../../core/utils/haptics';
import { TAB_OFFSET } from '../../../core/constants/navigation';
import { supabase } from '../../../core/api/supabase';
import { StartEventBottomSheet } from '../components/StartEventBottomSheet';

export interface EventItem {
  id: string;
  title: string;
  venue: string;
  dates: string;
  status: 'en_curso' | 'finalizado' | 'planificado';
  statusLabel: string;
  totalMeters: number;
  deployedMeters: number;
  screenType: string;
  responsible: string;
}

const FALLBACK_EVENTS: EventItem[] = [
  {
    id: 'ev-1',
    title: 'Festival Estadio Nacional',
    venue: 'Estadio Nacional · Ñuñoa',
    dates: '21 - 24 Octubre 2026',
    status: 'en_curso',
    statusLabel: 'MONTAJE EN CURSO',
    totalMeters: 140,
    deployedMeters: 70,
    screenType: 'Pista de Baile LED + Pirotecnia',
    responsible: 'Técnico Terreno',
  },
  {
    id: 'ev-2',
    title: 'Concierto Movistar Arena',
    venue: 'Parque O\'Higgins · Santiago',
    dates: '25 - 27 Octubre 2026',
    status: 'en_curso',
    statusLabel: 'MONTAJE EN CURSO',
    totalMeters: 80,
    deployedMeters: 0,
    screenType: 'Pista de Baile LED',
    responsible: 'Equipo Terreno 2',
  },
  {
    id: 'ev-3',
    title: 'Gala Anual Corporativa',
    venue: 'Espacio Riesco · Huechuraba',
    dates: '10 - 12 Octubre 2026',
    status: 'finalizado',
    statusLabel: 'FINALIZADO',
    totalMeters: 45,
    deployedMeters: 45,
    screenType: 'Solo Pirotecnia',
    responsible: 'Logística Central',
  },
];

type MainTabType = 'en_curso' | 'historial';

export const EventsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<MainTabType>('en_curso');
  const [events, setEvents] = useState<EventItem[]>(FALLBACK_EVENTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState<boolean>(false);

  const formatEventDate = (startDateStr: string, endDateStr?: string | null): string => {
    try {
      const start = new Date(startDateStr);
      const day = start.getDate();
      const monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      const month = monthNames[start.getMonth()];
      const year = start.getFullYear();

      if (endDateStr) {
        const end = new Date(endDateStr);
        const endDay = end.getDate();
        const endMonth = monthNames[end.getMonth()];
        if (month === endMonth) {
          return `${day} - ${endDay} ${month} ${year}`;
        }
        return `${day} ${month} - ${endDay} ${endMonth} ${year}`;
      }
      return `${day} ${month} ${year}`;
    } catch {
      return 'Fecha por confirmar';
    }
  };

  const mapDbEventToItem = (dbEvent: any): EventItem => {
    const isFinalizado = dbEvent.estado === 'finalizado';
    const isEnCurso = dbEvent.estado === 'en_curso' || (!isFinalizado && dbEvent.estado !== 'planificado');

    const status: EventItem['status'] = isFinalizado
      ? 'finalizado'
      : isEnCurso
      ? 'en_curso'
      : 'planificado';

    const statusLabel = isFinalizado
      ? 'FINALIZADO'
      : isEnCurso
      ? 'MONTAJE EN CURSO'
      : 'PLANIFICADO';

    const totalM = Number(dbEvent.metros_cuadrados) || 70;
    const deployedM = isFinalizado ? totalM : isEnCurso ? Math.round(totalM * 0.5) : 0;

    return {
      id: dbEvent.id,
      title: dbEvent.nombre,
      venue: dbEvent.locacion || 'Recinto por definir',
      dates: formatEventDate(dbEvent.fecha_inicio, dbEvent.fecha_termino),
      status,
      statusLabel,
      totalMeters: totalM,
      deployedMeters: deployedM,
      screenType: dbEvent.tipo_pantalla || 'Pista de Baile LED',
      responsible: dbEvent.tecnico_id ? 'Técnico Terreno' : 'Aleprod Producción',
    };
  };

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('fecha_inicio', { ascending: false });

      if (error) {
        console.warn('Error al cargar eventos remotos de Supabase:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const remoteMapped = data.map(mapDbEventToItem);
        setEvents(remoteMapped);
      }
    } catch (err) {
      console.warn('Excepción al consultar eventos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recargar cada vez que la pantalla entra en foco (por ejemplo al volver de EventDetailScreen)
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [fetchEvents])
  );

  const onRefresh = () => {
    triggerHaptic('light');
    setRefreshing(true);
    fetchEvents();
  };

  const handleOpenStartEvent = () => {
    triggerHaptic('medium');
    setIsBottomSheetVisible(true);
  };

  const handleEventCreated = (_newEvent: any) => {
    fetchEvents();
    setActiveTab('en_curso');
  };

  // Filtrar según la pestaña activa (HU-16)
  const activeEvents = events.filter((e) => e.status === 'en_curso' || e.status === 'planificado');
  const historyEvents = events.filter((e) => e.status === 'finalizado');

  const displayedEvents = activeTab === 'en_curso' ? activeEvents : historyEvents;

  const handleSelectEvent = (event: EventItem) => {
    triggerHaptic('selection');
    router.push({
      pathname: '/event-detail',
      params: {
        id: event.id,
        title: event.title,
        venue: event.venue,
        dates: event.dates,
        status: event.status,
        totalMeters: String(event.totalMeters),
        screenType: event.screenType,
        responsible: event.responsible,
      },
    });
  };

  const getStatusBadgeStyle = (status: EventItem['status']) => {
    switch (status) {
      case 'en_curso':
        return {
          bg: 'rgba(234, 179, 8, 0.14)',
          border: 'rgba(234, 179, 8, 0.35)',
          text: colors.primaryLight,
        };
      case 'finalizado':
        return {
          bg: 'rgba(113, 113, 122, 0.16)',
          border: 'rgba(113, 113, 122, 0.35)',
          text: colors.textSecondary,
        };
      case 'planificado':
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.14)',
          border: 'rgba(16, 185, 129, 0.35)',
          text: colors.success,
        };
    }
  };

  return (
    <View style={[styles.container, { width: screenWidth, marginLeft: TAB_OFFSET }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header Superior Fijo Limpio */}
      <View style={[styles.fixedHeaderContainer, { top: insets.top + 8 }]}>
        <LiquidGlassView borderRadius={18} intensity={85} style={styles.headerCard}>
          <View style={styles.headerInfo}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={18} color={colors.primaryAmber} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Agenda de Eventos</Text>
              <Text style={styles.headerSubtitle}>Montajes y logística técnica</Text>
            </View>
          </View>

          {/* Badge Contador Total */}
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{events.length}</Text>
          </View>
        </LiquidGlassView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 86 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryAmber}
            colors={[colors.primaryAmber]}
          />
        }
      >
        {/* Pestañas Principales HU-16: "En Curso" vs "Historial" */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'en_curso' && styles.segmentButtonActive,
            ]}
            onPress={() => {
              triggerHaptic('selection');
              setActiveTab('en_curso');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flash"
              size={14}
              color={activeTab === 'en_curso' ? colors.textInverse : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === 'en_curso' && styles.segmentTextActive,
              ]}
            >
              En Curso
            </Text>
            <View
              style={[
                styles.segmentBadge,
                activeTab === 'en_curso' && styles.segmentBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentBadgeText,
                  activeTab === 'en_curso' && styles.segmentBadgeTextActive,
                ]}
              >
                {activeEvents.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'historial' && styles.segmentButtonActive,
            ]}
            onPress={() => {
              triggerHaptic('selection');
              setActiveTab('historial');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="archive-outline"
              size={14}
              color={activeTab === 'historial' ? colors.textInverse : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === 'historial' && styles.segmentTextActive,
              ]}
            >
              Historial
            </Text>
            <View
              style={[
                styles.segmentBadge,
                activeTab === 'historial' && styles.segmentBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentBadgeText,
                  activeTab === 'historial' && styles.segmentBadgeTextActive,
                ]}
              >
                {historyEvents.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Botón Iniciar Evento: Solo visible en la pestaña "En Curso" */}
        {activeTab === 'en_curso' && (
          <TouchableOpacity
            style={styles.mainCtaButtonWrapper}
            onPress={handleOpenStartEvent}
            activeOpacity={0.78}
          >
            <View style={styles.mainCtaCard}>
              <View style={styles.mainCtaIconCircle}>
                <Ionicons name="add" size={20} color={colors.primaryAmber} />
              </View>
              <View style={styles.mainCtaContent}>
                <Text style={styles.mainCtaTitle}>Iniciar Nuevo Evento</Text>
                <Text style={styles.mainCtaSubtitle}>
                  Alta técnica de montaje en terreno
                </Text>
              </View>
              <View style={styles.mainCtaArrowBox}>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Indicador de Carga */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primaryAmber} />
            <Text style={styles.loadingText}>Cargando eventos desde Supabase...</Text>
          </View>
        )}

        {/* Estado Vacío */}
        {!loading && displayedEvents.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons
              name={activeTab === 'en_curso' ? 'flash-outline' : 'archive-outline'}
              size={44}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'en_curso'
                ? 'No hay eventos en curso actualmente'
                : 'No hay eventos archivados en el historial'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'en_curso'
                ? 'Presiona "Iniciar Nuevo Evento" para registrar un montaje activo en terreno.'
                : 'Los eventos finalizados se almacenarán aquí con su trazabilidad en modo solo lectura.'}
            </Text>
          </View>
        )}

        {/* Listado de Tarjetas de Eventos */}
        {displayedEvents.map((event) => {
          const badge = getStatusBadgeStyle(event.status);
          const progressPercent =
            event.totalMeters > 0
              ? Math.min(100, Math.round((event.deployedMeters / event.totalMeters) * 100))
              : 0;

          return (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => handleSelectEvent(event)}
              activeOpacity={0.82}
            >
              {/* Fila Superior con Tag y Fecha */}
              <View style={styles.cardHeaderRow}>
                <View
                  style={[
                    styles.statusTag,
                    { backgroundColor: badge.bg, borderColor: badge.border },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: badge.text },
                    ]}
                  />
                  <Text style={[styles.statusTagText, { color: badge.text }]}>
                    {event.statusLabel}
                  </Text>
                </View>

                <View style={styles.datesPill}>
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={colors.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.datesText}>{event.dates}</Text>
                </View>
              </View>

              {/* Título y Locación */}
              <View style={styles.titleRow}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>

              <View style={styles.venueRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.primaryAmber}
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.venueText}>{event.venue}</Text>
              </View>

              {/* Ficha Técnica */}
              <View style={styles.techDetailsBox}>
                <View style={styles.techRow}>
                  <Text style={styles.techLabel}>Configuración / Equipo:</Text>
                  <Text style={styles.techValue}>{event.screenType}</Text>
                </View>
                <View style={styles.techRow}>
                  <Text style={styles.techLabel}>Responsable:</Text>
                  <Text style={styles.techValue}>{event.responsible}</Text>
                </View>
              </View>

              {/* Métrica de Despliegue en m² */}
              <View style={styles.metersBlock}>
                <View style={styles.metersHeader}>
                  <Text style={styles.metersTitle}>Superficie Requerida</Text>
                  <Text style={styles.metersValue}>
                    <Text style={styles.metersBold}>{event.deployedMeters}</Text> / {event.totalMeters} m²
                  </Text>
                </View>

                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progressPercent}%`,
                        backgroundColor:
                          event.status === 'en_curso'
                            ? colors.primaryAmber
                            : event.status === 'finalizado'
                            ? colors.textMuted
                            : colors.success,
                      },
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Componente Bottom Sheet para Iniciar Evento */}
      <StartEventBottomSheet
        visible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
        onSuccess={handleEventCreated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fixedHeaderContainer: {
    position: 'absolute',
    left: 18,
    right: 18,
    zIndex: 20,
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.primaryAmber,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: colors.primaryLight,
    fontWeight: '800',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 130,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: colors.primaryAmber,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors.textInverse,
  },
  segmentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  segmentBadgeActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  segmentBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  segmentBadgeTextActive: {
    color: colors.textInverse,
  },
  mainCtaButtonWrapper: {
    borderRadius: 14,
    marginBottom: 14,
  },
  mainCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  mainCtaIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(229, 152, 25, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 152, 25, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mainCtaContent: {
    flex: 1,
  },
  mainCtaTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  mainCtaSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  mainCtaArrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 10,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  datesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  datesText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginRight: 6,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  venueText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  techDetailsBox: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  techLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  techValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  metersBlock: {
    marginTop: 2,
  },
  metersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metersTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  metersValue: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  metersBold: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
