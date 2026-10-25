import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getActiveLocalEvento,
  upsertLocalEvento,
  updateLocalEventoEstado,
  LocalEvento,
  getTotalPendingSyncCount,
  clearAllLocalActiveEvents,
} from '../../../core/db/database';
import { supabase } from '../../../core/api/supabase';
import {
  fetchInventoryMetrics,
  formatM2,
  InventoryMetrics,
  getEmptyInventoryMetrics,
} from '../../../core/api/palmetas';
import {
  fetchHybridIncidents,
  UnifiedIncident,
} from '../../../core/api/incidencias';
import { triggerHaptic } from '../../../core/utils/haptics';
import { TAB_OFFSET } from '../../../core/constants/navigation';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [activeEvent, setActiveEvent] = useState<LocalEvento | null>(null);
  const [loadingEvent, setLoadingEvent] = useState<boolean>(true);
  const [equipmentMetrics, setEquipmentMetrics] = useState<InventoryMetrics>(getEmptyInventoryMetrics());
  const [recentIncidents, setRecentIncidents] = useState<UnifiedIncident[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Consulta híbrida: Supabase Cloud para datos frescos + SQLite local para offline
  const fetchActiveEvent = useCallback(async () => {
    try {
      // 1. Cargar inmediatamente desde cache SQLite local para cero retraso visual
      const localActive = getActiveLocalEvento();
      if (localActive) {
        setActiveEvent(localActive);
      }

      // 2. Consultar en Supabase para obtener el estado real en tiempo real
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('estado', 'en_curso')
        .order('fecha_inicio', { ascending: false })
        .limit(1);

      if (!error) {
        if (data && data.length > 0) {
          const remoteEvent: LocalEvento = {
            id: data[0].id,
            nombre: data[0].nombre,
            locacion: data[0].locacion || 'Recinto no especificado',
            fecha_inicio: data[0].fecha_inicio,
            fecha_termino: data[0].fecha_termino,
            estado: 'en_curso',
            metros_cuadrados: Number(data[0].metros_cuadrados) || 0,
            tipo_pantalla: data[0].tipo_pantalla || 'Pista de Baile LED',
            tecnico_id: data[0].tecnico_id,
          };
          setActiveEvent(remoteEvent);
          upsertLocalEvento(remoteEvent);
        } else {
          // No hay ningún evento 'en_curso' (están planificados sin iniciar o finalizados)
          setActiveEvent(null);
          clearAllLocalActiveEvents();
        }
      } else if (!localActive) {
        setActiveEvent(null);
      }
    } catch (err) {
      console.warn('Error consultando evento activo en HomeScreen:', err);
    } finally {
      setLoadingEvent(false);
    }
  }, []);

  // Consulta de métricas de inventario y actividad reciente híbrida (Supabase + SQLite)
  const loadDynamicData = useCallback(async () => {
    try {
      const [metrics, incidents] = await Promise.all([
        fetchInventoryMetrics(),
        fetchHybridIncidents({ limit: 3 }),
      ]);
      setEquipmentMetrics(metrics);
      setRecentIncidents(incidents);
    } catch (err) {
      console.warn('Error cargando métricas o incidencias dinámicas en HomeScreen:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Recargar datos dinámicos y evento activo cada vez que la pantalla entra en foco
  useFocusEffect(
    useCallback(() => {
      fetchActiveEvent();
      loadDynamicData();
      try {
        setPendingSyncCount(getTotalPendingSyncCount());
      } catch {
        setPendingSyncCount(0);
      }
    }, [fetchActiveEvent, loadDynamicData])
  );

  const onRefresh = useCallback(() => {
    triggerHaptic('medium');
    setRefreshing(true);
    fetchActiveEvent();
    loadDynamicData();
    try {
      setPendingSyncCount(getTotalPendingSyncCount());
    } catch {
      setPendingSyncCount(0);
    }
  }, [fetchActiveEvent, loadDynamicData]);

  const handleGoToHistory = () => {
    triggerHaptic('selection');
    router.push('/activity-history');
  };

  const handleActiveEventPress = () => {
    if (!activeEvent) return;
    triggerHaptic('selection');
    router.push({
      pathname: '/event-detail',
      params: {
        id: activeEvent.id,
        title: activeEvent.nombre,
        venue: activeEvent.locacion,
        status: activeEvent.estado,
        totalMeters: String(activeEvent.metros_cuadrados || 0),
        screenType: activeEvent.tipo_pantalla || 'Pista de Baile LED',
      },
    });
  };

  const handleGoToEvents = () => {
    triggerHaptic('light');
    router.push('/(tabs)/eventos');
  };

  const handlePalmetaPress = (uuid: string, title: string, status: string) => {
    router.push({
      pathname: '/asset-detail',
      params: {
        uuid,
        title,
        status,
      },
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMin = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      if (diffMin < 60) return `Hace ${diffMin} min`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      return `Hace ${Math.floor(diffHours / 24)} d`;
    } catch {
      return 'Reciente';
    }
  };

  return (
    <View style={[styles.container, { width: screenWidth, marginLeft: TAB_OFFSET }]}>
      <StatusBar barStyle="light-content" />

      {/* Glow ambiental superior suave y continuo */}
      <LinearGradient
        colors={['rgba(29, 78, 216, 0.35)', 'rgba(15, 23, 42, 0.15)', 'transparent']}
        locations={[0, 0.55, 1]}
        style={styles.topAmbientGlow}
        pointerEvents="none"
      />

      {/* Header Superior Integrado */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerProfile}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>AP</Text>
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.headerOrgText}>Aleprod Terreno</Text>
            <Text style={styles.headerUserText}>Hola, Técnico</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              triggerHaptic('light');
              onRefresh();
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={pendingSyncCount > 0 ? 'cloud-upload-outline' : 'cloud-done-outline'}
              size={20}
              color={pendingSyncCount > 0 ? '#F59E0B' : '#10B981'}
            />
            <View
              style={[
                styles.cloudBadgeDot,
                { backgroundColor: pendingSyncCount > 0 ? '#F59E0B' : '#10B981' },
              ]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              triggerHaptic('selection');
              router.push('/notifications');
            }}
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
        {/* Card: Montaje Activo Dinámico (HU-10) */}
        {activeEvent ? (
          <TouchableOpacity
            style={styles.activeMountCard}
            onPress={handleActiveEventPress}
            activeOpacity={0.85}
          >
            <View style={styles.activeMountTopRow}>
              <View style={styles.activeTag}>
                <View style={styles.activeDot} />
                <Text style={styles.activeTagText}>MONTAJE ACTIVO</Text>
              </View>
              {activeEvent.locacion ? (
                <View style={styles.locationPill}>
                  <Ionicons name="location-outline" size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                  <Text style={styles.locationPillText} numberOfLines={1} ellipsizeMode="tail">
                    {activeEvent.locacion}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.eventTitle}>{activeEvent.nombre}</Text>
            {activeEvent.tipo_pantalla ? (
              <Text style={styles.eventSubtitle}>{activeEvent.tipo_pantalla}</Text>
            ) : null}

            <View style={styles.cardDivider} />

            <View style={styles.activeMountBottomRow}>
              <View style={styles.metersInfoBlock}>
                <Text style={styles.metersLabel}>Superficie asignada</Text>
                <Text style={styles.metersValue}>
                  <Text style={styles.metersValueBold}>
                    {activeEvent.metros_cuadrados || 0} m²
                  </Text>
                  {activeEvent.metros_cuadrados
                    ? ` (≈ ${Math.round(activeEvent.metros_cuadrados * 4)} palmetas)`
                    : ''}
                </Text>
              </View>

              <View style={styles.viewDetailLink}>
                <Text style={styles.viewDetailText}>Ver detalle</Text>
                <Ionicons name="chevron-forward" size={13} color="#60A5FA" />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.noActiveMountCard}
            onPress={handleGoToEvents}
            activeOpacity={0.8}
          >
            <View style={styles.noActiveTopRow}>
              <View style={styles.noActiveIconBox}>
                <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noActiveTitle}>Sin Montaje Activo</Text>
                <Text style={styles.noActiveSubtitle}>
                  No hay eventos en curso actualmente en terreno.
                </Text>
              </View>
              <View style={styles.noActiveBadge}>
                <Text style={styles.noActiveBadgeText}>Agenda</Text>
                <Ionicons name="chevron-forward" size={12} color="#60A5FA" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Sección: Estado de Equipos (Métricas Dinámicas HU-07 / HU-10) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Estado de equipos</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>
                {formatM2(equipmentMetrics.totalM2)} total
              </Text>
            </View>
          </View>

          {/* Card Principal — Operativos Disponibles */}
          <View style={styles.mainStatusCard}>
            <View style={styles.statusCardHeader}>
              <View style={styles.statusIconAndName}>
                <View style={styles.checkIconBox}>
                  <Ionicons name="checkmark" size={18} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.statusCategoryLabel}>Operativos disponibles</Text>
                  <Text style={styles.statusMainValue}>{formatM2(equipmentMetrics.operativoM2)}</Text>
                </View>
              </View>

              <View style={styles.statusRightBadgeGroup}>
                <View style={styles.palmetasCountBadge}>
                  <View style={styles.statusDotGreen} />
                  <Text style={styles.palmetasCountText}>
                    {equipmentMetrics.operativoCount}{' '}
                    {equipmentMetrics.operativoCount === 1 ? 'palmeta' : 'palmetas'}
                  </Text>
                </View>
                <Text style={styles.statusPercentageText}>
                  {equipmentMetrics.operativoPercentage.toFixed(1)}% disponible
                </Text>
              </View>
            </View>

            {/* Barra de progreso horizontal */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFillGreen,
                  { width: `${Math.min(100, Math.max(0, equipmentMetrics.operativoPercentage))}%` },
                ]}
              />
            </View>
          </View>

          {/* Grid de 2 Cards: En Mantención y Dados de Baja */}
          <View style={styles.gridRow}>
            {/* Card Izquierda: En Mantención */}
            <View style={styles.gridCard}>
              <View style={styles.gridCardHeader}>
                <View style={styles.gridIconBoxAmber}>
                  <Ionicons name="build-outline" size={14} color="#F59E0B" />
                </View>
                <View style={styles.revisionBadge}>
                  <View style={styles.statusDotAmber} />
                  <Text style={styles.revisionBadgeText}>Revisión</Text>
                </View>
              </View>

              <Text style={styles.gridCardLabel}>En mantención</Text>
              <Text style={styles.gridCardValue}>{formatM2(equipmentMetrics.mantencionM2)}</Text>

              <View style={styles.gridCardFooter}>
                <Ionicons name="warning-outline" size={12} color="#F59E0B" style={{ marginRight: 5 }} />
                <Text style={styles.gridFooterNeutral}>
                  {equipmentMetrics.mantencionCount}{' '}
                  {equipmentMetrics.mantencionCount === 1 ? 'palmeta' : 'palmetas'}
                </Text>
              </View>
            </View>

            {/* Card Derecha: Dados de Baja */}
            <View style={styles.gridCard}>
              <View style={styles.gridCardHeader}>
                <View style={styles.gridIconBoxRed}>
                  <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                </View>
                <View style={styles.bajaBadge}>
                  <View style={styles.statusDotRed} />
                  <Text style={styles.bajaBadgeText}>Baja</Text>
                </View>
              </View>

              <Text style={styles.gridCardLabel}>Dados de baja</Text>
              <Text style={styles.gridCardValue}>{formatM2(equipmentMetrics.bajaM2)}</Text>

              <View style={styles.gridCardFooter}>
                <Ionicons name="close-circle-outline" size={12} color="#EF4444" style={{ marginRight: 5 }} />
                <Text style={styles.gridFooterNeutral}>
                  {equipmentMetrics.bajaCount}{' '}
                  {equipmentMetrics.bajaCount === 1 ? 'palmeta' : 'palmetas'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sección: Actividad Reciente Real */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividad reciente</Text>
            <TouchableOpacity
              onPress={handleGoToHistory}
              activeOpacity={0.7}
              style={styles.historyButtonBadge}
            >
              <Ionicons name="time-outline" size={13} color="#60A5FA" style={{ marginRight: 4 }} />
              <Text style={styles.historyButtonText}>Ver historial</Text>
              <Ionicons name="chevron-forward" size={12} color="#60A5FA" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>

          {/* Lista de las últimas 3 incidencias reales (Supabase + SQLite) */}
          {recentIncidents.length > 0 ? (
            recentIncidents.map((item) => {
              const shortCode =
                item.codigo_visible ||
                (item.qr_uuid.length > 8 ? item.qr_uuid.slice(-4).toUpperCase() : item.qr_uuid);

              const isBaja =
                item.tipo_falla.toLowerCase().includes('baja') ||
                item.tipo_falla.toLowerCase().includes('crítica');
              const isMant =
                item.tipo_falla.toLowerCase().includes('manten') ||
                item.tipo_falla.toLowerCase().includes('apagado') ||
                item.tipo_falla.toLowerCase().includes('dañado') ||
                item.tipo_falla.toLowerCase().includes('fuente') ||
                item.tipo_falla.toLowerCase().includes('falla');

              const iconName: keyof typeof Ionicons.glyphMap = isBaja
                ? 'close-circle-outline'
                : isMant
                  ? 'warning-outline'
                  : 'checkmark-circle-outline';

              const iconColor = isBaja ? '#EF4444' : isMant ? '#F59E0B' : '#10B981';
              const iconBg = isBaja
                ? 'rgba(239, 68, 68, 0.10)'
                : isMant
                  ? 'rgba(245, 158, 11, 0.10)'
                  : 'rgba(16, 185, 129, 0.10)';

              const statusText = isBaja
                ? '• Dado de Baja'
                : isMant
                  ? '• En Mantención'
                  : '• Operativo';

              const shortCategoryLabel = isBaja
                ? 'Dada de baja'
                : isMant
                  ? 'En mantención'
                  : 'Operativa OK';

              return (
                <TouchableOpacity
                  key={`recent-${item.id}`}
                  style={styles.activityCard}
                  onPress={() =>
                    handlePalmetaPress(
                      item.qr_uuid,
                      `Palmeta #${shortCode}`,
                      statusText
                    )
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.activityIconCircle}>
                    <Ionicons name={iconName} size={18} color={iconColor} />
                  </View>

                  <View style={styles.activityDetails}>
                    <View style={styles.activityTitleRow}>
                      <Text style={styles.activityTitle}>Palmeta #{shortCode}</Text>
                      <Text style={styles.activityTime}>{formatTimeAgo(item.fecha)}</Text>
                    </View>
                    <View style={styles.activitySubtitleRow}>
                      <View style={[styles.microStatusDot, { backgroundColor: iconColor }]} />
                      <Text style={styles.activitySubtitleText} numberOfLines={1}>
                        {shortCategoryLabel} · {item.tipo_falla}
                      </Text>
                    </View>
                    <View style={styles.activityEventRow}>
                      <View style={styles.activityEventPill}>
                        <Ionicons name="location-outline" size={10} color="#94A3B8" style={{ marginRight: 3 }} />
                        <Text style={styles.activityEventText} numberOfLines={1}>
                          {item.evento_nombre || 'Evento en terreno'}
                        </Text>
                      </View>
                      <View style={styles.activitySyncPill}>
                        <View style={[styles.syncDot, { backgroundColor: item.sincronizado ? '#10B981' : '#F59E0B' }]} />
                        <Text style={styles.activitySyncText}>
                          {item.sincronizado ? 'Cloud' : 'Local'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyActivityCard}>
              <View style={styles.emptyActivityIconBox}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#10B981" />
              </View>
              <Text style={styles.emptyActivityTitle}>Sin incidencias recientes</Text>
              <Text style={styles.emptyActivitySubtitle}>
                Todos los equipos registrados se encuentran operativos.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  avatarCircle: {
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
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
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
    gap: 10,
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
  cloudBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 120,
  },
  activeMountCard: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  activeMountTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.28)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    flexShrink: 0,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    marginRight: 4,
  },
  activeTagText: {
    color: '#60A5FA',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    flexShrink: 1,
    maxWidth: '52%',
  },
  locationPillText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '500',
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  eventSubtitle: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  activeMountBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metersInfoBlock: {
    flex: 1,
  },
  metersLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  metersValue: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  metersValueBold: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  viewDetailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  viewDetailText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  noActiveMountCard: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  noActiveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noActiveIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noActiveTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  noActiveSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  noActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 8,
  },
  noActiveBadgeText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 2,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  totalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  totalBadgeText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  mainStatusCard: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusIconAndName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusDotAmber: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
    marginRight: 5,
  },
  statusDotRed: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
    marginRight: 5,
  },
  statusCategoryLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  statusMainValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  statusRightBadgeGroup: {
    alignItems: 'flex-end',
  },
  palmetasCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    marginBottom: 3,
  },
  palmetasCountText: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '600',
  },
  statusPercentageText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressBarFillGreen: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 12,
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridIconBoxAmber: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconBoxRed: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  revisionBadgeText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
  },
  bajaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  bajaBadgeText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
  },
  gridCardLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  gridCardValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 6,
  },
  gridCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridFooterNeutral: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '500',
  },
  historyButtonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
  },
  historyButtonText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  activityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  activityTime: {
    color: '#94A3B8',
    fontSize: 11,
  },
  activitySubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  microStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  activitySubtitleText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  activityEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 6,
  },
  activityEventPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 160,
  },
  activityEventText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
  },
  activitySyncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  syncDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  activitySyncText: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '600',
  },
  emptyActivityCard: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyActivityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyActivityTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  emptyActivitySubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
});

