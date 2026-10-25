import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import {
  fetchHybridIncidents,
  fetchFilterEvents,
  UnifiedIncident,
  EventFilterOption,
} from '../../../core/api/incidencias';
import { triggerHaptic } from '../../../core/utils/haptics';

export const ActivityHistoryScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [incidents, setIncidents] = useState<UnifiedIncident[]>([]);
  const [events, setEvents] = useState<EventFilterOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Carga inicial y recarga combinada
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [incidentsData, eventsData] = await Promise.all([
        fetchHybridIncidents(),
        fetchFilterEvents(),
      ]);

      setIncidents(incidentsData);
      setEvents(eventsData);
    } catch (error) {
      console.warn('Error cargando historial de incidencias:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    triggerHaptic('medium');
    loadData(true);
  }, [loadData]);

  // Conteo dinámico de incidencias por evento
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = { all: incidents.length };
    incidents.forEach((item) => {
      if (item.evento_id) {
        counts[item.evento_id] = (counts[item.evento_id] || 0) + 1;
      }
      if (item.evento_nombre) {
        counts[item.evento_nombre] = (counts[item.evento_nombre] || 0) + 1;
      }
    });
    return counts;
  }, [incidents]);

  // Nombre legible del evento seleccionado
  const selectedEventName = useMemo(() => {
    if (selectedEventId === 'all') return 'Todos los eventos';
    const found = events.find((e) => e.id === selectedEventId || e.nombre === selectedEventId);
    return found ? found.nombre : selectedEventId;
  }, [selectedEventId, events]);

  // Filtrado reactivo en memoria: por evento y término de búsqueda
  const filteredIncidents = useMemo(() => {
    let list = incidents;

    // 1. Filtrar por evento seleccionado en el dropdown
    if (selectedEventId !== 'all') {
      const target = selectedEventId.toLowerCase();
      list = list.filter((item) => {
        const matchId = item.evento_id?.toLowerCase() === target;
        const matchName = item.evento_nombre?.toLowerCase() === target;
        const partialMatch = item.evento_nombre?.toLowerCase().includes(target);
        return matchId || matchName || partialMatch;
      });
    }

    // 2. Filtrar por término de búsqueda (QR, código visible, falla o descripción)
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter((item) => {
        const matchQr = item.qr_uuid?.toLowerCase().includes(query);
        const matchCode = item.codigo_visible?.toLowerCase().includes(query);
        const matchFalla = item.tipo_falla?.toLowerCase().includes(query);
        const matchDesc = item.descripcion?.toLowerCase().includes(query);
        const matchEvent = item.evento_nombre?.toLowerCase().includes(query);
        return matchQr || matchCode || matchFalla || matchDesc || matchEvent;
      });
    }

    return list;
  }, [incidents, selectedEventId, searchQuery]);

  const handleSelectEvent = (id: string) => {
    triggerHaptic('selection');
    setSelectedEventId(id);
    setIsDropdownOpen(false);
  };

  const handleClearSearch = () => {
    triggerHaptic('light');
    setSearchQuery('');
  };

  const handlePalmetaPress = (item: UnifiedIncident) => {
    triggerHaptic('light');
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

    const status = isBaja
      ? '• Dado de Baja'
      : isMant
        ? '• En Mantención'
        : '• Operativo';

    router.push({
      pathname: '/asset-detail',
      params: {
        uuid: item.qr_uuid,
        title: `Palmeta #${shortCode}`,
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
      const days = Math.floor(diffHours / 24);
      return `Hace ${days} d`;
    } catch {
      return 'Reciente';
    }
  };

  const formatFullDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const renderIncidentCard = ({ item }: { item: UnifiedIncident }) => {
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

    const iconColor = isBaja ? colors.danger : isMant ? colors.warning : colors.success;
    const iconBg = isBaja
      ? 'rgba(239, 68, 68, 0.15)'
      : isMant
        ? 'rgba(245, 158, 11, 0.15)'
        : 'rgba(16, 185, 129, 0.15)';

    const statusPillText = isBaja ? 'Baja' : isMant ? 'Mantención' : 'Operativa';
    const statusPillBg = isBaja
      ? 'rgba(239, 68, 68, 0.14)'
      : isMant
        ? 'rgba(245, 158, 11, 0.14)'
        : 'rgba(16, 185, 129, 0.14)';

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => handlePalmetaPress(item)}
        activeOpacity={0.82}
      >
        <View style={styles.cardHeaderRow}>
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName} size={18} color={iconColor} />
          </View>

          <View style={styles.headerInfoCol}>
            <View style={styles.titleTopRow}>
              <Text style={styles.palmetaTitle}>Palmeta #{shortCode}</Text>
              <View style={[styles.statusPill, { backgroundColor: statusPillBg }]}>
                <Text style={[styles.statusPillText, { color: iconColor }]}>{statusPillText}</Text>
              </View>
            </View>
            <Text style={styles.timeText}>
              {formatTimeAgo(item.fecha)} · {formatFullDate(item.fecha)}
            </Text>
          </View>
        </View>

        {/* Falla Técnica */}
        <View style={styles.fallaBox}>
          <Text style={styles.fallaTitle}>{item.tipo_falla}</Text>
          {item.descripcion ? (
            <Text style={styles.fallaDescription} numberOfLines={2}>
              {item.descripcion}
            </Text>
          ) : null}
        </View>

        {/* Footer Meta: Evento y Sincronización */}
        <View style={styles.cardFooterRow}>
          <View style={styles.eventPill}>
            <Ionicons name="location-sharp" size={12} color={colors.primaryAmber} style={{ marginRight: 4 }} />
            <Text style={styles.eventPillText} numberOfLines={1}>
              {item.evento_nombre || 'Evento en terreno'}
            </Text>
          </View>

          <View style={styles.footerRightBadges}>
            {item.foto_url ? (
              <View style={styles.photoIndicator}>
                <Ionicons name="camera-outline" size={13} color={colors.primaryLight} style={{ marginRight: 3 }} />
                <Text style={styles.photoIndicatorText}>Foto</Text>
              </View>
            ) : null}

            <View style={[styles.syncBadge, item.sincronizado ? styles.syncBadgeCloud : styles.syncBadgeLocal]}>
              <Ionicons
                name={item.sincronizado ? 'cloud-done-outline' : 'phone-portrait-outline'}
                size={11}
                color={item.sincronizado ? colors.success : colors.warning}
                style={{ marginRight: 3 }}
              />
              <Text
                style={[
                  styles.syncBadgeText,
                  { color: item.sincronizado ? colors.success : colors.warning },
                ]}
              >
                {item.sincronizado ? 'Cloud' : 'Local'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const isSearching = searchQuery.trim().length > 0;
    const isFiltered = selectedEventId !== 'all';

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons
            name={isSearching ? 'search-outline' : 'shield-checkmark-outline'}
            size={36}
            color={colors.primaryAmber}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {isSearching ? 'Sin resultados para la búsqueda' : 'Sin incidencias registradas'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isSearching
            ? `No se encontraron incidencias que coincidan con "${searchQuery}".`
            : isFiltered
              ? `El evento "${selectedEventName}" no tiene incidencias reportadas.`
              : 'No hay reportes de fallas ni palmetas de baja registradas en el sistema.'}
        </Text>

        {isSearching ? (
          <TouchableOpacity
            style={styles.resetFilterButton}
            onPress={handleClearSearch}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={15} color={colors.textInverse} style={{ marginRight: 6 }} />
            <Text style={styles.resetFilterButtonText}>Limpiar búsqueda</Text>
          </TouchableOpacity>
        ) : isFiltered ? (
          <TouchableOpacity
            style={styles.resetFilterButton}
            onPress={() => handleSelectEvent('all')}
            activeOpacity={0.8}
          >
            <Ionicons name="apps-outline" size={15} color={colors.textInverse} style={{ marginRight: 6 }} />
            <Text style={styles.resetFilterButtonText}>Ver todos los eventos</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: screenWidth }]}>
      <StatusBar barStyle="light-content" />

      {/* Header Fijo Superior */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              triggerHaptic('light');
              router.back();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.screenTitle}>Historial de Incidencias</Text>
            <Text style={styles.screenSubtitle}>Trazabilidad técnica por montaje</Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredIncidents.length}</Text>
          </View>
        </View>

        {/* 1. Barra de Búsqueda */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por QR, código visible o falla..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 2. Selector Dropdown de Eventos */}
        <View style={styles.dropdownSection}>
          <Text style={styles.dropdownLabel}>EVENTO SELECCIONADO</Text>
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              selectedEventId !== 'all' && styles.dropdownButtonActive,
            ]}
            onPress={() => {
              triggerHaptic('light');
              setIsDropdownOpen(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownButtonLeft}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={selectedEventId !== 'all' ? colors.primaryAmber : colors.textSecondary}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.dropdownButtonText,
                  selectedEventId !== 'all' && styles.dropdownButtonTextActive,
                ]}
                numberOfLines={1}
              >
                {selectedEventName}
              </Text>
            </View>

            <View style={styles.dropdownButtonRight}>
              <View style={styles.dropdownCountPill}>
                <Text style={styles.dropdownCountText}>
                  {eventCounts[selectedEventId] ?? filteredIncidents.length}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={16}
                color={selectedEventId !== 'all' ? colors.primaryAmber : colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal Bottom Sheet: Dropdown de Selección de Evento */}
      <Modal
        visible={isDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
                {/* Indicador de agarre superior */}
                <View style={styles.sheetHandle} />

                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Filtrar por Evento</Text>
                    <Text style={styles.modalSubtitle}>Aisla incidencias de un montaje específico</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setIsDropdownOpen(false)}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalOptionsList} showsVerticalScrollIndicator={false}>
                  {/* Opción 1: Todos los eventos */}
                  <TouchableOpacity
                    style={[
                      styles.modalOptionItem,
                      selectedEventId === 'all' && styles.modalOptionItemActive,
                    ]}
                    onPress={() => handleSelectEvent('all')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalOptionLeft}>
                      <View
                        style={[
                          styles.modalRadioCircle,
                          selectedEventId === 'all' && styles.modalRadioCircleActive,
                        ]}
                      >
                        {selectedEventId === 'all' ? <View style={styles.modalRadioInnerDot} /> : null}
                      </View>
                      <Text
                        style={[
                          styles.modalOptionText,
                          selectedEventId === 'all' && styles.modalOptionTextActive,
                        ]}
                      >
                        Todos los eventos
                      </Text>
                    </View>

                    <View style={styles.modalOptionBadge}>
                      <Text style={styles.modalOptionBadgeText}>{incidents.length}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Opciones de Eventos Específicos */}
                  {events.map((ev) => {
                    const isSelected = selectedEventId === ev.id || selectedEventId === ev.nombre;
                    const count = eventCounts[ev.id] || eventCounts[ev.nombre] || 0;

                    return (
                      <TouchableOpacity
                        key={`dropdown-ev-${ev.id}`}
                        style={[
                          styles.modalOptionItem,
                          isSelected && styles.modalOptionItemActive,
                        ]}
                        onPress={() => handleSelectEvent(ev.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.modalOptionLeft}>
                          <View
                            style={[
                              styles.modalRadioCircle,
                              isSelected && styles.modalRadioCircleActive,
                            ]}
                          >
                            {isSelected ? <View style={styles.modalRadioInnerDot} /> : null}
                          </View>
                          <Text
                            style={[
                              styles.modalOptionText,
                              isSelected && styles.modalOptionTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {ev.nombre}
                          </Text>
                        </View>

                        <View style={styles.modalOptionBadge}>
                          <Text style={styles.modalOptionBadgeText}>{count}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Lista Principal de Incidencias */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryAmber} />
          <Text style={styles.loadingText}>Cargando trazabilidad técnica...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredIncidents}
          keyExtractor={(item) => item.id}
          renderItem={renderIncidentCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 30 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primaryAmber}
              colors={[colors.primaryAmber]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 12,
  },
  screenTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  screenSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  countBadgeText: {
    color: colors.primaryAmber,
    fontSize: 13,
    fontWeight: '800',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  dropdownSection: {
    marginTop: 2,
  },
  dropdownLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownButtonActive: {
    borderColor: 'rgba(229, 152, 25, 0.45)',
    backgroundColor: 'rgba(229, 152, 25, 0.08)',
  },
  dropdownButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dropdownButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownButtonTextActive: {
    color: colors.primaryAmber,
    fontWeight: '700',
  },
  dropdownButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownCountPill: {
    backgroundColor: colors.border,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dropdownCountText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
  cardContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfoCol: {
    flex: 1,
  },
  titleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  palmetaTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  fallaBox: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(38, 42, 52, 0.6)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  fallaTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  fallaDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 200,
  },
  eventPillText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  footerRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 179, 61, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(243, 179, 61, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  photoIndicatorText: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  syncBadgeCloud: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  syncBadgeLocal: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(229, 152, 25, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 152, 25, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  resetFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryAmber,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetFilterButtonText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionsList: {
    marginBottom: 10,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalOptionItemActive: {
    borderColor: colors.primaryAmber,
    backgroundColor: 'rgba(229, 152, 25, 0.12)',
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  modalRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalRadioCircleActive: {
    borderColor: colors.primaryAmber,
  },
  modalRadioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryAmber,
  },
  modalOptionText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  modalOptionTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  modalOptionBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modalOptionBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
});
