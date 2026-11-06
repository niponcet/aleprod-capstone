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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEdgeInsets } from '../../../core/hooks/useEdgeInsets';
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

interface PalmetaGroup {
  qr_uuid: string;
  codigo_visible?: string;
  latestIncident: UnifiedIncident;
  incidents: UnifiedIncident[];
  mostSevereStatus: 'baja' | 'mantencion' | 'operativa';
}

type ViewMode = 'grouped' | 'timeline';

export const ActivityHistoryScreen: React.FC = () => {
  const router = useRouter();
  const { insets } = useEdgeInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [incidents, setIncidents] = useState<UnifiedIncident[]>([]);
  const [events, setEvents] = useState<EventFilterOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modo de visualización: 'grouped' (por palmeta) para evitar scroll infinito, o 'timeline' (cronológico)
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  // Estado de acordeón para desplegar historial interno de palmetas con múltiples incidencias
  const [expandedPalmetas, setExpandedPalmetas] = useState<Record<string, boolean>>({});

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

  // 1. Filtrado reactivo en memoria: por evento y búsqueda
  const filteredIncidents = useMemo(() => {
    let list = incidents;

    if (selectedEventId !== 'all') {
      const target = selectedEventId.toLowerCase();
      list = list.filter((item) => {
        const matchId = item.evento_id?.toLowerCase() === target;
        const matchName = item.evento_nombre?.toLowerCase() === target;
        const partialMatch = item.evento_nombre?.toLowerCase().includes(target);
        return matchId || matchName || partialMatch;
      });
    }

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

  // 2. Agrupación por Palmeta para optimizar el scroll excesivo
  const groupedPalmetas = useMemo(() => {
    const map = new Map<string, UnifiedIncident[]>();
    filteredIncidents.forEach((item) => {
      const key = item.qr_uuid;
      const existing = map.get(key) || [];
      existing.push(item);
      map.set(key, existing);
    });

    const groups: PalmetaGroup[] = [];
    map.forEach((items, key) => {
      // Ordenar incidencias de la palmeta cronológicamente descendente
      const sorted = [...items].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
      const latest = sorted[0];

      // Determinar la severidad más crítica registrada
      let severity: 'baja' | 'mantencion' | 'operativa' = 'operativa';
      for (const inc of sorted) {
        const f = inc.tipo_falla.toLowerCase();
        if (f.includes('baja') || f.includes('crítica')) {
          severity = 'baja';
          break;
        }
        if (
          f.includes('manten') ||
          f.includes('apagado') ||
          f.includes('dañado') ||
          f.includes('falla') ||
          f.includes('fuente')
        ) {
          severity = 'mantencion';
        }
      }

      groups.push({
        qr_uuid: key,
        codigo_visible: latest.codigo_visible,
        latestIncident: latest,
        incidents: sorted,
        mostSevereStatus: severity,
      });
    });

    // Ordenar los grupos por la fecha del último incidente
    return groups.sort(
      (a, b) =>
        new Date(b.latestIncident.fecha).getTime() - new Date(a.latestIncident.fecha).getTime()
    );
  }, [filteredIncidents]);

  const handleSelectEvent = (id: string) => {
    triggerHaptic('selection');
    setSelectedEventId(id);
    setIsDropdownOpen(false);
  };

  const handleClearSearch = () => {
    triggerHaptic('light');
    setSearchQuery('');
  };

  const togglePalmetaExpand = (uuid: string) => {
    triggerHaptic('selection');
    setExpandedPalmetas((prev) => ({
      ...prev,
      [uuid]: !prev[uuid],
    }));
  };

  const handlePalmetaPress = (qr_uuid: string, shortCode: string, severity: string) => {
    triggerHaptic('light');
    const statusText =
      severity === 'baja'
        ? '• Dado de Baja'
        : severity === 'mantencion'
          ? '• En Mantención'
          : '• Operativo';

    router.push({
      pathname: '/asset-detail',
      params: {
        uuid: qr_uuid,
        title: `Palmeta #${shortCode}`,
        status: statusText,
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

  // Renderizador para Modo Agrupado (Master Card con Accordion)
  const renderGroupedPalmetaCard = ({ item }: { item: PalmetaGroup }) => {
    const shortCode =
      item.codigo_visible ||
      (item.qr_uuid.length > 8 ? item.qr_uuid.slice(-4).toUpperCase() : item.qr_uuid);

    const isBaja = item.mostSevereStatus === 'baja';
    const isMant = item.mostSevereStatus === 'mantencion';

    const iconColor = isBaja ? colors.danger : isMant ? colors.warning : colors.success;
    const iconBg = isBaja
      ? 'rgba(239, 68, 68, 0.12)'
      : isMant
        ? 'rgba(245, 158, 11, 0.12)'
        : 'rgba(16, 185, 129, 0.12)';

    const iconName: keyof typeof Ionicons.glyphMap = isBaja
      ? 'close-circle-outline'
      : isMant
        ? 'warning-outline'
        : 'checkmark-circle-outline';

    const statusPillText = isBaja ? 'Baja' : isMant ? 'Mantención' : 'Operativa';
    const statusPillBg = isBaja
      ? 'rgba(239, 68, 68, 0.14)'
      : isMant
        ? 'rgba(245, 158, 11, 0.14)'
        : 'rgba(16, 185, 129, 0.14)';

    const isExpanded = !!expandedPalmetas[item.qr_uuid];
    const latest = item.latestIncident;
    const previousIncidents = item.incidents.slice(1);

    return (
      <View style={styles.groupedCard}>
        {/* Cabecera de la Palmeta */}
        <TouchableOpacity
          style={styles.groupedHeaderRow}
          onPress={() => handlePalmetaPress(item.qr_uuid, shortCode, item.mostSevereStatus)}
          activeOpacity={0.7}
        >
          <View style={[styles.palmetaIconBox, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName} size={20} color={iconColor} />
          </View>

          <View style={styles.palmetaHeaderInfo}>
            <View style={styles.palmetaTopTitleRow}>
              <Text style={styles.palmetaMainCode}>Palmeta #{shortCode}</Text>
              <View style={[styles.statusPill, { backgroundColor: statusPillBg }]}>
                <Text style={[styles.statusPillText, { color: iconColor }]}>{statusPillText}</Text>
              </View>
            </View>

            <View style={styles.palmetaMetaRow}>
              <Text style={styles.palmetaLastSeenText}>
                {formatTimeAgo(latest.fecha)} · {formatFullDate(latest.fecha)}
              </Text>
              <View style={styles.countBadgePill}>
                <Text style={styles.countBadgePillText}>
                  {item.incidents.length}{' '}
                  {item.incidents.length === 1 ? 'incidencia' : 'incidencias'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Caja de la Última Incidencia */}
        <View style={styles.latestIncidentBox}>
          <View style={styles.latestTagRow}>
            <View style={styles.latestTagPill}>
              <Text style={styles.latestTagPillText}>ÚLTIMO REPORTE</Text>
            </View>
            <View style={styles.syncMetaRight}>
              {latest.foto_url ? (
                <View style={styles.photoIndicatorPill}>
                  <Ionicons name="camera-outline" size={11} color="#60A5FA" style={{ marginRight: 3 }} />
                  <Text style={styles.photoIndicatorText}>Foto</Text>
                </View>
              ) : null}

              <View
                style={[
                  styles.syncBadge,
                  latest.sincronizado ? styles.syncBadgeCloud : styles.syncBadgeLocal,
                ]}
              >
                <Ionicons
                  name={latest.sincronizado ? 'cloud-done-outline' : 'phone-portrait-outline'}
                  size={11}
                  color={latest.sincronizado ? colors.success : colors.warning}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.syncBadgeText,
                    { color: latest.sincronizado ? colors.success : colors.warning },
                  ]}
                >
                  {latest.sincronizado ? 'Cloud' : 'Local'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.fallaMainTitle}>{latest.tipo_falla}</Text>
          {latest.descripcion ? (
            <Text style={styles.fallaDescriptionText} numberOfLines={2}>
              {latest.descripcion}
            </Text>
          ) : null}

          <View style={styles.eventFooterRow}>
            <Ionicons name="location-sharp" size={12} color="#60A5FA" style={{ marginRight: 4 }} />
            <Text style={styles.eventNameFooterText} numberOfLines={1}>
              {latest.evento_nombre || 'Evento en terreno'}
            </Text>
          </View>
        </View>

        {/* Sección Acordeón: Desplegable si hay más de 1 incidencia */}
        {previousIncidents.length > 0 ? (
          <View style={styles.accordionSection}>
            <TouchableOpacity
              style={styles.accordionToggleButton}
              onPress={() => togglePalmetaExpand(item.qr_uuid)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isExpanded ? 'chevron-up-circle-outline' : 'chevron-down-circle-outline'}
                size={16}
                color="#60A5FA"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.accordionToggleText}>
                {isExpanded
                  ? 'Ocultar historial anterior'
                  : `Ver ${previousIncidents.length} ${
                      previousIncidents.length === 1 ? 'incidencia anterior' : 'incidencias anteriores'
                    }`}
              </Text>
            </TouchableOpacity>

            {isExpanded ? (
              <View style={styles.subTimelineContainer}>
                {previousIncidents.map((prevInc, idx) => {
                  const isPrevBaja =
                    prevInc.tipo_falla.toLowerCase().includes('baja') ||
                    prevInc.tipo_falla.toLowerCase().includes('crítica');
                  const isPrevMant =
                    prevInc.tipo_falla.toLowerCase().includes('manten') ||
                    prevInc.tipo_falla.toLowerCase().includes('apagado') ||
                    prevInc.tipo_falla.toLowerCase().includes('falla');
                  const dotColor = isPrevBaja
                    ? colors.danger
                    : isPrevMant
                      ? colors.warning
                      : colors.success;

                  return (
                    <View key={`prev-${prevInc.id}`} style={styles.timelineItemRow}>
                      <View style={styles.timelineTrackerCol}>
                        <View style={[styles.timelineDot, { backgroundColor: dotColor }]} />
                        {idx < previousIncidents.length - 1 ? (
                          <View style={styles.timelineVerticalLine} />
                        ) : null}
                      </View>

                      <View style={styles.timelineContentBox}>
                        <View style={styles.timelineTitleRow}>
                          <Text style={styles.timelineFallaText}>{prevInc.tipo_falla}</Text>
                          <Text style={styles.timelineDateText}>
                            {formatTimeAgo(prevInc.fecha)}
                          </Text>
                        </View>
                        {prevInc.descripcion ? (
                          <Text style={styles.timelineDescText} numberOfLines={1}>
                            {prevInc.descripcion}
                          </Text>
                        ) : null}
                        <Text style={styles.timelineEventText} numberOfLines={1}>
                          {prevInc.evento_nombre || 'Evento en curso'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Enlace rápido a Ficha Técnica */}
        <TouchableOpacity
          style={styles.cardFooterAction}
          onPress={() => handlePalmetaPress(item.qr_uuid, shortCode, item.mostSevereStatus)}
          activeOpacity={0.7}
        >
          <Text style={styles.cardFooterActionText}>Ver ficha técnica de palmeta</Text>
          <Ionicons name="arrow-forward" size={14} color="#60A5FA" />
        </TouchableOpacity>
      </View>
    );
  };

  // Renderizador para Modo Cronológico Lineal (Timeline clásica)
  const renderTimelineCard = ({ item }: { item: UnifiedIncident }) => {
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
      ? 'rgba(239, 68, 68, 0.12)'
      : isMant
        ? 'rgba(245, 158, 11, 0.12)'
        : 'rgba(16, 185, 129, 0.12)';

    const statusPillText = isBaja ? 'Baja' : isMant ? 'Mantención' : 'Operativa';
    const statusPillBg = isBaja
      ? 'rgba(239, 68, 68, 0.14)'
      : isMant
        ? 'rgba(245, 158, 11, 0.14)'
        : 'rgba(16, 185, 129, 0.14)';

    return (
      <TouchableOpacity
        style={styles.groupedCard}
        onPress={() =>
          handlePalmetaPress(item.qr_uuid, shortCode, isBaja ? 'baja' : isMant ? 'mantencion' : 'operativa')
        }
        activeOpacity={0.82}
      >
        <View style={styles.groupedHeaderRow}>
          <View style={[styles.palmetaIconBox, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName} size={18} color={iconColor} />
          </View>

          <View style={styles.palmetaHeaderInfo}>
            <View style={styles.palmetaTopTitleRow}>
              <Text style={styles.palmetaMainCode}>Palmeta #{shortCode}</Text>
              <View style={[styles.statusPill, { backgroundColor: statusPillBg }]}>
                <Text style={[styles.statusPillText, { color: iconColor }]}>{statusPillText}</Text>
              </View>
            </View>
            <Text style={styles.palmetaLastSeenText}>
              {formatTimeAgo(item.fecha)} · {formatFullDate(item.fecha)}
            </Text>
          </View>
        </View>

        <View style={styles.latestIncidentBox}>
          <Text style={styles.fallaMainTitle}>{item.tipo_falla}</Text>
          {item.descripcion ? (
            <Text style={styles.fallaDescriptionText} numberOfLines={2}>
              {item.descripcion}
            </Text>
          ) : null}

          <View style={styles.eventFooterRow}>
            <Ionicons name="location-sharp" size={12} color="#60A5FA" style={{ marginRight: 4 }} />
            <Text style={styles.eventNameFooterText} numberOfLines={1}>
              {item.evento_nombre || 'Evento en terreno'}
            </Text>
          </View>
        </View>

        <View style={styles.timelineFooterBadgesRow}>
          {item.foto_url ? (
            <View style={styles.photoIndicatorPill}>
              <Ionicons name="camera-outline" size={11} color="#60A5FA" style={{ marginRight: 3 }} />
              <Text style={styles.photoIndicatorText}>Foto</Text>
            </View>
          ) : null}

          <View
            style={[
              styles.syncBadge,
              item.sincronizado ? styles.syncBadgeCloud : styles.syncBadgeLocal,
            ]}
          >
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
            color="#60A5FA"
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
            <Ionicons name="close-circle-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.resetFilterButtonText}>Limpiar búsqueda</Text>
          </TouchableOpacity>
        ) : isFiltered ? (
          <TouchableOpacity
            style={styles.resetFilterButton}
            onPress={() => handleSelectEvent('all')}
            activeOpacity={0.8}
          >
            <Ionicons name="apps-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.resetFilterButtonText}>Ver todos los eventos</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: screenWidth }]}>
      <StatusBar barStyle="light-content" />

      {/* Halo ambiental superior continuo idéntico a Notificaciones y Agenda */}
      <LinearGradient
        colors={['#000000', '#000000', 'rgba(29, 78, 216, 0.35)', 'rgba(37, 99, 235, 0.18)', 'transparent']}
        locations={[0, 0.22, 0.50, 0.78, 1]}
        style={styles.topAmbientGlow}
        pointerEvents="none"
      />

      {/* Header Fijo Superior */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop:
              Platform.OS === 'web'
                ? ('max(calc(env(safe-area-inset-top, 0px) + 8px), 20px)' as any)
                : insets.top + 8,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              triggerHaptic('light');
              router.back();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.screenSubtitle}>ALEPROD TERRENO</Text>
            <Text style={styles.screenTitle}>Historial de Incidencias</Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredIncidents.length}</Text>
          </View>
        </View>

        {/* 1. Barra de Búsqueda Moderna */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color="#60A5FA" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por QR, código visible o falla..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 2. Barra de Filtro de Evento y Conmutador de Modo */}
        <View style={styles.filterControlsRow}>
          {/* Botón Selector de Evento */}
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
            <Ionicons
              name="calendar-outline"
              size={15}
              color={selectedEventId !== 'all' ? '#60A5FA' : '#94A3B8'}
              style={{ marginRight: 6 }}
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
            <Ionicons
              name="chevron-down"
              size={14}
              color={selectedEventId !== 'all' ? '#60A5FA' : '#64748B'}
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>

          {/* Segmented Switch: Por Palmeta (Agrupado) vs Línea de Tiempo */}
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[styles.segmentTab, viewMode === 'grouped' && styles.segmentTabActive]}
              onPress={() => {
                triggerHaptic('selection');
                setViewMode('grouped');
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid-outline"
                size={13}
                color={viewMode === 'grouped' ? '#FFFFFF' : '#94A3B8'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.segmentTabText,
                  viewMode === 'grouped' && styles.segmentTabTextActive,
                ]}
              >
                Por Palmeta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentTab, viewMode === 'timeline' && styles.segmentTabActive]}
              onPress={() => {
                triggerHaptic('selection');
                setViewMode('timeline');
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="time-outline"
                size={13}
                color={viewMode === 'timeline' ? '#FFFFFF' : '#94A3B8'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.segmentTabText,
                  viewMode === 'timeline' && styles.segmentTabTextActive,
                ]}
              >
                Cronológico
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal Bottom Sheet: Selector de Evento */}
      <Modal
        visible={isDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalSheet,
                  {
                    paddingBottom:
                      Platform.OS === 'web'
                        ? ('calc(env(safe-area-inset-bottom, 0px) + 20px)' as any)
                        : insets.bottom + 20,
                  },
                ]}
              >
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
                    <Ionicons name="close" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalOptionsList} showsVerticalScrollIndicator={false}>
                  {/* Opción: Todos los eventos */}
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
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Cargando trazabilidad técnica...</Text>
        </View>
      ) : viewMode === 'grouped' ? (
        <FlatList
          data={groupedPalmetas}
          keyExtractor={(item) => `palmeta-${item.qr_uuid}`}
          renderItem={renderGroupedPalmetaCard}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                Platform.OS === 'web'
                  ? ('calc(env(safe-area-inset-bottom, 0px) + 30px)' as any)
                  : insets.bottom + 30,
            },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            Platform.OS !== 'web' ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60A5FA" colors={['#2563EB']} />
            ) : undefined
          }
        />
      ) : (
        <FlatList
          data={filteredIncidents}
          keyExtractor={(item) => `timeline-${item.id}`}
          renderItem={renderTimelineCard}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                Platform.OS === 'web'
                  ? ('calc(env(safe-area-inset-bottom, 0px) + 30px)' as any)
                  : insets.bottom + 30,
            },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            Platform.OS !== 'web' ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60A5FA" colors={['#2563EB']} />
            ) : undefined
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topAmbientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 0,
  },
  headerContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 16,
    paddingBottom: 14,
    zIndex: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 12,
  },
  screenSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '800',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    padding: 0,
  },
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dropdownButtonActive: {
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  dropdownButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  dropdownButtonTextActive: {
    color: '#60A5FA',
    fontWeight: '700',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 3,
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },
  segmentTabActive: {
    backgroundColor: '#2563EB',
  },
  segmentTabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  segmentTabTextActive: {
    color: '#FFFFFF',
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
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
  },
  groupedCard: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  groupedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  palmetaIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  palmetaHeaderInfo: {
    flex: 1,
  },
  palmetaTopTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  palmetaMainCode: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  palmetaMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  palmetaLastSeenText: {
    color: '#64748B',
    fontSize: 11,
  },
  countBadgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  countBadgePillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  latestIncidentBox: {
    backgroundColor: '#141A28',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  latestTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  latestTagPill: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  latestTagPillText: {
    color: '#60A5FA',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  syncMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  photoIndicatorText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '700',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  syncBadgeCloud: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  syncBadgeLocal: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fallaMainTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  fallaDescriptionText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  eventFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  eventNameFooterText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  accordionSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
    marginTop: 4,
  },
  accordionToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  accordionToggleText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  subTimelineContainer: {
    paddingLeft: 8,
    paddingTop: 6,
    paddingBottom: 4,
  },
  timelineItemRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineTrackerCol: {
    alignItems: 'center',
    width: 14,
    marginRight: 10,
    paddingTop: 4,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineVerticalLine: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 2,
  },
  timelineContentBox: {
    flex: 1,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineFallaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  timelineDateText: {
    color: '#64748B',
    fontSize: 10,
  },
  timelineDescText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  timelineEventText: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 1,
  },
  cardFooterAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
    marginTop: 4,
    gap: 4,
  },
  cardFooterActionText: {
    color: '#60A5FA',
    fontSize: 11.5,
    fontWeight: '600',
  },
  timelineFooterBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  resetFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#121620',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    backgroundColor: '#141A28',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalOptionItemActive: {
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
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
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalRadioCircleActive: {
    borderColor: '#2563EB',
  },
  modalRadioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  modalOptionText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  modalOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOptionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modalOptionBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
});
