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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '../../../core/utils/haptics';
import { TAB_OFFSET } from '../../../core/constants/navigation';
import { supabase } from '../../../core/api/supabase';
import { StartEventBottomSheet } from '../components/StartEventBottomSheet';
import { useAuth } from '../../../core/context/AuthContext';

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

type MainTabType = 'en_curso' | 'historial';

export const EventsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { canStartEvent, role } = useAuth();

  const [activeTab, setActiveTab] = useState<MainTabType>('en_curso');
  const [events, setEvents] = useState<EventItem[]>([]);
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
    const isEnCurso = dbEvent.estado === 'en_curso';

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

      if (data) {
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

  const handleGoToNotifications = () => {
    triggerHaptic('selection');
    router.push('/notifications');
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
          bg: 'rgba(37, 99, 235, 0.14)',
          border: 'rgba(59, 130, 246, 0.28)',
          text: '#60A5FA',
          dot: '#3B82F6',
        };
      case 'finalizado':
        return {
          bg: 'rgba(100, 116, 139, 0.14)',
          border: 'rgba(100, 116, 139, 0.25)',
          text: '#94A3B8',
          dot: '#64748B',
        };
      case 'planificado':
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.10)',
          border: 'rgba(16, 185, 129, 0.22)',
          text: '#10B981',
          dot: '#10B981',
        };
    }
  };

  const headerTopPadding =
    Platform.OS === 'web'
      ? ('calc(env(safe-area-inset-top, 0px) + 16px)' as any)
      : Math.max(insets.top, 20) + 16;

  return (
    <View style={[styles.container, { width: screenWidth, marginLeft: TAB_OFFSET }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Glow ambiental superior suave y continuo */}
      <LinearGradient
        colors={['rgba(29, 78, 216, 0.35)', 'rgba(15, 23, 42, 0.15)', 'transparent']}
        locations={[0, 0.55, 1]}
        style={styles.topAmbientGlow}
        pointerEvents="none"
      />

      {/* Header Superior Integrado con Logo Calendario y Campana sin número */}
      <View style={[styles.headerContainer, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerProfile}>
          <View style={styles.calendarIconCircle}>
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.headerOrgText}>Aleprod Terreno</Text>
            <Text style={styles.headerUserText}>Agenda de Eventos</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleGoToNotifications}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={19} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
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
              color={activeTab === 'en_curso' ? '#FFFFFF' : '#94A3B8'}
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
              color={activeTab === 'historial' ? '#FFFFFF' : '#94A3B8'}
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

        {/* Botón Iniciar Evento (Admin/Coordinador) vs Card Informativa (Técnico) — RBAC */}
        {activeTab === 'en_curso' && (
          canStartEvent ? (
            <TouchableOpacity
              style={styles.mainCtaButtonWrapper}
              onPress={handleOpenStartEvent}
              activeOpacity={0.8}
            >
              <View style={styles.mainCtaCard}>
                <View style={styles.mainCtaIconCircle}>
                  <Ionicons name="add" size={20} color="#3B82F6" />
                </View>
                <View style={styles.mainCtaContent}>
                  <Text style={styles.mainCtaTitle}>Iniciar Nuevo Evento</Text>
                  <Text style={styles.mainCtaSubtitle}>
                    Alta técnica de montaje en terreno
                  </Text>
                </View>
                <View style={styles.mainCtaArrowBox}>
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.technicianNoticeCard}>
              <View style={styles.technicianNoticeHeader}>
                <View style={styles.technicianGoldIconCircle}>
                  <Ionicons name="notifications-outline" size={18} color="#D4AF37" />
                </View>
                <View style={styles.technicianNoticeHeaderTexts}>
                  <Text style={styles.technicianNoticeTitle}>Modo Operativo en Terreno</Text>
                  <View style={styles.roleBadgeGold}>
                    <View style={styles.roleDotGold} />
                    <Text style={styles.roleBadgeTextGold}>TÉCNICO</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.technicianNoticeBody}>
                Cuando se inicie un evento te aparecerá aquí y se te notificará.
              </Text>
            </View>
          )
        )}

        {/* Indicador de Carga */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.loadingText}>Cargando eventos desde Supabase...</Text>
          </View>
        )}

        {/* Estado Vacío */}
        {!loading && displayedEvents.length === 0 && (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={activeTab === 'en_curso' ? 'flash-outline' : 'archive-outline'}
                size={28}
                color="#64748B"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'en_curso'
                ? 'No hay eventos en curso actualmente'
                : 'No hay eventos archivados en el historial'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'en_curso'
                ? canStartEvent
                  ? 'Presiona "Iniciar Nuevo Evento" para registrar un montaje activo en terreno.'
                  : 'A la espera de que Coordinación o Jefatura dé inicio a un nuevo montaje.'
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
                      { backgroundColor: badge.dot },
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
                    color="#94A3B8"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.datesText}>{event.dates}</Text>
                </View>
              </View>

              {/* Título y Chevron */}
              <View style={styles.titleRow}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              </View>

              {/* Locación */}
              <View style={styles.venueRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color="#3B82F6"
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
                            ? '#3B82F6'
                            : event.status === 'finalizado'
                            ? '#64748B'
                            : '#10B981',
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
    backgroundColor: '#080C14',
  },
  topAmbientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 18,
    zIndex: 10,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerTexts: {
    justifyContent: 'center',
  },
  headerOrgText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  headerUserText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 120,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
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
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  segmentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
    marginLeft: 6,
  },
  segmentBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  segmentBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  segmentBadgeTextActive: {
    color: '#FFFFFF',
  },
  mainCtaButtonWrapper: {
    borderRadius: 16,
    marginBottom: 16,
  },
  mainCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
  },
  mainCtaIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mainCtaContent: {
    flex: 1,
  },
  mainCtaTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  mainCtaSubtitle: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 1,
  },
  mainCtaArrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bloque Informativo Dark/Gold para rol Técnico (RBAC)
  technicianNoticeCard: {
    backgroundColor: '#121620',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  technicianNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  technicianGoldIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  technicianNoticeHeaderTexts: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  technicianNoticeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  roleBadgeGold: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleDotGold: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D4AF37',
    marginRight: 5,
  },
  roleBadgeTextGold: {
    color: '#F5C242',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  technicianNoticeBody: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    marginLeft: 10,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  eventCard: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
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
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  statusTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  datesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  datesText: {
    color: '#94A3B8',
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
    color: '#FFFFFF',
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
    color: '#94A3B8',
    fontSize: 13,
  },
  techDetailsBox: {
    backgroundColor: '#0F131D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#64748B',
    fontSize: 11,
  },
  techValue: {
    color: '#E2E8F0',
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
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  metersValue: {
    color: '#94A3B8',
    fontSize: 12,
  },
  metersBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
