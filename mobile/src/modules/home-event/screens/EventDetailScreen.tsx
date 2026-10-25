import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { LiquidGlassView } from '../../../core/components/LiquidGlassView';
import { triggerHaptic } from '../../../core/utils/haptics';
import { supabase } from '../../../core/api/supabase';
import {
  getLocalIncidenciasByEvento,
  updateLocalEventoEstado,
  LocalIncidencia,
} from '../../../core/db/database';
import { ReportIncidentModal } from '../../scanner-incidents/components/ReportIncidentModal';
import { IncidentScannerModal } from '../../scanner-incidents/components/IncidentScannerModal';

export interface IncidentItem {
  id: string | number;
  qr_uuid: string;
  tipo_falla: string;
  fecha: string;
  foto_url?: string | null;
  observaciones?: string | null;
  is_local?: boolean;
}

export const EventDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    venue?: string;
    dates?: string;
    status?: string;
    totalMeters?: string;
    screenType?: string;
    responsible?: string;
  }>();

  const eventId = params.id;
  const initialTitle = params.title || 'Detalle del Evento';
  const initialVenue = params.venue || 'Recinto no especificado';
  const initialMeters = Number(params.totalMeters) || 0;
  const initialScreenType = params.screenType || 'Pista de Baile LED';
  const initialStatus =
    params.status === 'finalizado' ? 'finalizado' : 'en_curso';

  const [status, setStatus] = useState<'en_curso' | 'finalizado'>(initialStatus);
  const [eventData, setEventData] = useState<{
    nombre: string;
    locacion: string;
    metros_cuadrados: number;
    tipo_pantalla: string;
    fecha_inicio?: string;
    fecha_termino?: string | null;
  }>({
    nombre: initialTitle,
    locacion: initialVenue,
    metros_cuadrados: initialMeters,
    tipo_pantalla: initialScreenType,
  });

  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [closingEvent, setClosingEvent] = useState<boolean>(false);
  const [isScannerVisible, setIsScannerVisible] = useState<boolean>(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState<boolean>(false);
  const [scannedQr, setScannedQr] = useState<string | null>(null);

  // Consulta híbrida: Supabase Cloud + Fallback / Mezcla con SQLite local
  const fetchIncidents = useCallback(async () => {
    if (!eventId) return;

    try {
      // 1. Consultar incidencias locales en SQLite
      const localRows: LocalIncidencia[] = getLocalIncidenciasByEvento(eventId);
      const localMapped: IncidentItem[] = localRows.map((item) => ({
        id: `local-${item.id}`,
        qr_uuid: item.qr_uuid,
        tipo_falla: item.tipo_falla || 'Incidencia General',
        fecha: item.fecha,
        foto_url: item.foto_uri || null,
        observaciones: item.observaciones || null,
        is_local: true,
      }));

      // 2. Consultar incidencias remotas en Supabase
      const { data: remoteData, error } = await supabase
        .from('incidencias')
        .select('*')
        .eq('evento_id', eventId)
        .order('fecha_ocurrencia', { ascending: false });

      if (error) {
        console.warn('Consulta remota de incidencias falló, usando datos SQLite:', error.message);
        setIncidents(localMapped);
        return;
      }

      if (remoteData && remoteData.length > 0) {
        const remoteMapped: IncidentItem[] = remoteData.map((item: any) => ({
          id: item.id,
          qr_uuid: item.qr_uuid || 'Sin código QR',
          tipo_falla: item.tipo_falla || 'Falla Técnica',
          fecha: item.fecha_ocurrencia || item.created_at,
          foto_url: item.foto_url || null,
          observaciones: item.descripcion || null,
          is_local: false,
        }));

        // Combinar evitando duplicados de QR y fecha
        const combined = [...localMapped];
        remoteMapped.forEach((r) => {
          if (!combined.some((c) => c.qr_uuid === r.qr_uuid && c.fecha === r.fecha)) {
            combined.push(r);
          }
        });

        // Ordenar más reciente primero
        combined.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        setIncidents(combined);
      } else {
        setIncidents(localMapped);
      }
    } catch (err) {
      console.warn('Error general obteniendo trazabilidad:', err);
    } finally {
      setLoadingIncidents(false);
      setRefreshing(false);
    }
  }, [eventId]);

  // Consulta del detalle remoto del evento para asegurar estado actualizado
  const fetchEventRemoteDetails = useCallback(async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventId)
        .single();

      if (data && !error) {
        setEventData({
          nombre: data.nombre,
          locacion: data.locacion,
          metros_cuadrados: Number(data.metros_cuadrados) || 0,
          tipo_pantalla: data.tipo_pantalla || 'Pista de Baile LED',
          fecha_inicio: data.fecha_inicio,
          fecha_termino: data.fecha_termino,
        });
        if (data.estado === 'finalizado') {
          setStatus('finalizado');
        } else if (data.estado === 'en_curso') {
          setStatus('en_curso');
        }
      }
    } catch (err) {
      console.warn('No fue posible sincronizar el detalle del evento:', err);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventRemoteDetails();
    fetchIncidents();
  }, [fetchEventRemoteDetails, fetchIncidents]);

  const onRefresh = () => {
    triggerHaptic('light');
    setRefreshing(true);
    fetchEventRemoteDetails();
    fetchIncidents();
  };

  // Cierre del Evento (HU-16): actualiza estado en Supabase y SQLite
  const handleConfirmFinalizeEvent = () => {
    Alert.alert(
      '¿Finalizar Evento?',
      'Esta acción marcará el evento como concluido y pasará al Historial en modo de Solo Lectura. No se podrán añadir nuevas incidencias ni alterar su inventario.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Finalizar Evento',
          style: 'destructive',
          onPress: async () => {
            setClosingEvent(true);
            triggerHaptic('medium');

            try {
              const nowIso = new Date().toISOString();

              // 1. Actualizar en Supabase (por UUID o por Nombre si el ID fue temporal)
              let updateBuilder = supabase
                .from('eventos')
                .update({
                  estado: 'finalizado',
                  fecha_termino: nowIso,
                });

              if (eventId && !eventId.startsWith('ev-')) {
                updateBuilder = updateBuilder.eq('id', eventId);
              } else {
                updateBuilder = updateBuilder.eq('nombre', eventData.nombre);
              }

              const { data: updatedRows, error } = await updateBuilder.select();

              if (error) {
                console.warn('Error al finalizar en Supabase:', error.message);
                throw error;
              }

              // Fallback si por ID no afectó filas remotas
              if (!updatedRows || updatedRows.length === 0) {
                await supabase
                  .from('eventos')
                  .update({
                    estado: 'finalizado',
                    fecha_termino: nowIso,
                  })
                  .eq('nombre', eventData.nombre);
              }

              // 2. Actualizar en base de datos local SQLite (por ID y por Nombre)
              updateLocalEventoEstado(eventId, 'finalizado');
              if (eventData.nombre) {
                updateLocalEventoEstado(eventData.nombre, 'finalizado');
              }

              setStatus('finalizado');
              setEventData((prev) => ({ ...prev, fecha_termino: nowIso }));
              triggerHaptic('success');

              Alert.alert(
                'Evento Finalizado',
                'El evento ha sido cerrado exitosamente y archivado en el Historial.'
              );
            } catch (err: any) {
              triggerHaptic('warning');
              Alert.alert(
                'Error al finalizar',
                err?.message || 'No fue posible registrar el cierre del evento. Verifica tu conexión.'
              );
            } finally {
              setClosingEvent(false);
            }
          },
        },
      ]
    );
  };

  const isReadOnly = status === 'finalizado';

  const renderHeader = () => (
    <View style={styles.headerContentContainer}>
      {/* Tarjeta de Información General */}
      <View style={styles.infoCard}>
        {/* Fila de Estado */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              isReadOnly ? styles.statusBadgeFinalized : styles.statusBadgeActive,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isReadOnly ? colors.textMuted : colors.primaryLight },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isReadOnly ? colors.textMuted : colors.primaryLight },
              ]}
            >
              {isReadOnly ? 'FINALIZADO · SOLO LECTURA' : 'MONTAJE EN CURSO'}
            </Text>
          </View>

          <View style={styles.categoryPill}>
            <MaterialCommunityIcons
              name="party-popper"
              size={13}
              color={colors.primaryAmber}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.categoryText}>Operativo</Text>
          </View>
        </View>

        {/* Título y Recinto */}
        <Text style={styles.eventTitle}>{eventData.nombre}</Text>
        <View style={styles.venueRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={colors.primaryAmber}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.venueText}>{eventData.locacion}</Text>
        </View>

        {/* Ficha de Métricas Rápidas */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>SUPERFICIE</Text>
            <Text style={styles.metricValue}>
              {eventData.metros_cuadrados}{' '}
              <Text style={styles.metricUnit}>m²</Text>
            </Text>
            <Text style={styles.metricSub}>
              ≈ {Math.round(eventData.metros_cuadrados * 4)} palmetas
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>CONFIGURACIÓN</Text>
            <Text style={styles.metricValueSmall} numberOfLines={1}>
              {eventData.tipo_pantalla}
            </Text>
            <Text style={styles.metricSub}>Equipamiento principal</Text>
          </View>
        </View>
      </View>

      {/* Banner Informativo de Modo Solo Lectura (HU-16) */}
      {isReadOnly ? (
        <View style={styles.readOnlyBanner}>
          <Ionicons
            name="lock-closed"
            size={18}
            color={colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.readOnlyTitle}>Evento Concluido y Protegido</Text>
            <Text style={styles.readOnlyDesc}>
              Este evento se encuentra archivado. Las incidencias y el inventario están en modo de solo lectura.
            </Text>
          </View>
        </View>
      ) : (
        /* Acciones de Operación (Solo visibles si el evento está activo) */
        <View style={styles.actionsContainer}>
          {/* Botón Reportar Falla en Terreno (Abre Cámara Directa) */}
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => {
              triggerHaptic('medium');
              setIsScannerVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="warning-outline"
              size={18}
              color="#60A5FA"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.reportButtonText}>Reportar Falla en este Evento</Text>
          </TouchableOpacity>

          {/* Botón Rojo de Cierre: Finalizar Evento */}
          <TouchableOpacity
            style={styles.finalizeButton}
            onPress={handleConfirmFinalizeEvent}
            disabled={closingEvent}
            activeOpacity={0.8}
          >
            {closingEvent ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <View style={styles.finalizeInner}>
                <Ionicons
                  name="stop-circle-outline"
                  size={18}
                  color={colors.danger}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.finalizeText}>Finalizar Evento</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Encabezado de la Sección de Trazabilidad */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons
            name="list-outline"
            size={18}
            color="#60A5FA"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.sectionTitle}>
            Trazabilidad de Incidencias ({incidents.length})
          </Text>
        </View>

        {loadingIncidents && (
          <ActivityIndicator size="small" color="#60A5FA" />
        )}
      </View>
    </View>
  );

  const renderIncidentItem = ({ item }: { item: IncidentItem }) => {
    return (
      <View style={styles.incidentCard}>
        <View style={styles.incidentTopRow}>
          <View style={styles.incidentTag}>
            <Ionicons
              name="alert-circle"
              size={14}
              color={colors.warning}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.incidentTagText}>{item.tipo_falla}</Text>
          </View>

          <View style={styles.syncBadge}>
            <Ionicons
              name={item.is_local ? 'cloud-offline-outline' : 'cloud-done-outline'}
              size={12}
              color={item.is_local ? colors.warning : colors.success}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.syncBadgeText,
                { color: item.is_local ? colors.warning : colors.success },
              ]}
            >
              {item.is_local ? 'Local' : 'Cloud'}
            </Text>
          </View>
        </View>

        <View style={styles.incidentBody}>
          <View style={{ flex: 1 }}>
            <Text style={styles.incidentQrCode}>Palmeta QR: {item.qr_uuid}</Text>
            {item.observaciones ? (
              <Text style={styles.incidentObservations} numberOfLines={2}>
                "{item.observaciones}"
              </Text>
            ) : null}
            <Text style={styles.incidentDate}>
              Reportado: {new Date(item.fecha).toLocaleString('es-CL')}
            </Text>
          </View>

          {item.foto_url && (
            <Image source={{ uri: item.foto_url }} style={styles.incidentThumbnail} />
          )}
        </View>
      </View>
    );
  };

  const renderEmptyIncidents = () => {
    if (loadingIncidents) return null;
    return (
      <View style={styles.emptyIncidentsBox}>
        <Ionicons
          name="checkmark-done-circle-outline"
          size={44}
          color={colors.success}
        />
        <Text style={styles.emptyIncidentsTitle}>Sin incidencias reportadas</Text>
        <Text style={styles.emptyIncidentsSubtitle}>
          El montaje opera con normalidad y no presenta fallas registradas.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Barra de Navegación Superior Fija */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {eventData.nombre}
        </Text>

        <View style={styles.topBarRightPlaceholder} />
      </View>

      <FlatList
        data={incidents}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderIncidentItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyIncidents}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#60A5FA"
            colors={['#2563EB']}
          />
        }
      />

      {/* 1. Modal Escáner QR de Alta Velocidad (Camera-First) */}
      <IncidentScannerModal
        visible={isScannerVisible}
        eventName={eventData.nombre}
        onClose={() => setIsScannerVisible(false)}
        onScanSuccess={(code) => {
          setScannedQr(code);
          setIsScannerVisible(false);
          setIsReportModalVisible(true);
        }}
        onManualEntry={() => {
          setScannedQr(null);
          setIsScannerVisible(false);
          setIsReportModalVisible(true);
        }}
      />

      {/* 2. Modal de Formulario con Activo y Evento Vinculados */}
      <ReportIncidentModal
        visible={isReportModalVisible}
        qrUuid={scannedQr || undefined}
        eventoId={eventId}
        eventoNombre={eventData.nombre}
        onClose={() => {
          setIsReportModalVisible(false);
          setScannedQr(null);
        }}
        onRequestScan={() => {
          setIsReportModalVisible(false);
          setIsScannerVisible(true);
        }}
        onSuccess={() => {
          setIsReportModalVisible(false);
          setScannedQr(null);
          fetchIncidents();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
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
  topBarTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  topBarRightPlaceholder: {
    width: 38,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  headerContentContainer: {
    paddingTop: 16,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.14)',
    borderColor: 'rgba(234, 179, 8, 0.35)',
  },
  statusBadgeFinalized: {
    backgroundColor: 'rgba(113, 113, 122, 0.16)',
    borderColor: 'rgba(113, 113, 122, 0.35)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  venueText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  metricItem: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  metricValueSmall: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  metricUnit: {
    color: colors.primaryAmber,
    fontSize: 13,
    fontWeight: '600',
  },
  metricSub: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 42, 52, 0.45)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  readOnlyTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  readOnlyDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  actionsContainer: {
    marginBottom: 18,
    gap: 10,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  reportButtonText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700',
  },
  finalizeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  finalizeInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finalizeText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  incidentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  incidentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  incidentTagText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  incidentBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incidentQrCode: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  incidentObservations: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  incidentDate: {
    color: colors.textMuted,
    fontSize: 10,
  },
  incidentThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIncidentsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  emptyIncidentsTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 2,
  },
  emptyIncidentsSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
