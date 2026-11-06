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
  TextInput,
} from 'react-native';
import { useEdgeInsets } from '../../../core/hooks/useEdgeInsets';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '../../../core/utils/haptics';
import { supabase } from '../../../core/api/supabase';
import { StartEventBottomSheet } from '../components/StartEventBottomSheet';
import { EventCard } from '../components/EventCard';
import { EventCardSkeleton } from '../components/EventCardSkeleton';
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
  centro_id?: string | null;
  centros_eventos?: { id?: string; nombre: string } | null;
}

type MainTabType = 'en_curso' | 'historial';

export const EventsScreen: React.FC = () => {
  const { topPadding: headerTopPadding, bottomPadding: scrollBottomPadding } = useEdgeInsets(70, 12);
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { canStartEvent, role } = useAuth();

  const [activeTab, setActiveTab] = useState<MainTabType>('en_curso');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

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
      venue: dbEvent.centros_eventos?.nombre || dbEvent.locacion || 'Recinto por definir',
      dates: formatEventDate(dbEvent.fecha_inicio, dbEvent.fecha_termino),
      status,
      statusLabel,
      totalMeters: totalM,
      deployedMeters: deployedM,
      screenType: dbEvent.tipo_pantalla || 'Pista de Baile LED',
      responsible: dbEvent.tecnico_id ? 'Técnico Terreno' : 'Aleprod Producción',
      centro_id: dbEvent.centro_id || null,
      centros_eventos: dbEvent.centros_eventos || null,
    };
  };

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*, centros_eventos(nombre)')
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

  // Filtrar según la pestaña activa y buscador de historial (HU-16)
  const activeEvents = events.filter((e) => e.status === 'en_curso' || e.status === 'planificado');
  const historyEvents = events.filter((e) => e.status === 'finalizado');

  const filteredHistoryEvents = historyEvents.filter((e) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase().trim();
    return (
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.screenType.toLowerCase().includes(q) ||
      e.dates.toLowerCase().includes(q)
    );
  });

  const displayedEvents = activeTab === 'en_curso' ? activeEvents : filteredHistoryEvents;

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



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Glow ambiental superior suave y continuo */}
      <LinearGradient
        colors={['#000000', '#000000', 'rgba(29, 78, 216, 0.35)', 'rgba(37, 99, 235, 0.18)', 'transparent']}
        locations={[0, 0.22, 0.50, 0.78, 1]}
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
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
          paddingBottom:
            Platform.OS === 'web'
              ? (scrollBottomPadding as any)
              : (scrollBottomPadding as any),
        },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          ) : undefined
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

        {/* Barra de Búsqueda y Filtro de Historial (HU-16) */}
        {activeTab === 'historial' && (
          <View style={styles.historySearchWrapper}>
            <View style={styles.historySearchBar}>
              <Ionicons name="search-outline" size={17} color="#60A5FA" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.historySearchInput}
                placeholder="Buscar por evento, recinto o formato..."
                placeholderTextColor="#64748B"
                value={historySearchQuery}
                onChangeText={setHistorySearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {historySearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic('light');
                    setHistorySearchQuery('');
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {historySearchQuery.trim().length > 0 && (
              <View style={styles.historySearchFeedbackRow}>
                <Text style={styles.historySearchFeedbackText}>
                  {filteredHistoryEvents.length} {filteredHistoryEvents.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                </Text>
                {filteredHistoryEvents.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('light');
                      setHistorySearchQuery('');
                    }}
                  >
                    <Text style={styles.historySearchClearLink}>Limpiar</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

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

        {/* Skeletons de Carga (3 repeticiones fluidas con pulso) */}
        {loading && !refreshing && (
          <View style={styles.skeletonContainer}>
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </View>
        )}

        {/* Estado Vacío */}
        {!loading && displayedEvents.length === 0 && (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={
                  activeTab === 'en_curso'
                    ? 'flash-outline'
                    : historySearchQuery.trim().length > 0
                    ? 'search-outline'
                    : 'archive-outline'
                }
                size={28}
                color="#60A5FA"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'en_curso'
                ? 'No hay eventos en curso actualmente'
                : historySearchQuery.trim().length > 0
                ? 'Sin resultados en el historial'
                : 'No hay eventos archivados en el historial'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'en_curso'
                ? canStartEvent
                  ? 'Presiona "Iniciar Nuevo Evento" para registrar un montaje activo en terreno.'
                  : 'A la espera de que Coordinación o Jefatura dé inicio a un nuevo montaje.'
                : historySearchQuery.trim().length > 0
                ? `No encontramos eventos finalizados que coincidan con "${historySearchQuery}".`
                : 'Los eventos finalizados se almacenarán aquí con su trazabilidad en modo solo lectura.'}
            </Text>
            {activeTab === 'historial' && historySearchQuery.trim().length > 0 && (
              <TouchableOpacity
                style={styles.emptyResetSearchButton}
                onPress={() => {
                  triggerHaptic('light');
                  setHistorySearchQuery('');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyResetSearchButtonText}>Limpiar filtro de búsqueda</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Listado de Tarjetas de Eventos */}
        {!loading &&
          displayedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => handleSelectEvent(event)}
            />
          ))}
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
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  topAmbientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    ...Platform.select({
      web: {
        zIndex: -1,
        transform: [{ translateZ: 0 } as any],
      },
      default: {
        zIndex: 0,
      },
    }),
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
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
  skeletonContainer: {
    marginTop: 4,
    marginBottom: 8,
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
  historySearchWrapper: {
    marginBottom: 14,
  },
  historySearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  historySearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    padding: 0,
  },
  historySearchFeedbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  historySearchFeedbackText: {
    color: '#60A5FA',
    fontSize: 11.5,
    fontWeight: '600',
  },
  historySearchClearLink: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
  },
  emptyResetSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 14,
  },
  emptyResetSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
