import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { LiquidGlassView } from '../../../core/components/LiquidGlassView';
import { triggerHaptic } from '../../../core/utils/haptics';
import { TAB_OFFSET } from '../../../core/constants/navigation';

interface EventItem {
  id: string;
  title: string;
  venue: string;
  dates: string;
  status: 'active' | 'upcoming' | 'planned';
  statusLabel: string;
  totalMeters: number;
  deployedMeters: number;
  screenType: string;
  responsible: string;
}

const EVENTS_DATA: EventItem[] = [
  {
    id: 'ev-1',
    title: 'Festival Estadio Nacional',
    venue: 'Estadio Nacional · Escenario A',
    dates: '14 - 16 Octubre 2026',
    status: 'active',
    statusLabel: 'MONTAJE EN CURSO',
    totalMeters: 140,
    deployedMeters: 70,
    screenType: 'Palmetas LED P3.9 Outdoor',
    responsible: 'Molina (Técnico Líder)',
  },
  {
    id: 'ev-2',
    title: 'Concierto Movistar Arena',
    venue: 'Parque O\'Higgins · Escenario Central',
    dates: '22 - 24 Octubre 2026',
    status: 'upcoming',
    statusLabel: 'EN PREPARACIÓN',
    totalMeters: 80,
    deployedMeters: 0,
    screenType: 'Palmetas LED P2.9 Indoor',
    responsible: 'Equipo Terreno 2',
  },
  {
    id: 'ev-3',
    title: 'Gala Anual Corporativa',
    venue: 'Espacio Riesco · Salón San Cristóbal',
    dates: '28 Octubre 2026',
    status: 'planned',
    statusLabel: 'PLANIFICADO',
    totalMeters: 45,
    deployedMeters: 0,
    screenType: 'Pista de Baile LED Interactiva',
    responsible: 'Logística Central',
  },
  {
    id: 'ev-4',
    title: 'Festival Internacional de Viña',
    venue: 'Quinta Vergara · Escenario Principal',
    dates: '20 - 26 Noviembre 2026',
    status: 'planned',
    statusLabel: 'PROGRAMADO',
    totalMeters: 220,
    deployedMeters: 0,
    screenType: 'Muros LED P3.9 + Retorno',
    responsible: 'Producción General',
  },
];

type FilterType = 'all' | 'active' | 'upcoming' | 'planned';

export const EventsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredEvents = EVENTS_DATA.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusBadgeStyle = (status: EventItem['status']) => {
    switch (status) {
      case 'active':
        return {
          bg: 'rgba(234, 179, 8, 0.14)',
          border: 'rgba(234, 179, 8, 0.35)',
          text: colors.primaryLight,
        };
      case 'upcoming':
        return {
          bg: 'rgba(16, 185, 129, 0.14)',
          border: 'rgba(16, 185, 129, 0.35)',
          text: colors.success,
        };
      case 'planned':
      default:
        return {
          bg: 'rgba(113, 113, 122, 0.16)',
          border: 'rgba(113, 113, 122, 0.35)',
          text: colors.textSecondary,
        };
    }
  };

  return (
    <View style={[styles.container, { width: screenWidth, marginLeft: TAB_OFFSET }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header Superior Fijo */}
      <View style={[styles.fixedHeaderContainer, { top: insets.top + 10 }]}>
        <LiquidGlassView borderRadius={16} intensity={85} style={styles.headerCard}>
          <View style={styles.headerInfo}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Agenda de Eventos</Text>
              <Text style={styles.headerSubtitle}>Montajes y logística técnica</Text>
            </View>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{EVENTS_DATA.length}</Text>
          </View>
        </LiquidGlassView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 85 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Selector de Filtros */}
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'Todos' },
            { key: 'active', label: 'En Curso' },
            { key: 'upcoming', label: 'Próximos' },
            { key: 'planned', label: 'Programados' },
          ].map((tab) => {
            const isActive = filter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  setFilter(tab.key as FilterType);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Listado de Tarjetas de Eventos */}
        {filteredEvents.map((event) => {
          const badge = getStatusBadgeStyle(event.status);
          const progressPercent =
            event.totalMeters > 0
              ? Math.min(100, Math.round((event.deployedMeters / event.totalMeters) * 100))
              : 0;

          return (
            <View key={event.id} style={styles.eventCard}>
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
                    size={13}
                    color={colors.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.datesText}>{event.dates}</Text>
                </View>
              </View>

              {/* Título y Locación */}
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={styles.venueRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.venueText}>{event.venue}</Text>
              </View>

              {/* Ficha Técnica */}
              <View style={styles.techDetailsBox}>
                <View style={styles.techRow}>
                  <Text style={styles.techLabel}>Pantalla:</Text>
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
                          event.status === 'active' ? colors.primaryAmber : colors.success,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    left: 20,
    right: 20,
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
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
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
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: '#FACC15',
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FACC15',
    fontWeight: '700',
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  datesText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
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
    marginBottom: 14,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  techLabel: {
    color: colors.textMuted,
    fontSize: 12,
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
    fontSize: 12,
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
