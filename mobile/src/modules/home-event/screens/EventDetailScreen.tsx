import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { useEdgeInsets } from '../../../core/hooks/useEdgeInsets';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../core/theme/colors';
import { LiquidGlassView } from '../../../core/components/LiquidGlassView';
import { triggerHaptic } from '../../../core/utils/haptics';
import { supabase } from '../../../core/api/supabase';
import {
  getLocalIncidenciasByEvento,
  updateLocalEventoEstado,
  LocalIncidencia,
} from '../../../core/db/database';
import { ConfirmModal } from '../../../core/components/ConfirmModal';
import { useToast } from '../../../core/context/ToastContext';
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
  const { insets } = useEdgeInsets();
  const router = useRouter();
  const { showToast } = useToast();
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
  const [isEndEventModalVisible, setEndEventModalVisible] = useState<boolean>(false);
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
        .select('*, centros_eventos(nombre)')
        .eq('id', eventId)
        .single();

      if (data && !error) {
        setEventData({
          nombre: data.nombre,
          locacion: (data.centros_eventos as any)?.nombre || data.locacion || 'Recinto no especificado',
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
    triggerHaptic('medium');
    setEndEventModalVisible(true);
  };

  const handleExecuteFinalizeEvent = async () => {
    setEndEventModalVisible(false);
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

      showToast({
        type: 'success',
        title: 'EVENTO FINALIZADO',
        message: 'El evento ha sido cerrado exitosamente y archivado en el Historial.',
      });
    } catch (err: any) {
      triggerHaptic('warning');
      showToast({
        type: 'error',
        title: 'ERROR AL FINALIZAR',
        message: err?.message || 'No fue posible registrar el cierre del evento. Verifica tu conexión.',
      });
    } finally {
      setClosingEvent(false);
    }
  };

  const isReadOnly = status === 'finalizado';

  const renderHeader = () => (
    <View style={styles.headerContentContainer}>
      {/* Tarjeta de Información General Glass */}
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
                { backgroundColor: isReadOnly ? '#94A3B8' : '#3B82F6' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isReadOnly ? '#94A3B8' : '#60A5FA' },
              ]}
            >
              {isReadOnly ? 'FINALIZADO · SOLO LECTURA' : 'MONTAJE EN CURSO'}
            </Text>
          </View>

          <View style={styles.categoryPill}>
            <Ionicons
              name="flash"
              size={11}
              color="#60A5FA"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.categoryText}>Producción Activa</Text>
          </View>
        </View>

        {/* Título y Recinto */}
        <Text style={styles.eventTitle}>{eventData.nombre}</Text>
        <View style={styles.venueRow}>
          <Ionicons
            name="location-sharp"
            size={15}
            color="#60A5FA"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.venueText}>{eventData.locacion}</Text>
        </View>

        {/* Ficha de Métricas Rápidas en Cuadrícula Dark Navy Glass */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <View style={styles.metricHeaderRow}>
              <Ionicons name="scan-outline" size={13} color="#60A5FA" style={{ marginRight: 4 }} />
              <Text style={styles.metricLabel}>SUPERFICIE</Text>
            </View>
            <Text style={styles.metricValue}>
              {eventData.metros_cuadrados}{' '}
              <Text style={styles.metricUnit}>m²</Text>
            </Text>
            <Text style={styles.metricSub}>
              ≈ {Math.round(eventData.metros_cuadrados * 4)} palmetas LED
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <View style={styles.metricHeaderRow}>
              <Ionicons name="grid-outline" size={13} color="#60A5FA" style={{ marginRight: 4 }} />
              <Text style={styles.metricLabel}>FORMATO</Text>
            </View>
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
          <View style={styles.lockIconCircle}>
            <Ionicons
              name="lock-closed"
              size={16}
              color="#94A3B8"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.readOnlyTitle}>Evento Concluido y Protegido</Text>
            <Text style={styles.readOnlyDesc}>
              Este evento se encuentra archivado en el historial. Las incidencias y el inventario están en modo de solo lectura.
            </Text>
          </View>
        </View>
      ) : (
        /* Acciones de Operación (Solo visibles si el evento está activo) */
        <View style={styles.actionsContainer}>
          {/* Botón Principal Gradiente: Reportar Falla en Terreno */}
          <TouchableOpacity
            style={styles.reportButtonWrapper}
            onPress={() => {
              triggerHaptic('medium');
              setIsScannerVisible(true);
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.reportButtonGradient}
            >
              <Ionicons
                name="camera-outline"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.reportButtonText}>Escanear y Reportar Falla</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Botón de Cierre: Finalizar Evento */}
          <TouchableOpacity
            style={styles.finalizeButton}
            onPress={handleConfirmFinalizeEvent}
            disabled={closingEvent}
            activeOpacity={0.8}
          >
            {closingEvent ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <View style={styles.finalizeInner}>
                <Ionicons
                  name="stop-circle-outline"
                  size={16}
                  color="#EF4444"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.finalizeText}>Finalizar Montaje</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Encabezado de la Sección de Trazabilidad */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionIconCircle}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#60A5FA"
            />
          </View>
          <Text style={styles.sectionTitle}>
            Trazabilidad de Incidencias
          </Text>
        </View>

        <View style={styles.incidentsCountPill}>
          <Text style={styles.incidentsCountText}>{incidents.length}</Text>
        </View>
      </View>
    </View>
  );

  const renderIncidentItem = ({ item }: { item: IncidentItem }) => {
    return (
      <View style={styles.incidentCard}>
        <View style={styles.incidentTopRow}>
          <View style={styles.incidentTag}>
            <Ionicons
              name="alert-circle-outline"
              size={13}
              color="#F59E0B"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.incidentTagText}>{item.tipo_falla}</Text>
          </View>

          <View style={styles.syncBadge}>
            <Ionicons
              name={item.is_local ? 'cloud-offline-outline' : 'cloud-done-outline'}
              size={11}
              color={item.is_local ? '#F59E0B' : '#10B981'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.syncBadgeText,
                { color: item.is_local ? '#F59E0B' : '#10B981' },
              ]}
            >
              {item.is_local ? 'Local' : 'Cloud'}
            </Text>
          </View>
        </View>

        <View style={styles.incidentBody}>
          <View style={{ flex: 1 }}>
            <View style={styles.qrCodeBadge}>
              <Ionicons name="qr-code" size={13} color="#60A5FA" style={{ marginRight: 6 }} />
              <Text style={styles.incidentQrCode} numberOfLines={1}>{item.qr_uuid}</Text>
            </View>
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
        <View style={styles.emptyIconCircle}>
          <Ionicons
            name="checkmark-circle-outline"
            size={36}
            color="#10B981"
          />
        </View>
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

      {/* Halo ambiental superior suave idéntico a Notificaciones y Agenda */}
      <LinearGradient
        colors={['#000000', '#000000', 'rgba(29, 78, 216, 0.35)', 'rgba(37, 99, 235, 0.18)', 'transparent']}
        locations={[0, 0.22, 0.50, 0.78, 1]}
        style={styles.topAmbientGlow}
        pointerEvents="none"
      />

      {/* Barra de Navegación Superior Fija */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop:
              Platform.OS === 'web'
                ? ('max(calc(env(safe-area-inset-top, 0px) + 12px), 20px)' as any)
                : insets.top + 12,
          },
        ]}
      >
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              triggerHaptic('light');
              router.back();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.topBarTexts}>
            <Text style={styles.topBarSubtitle}>Aleprod Terreno</Text>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {eventData.nombre}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.headerStatusBadge,
            isReadOnly ? styles.headerStatusBadgeFinalized : styles.headerStatusBadgeActive,
          ]}
        >
          <View
            style={[
              styles.headerStatusDot,
              { backgroundColor: isReadOnly ? '#94A3B8' : '#3B82F6' },
            ]}
          />
          <Text
            style={[
              styles.headerStatusText,
              { color: isReadOnly ? '#94A3B8' : '#60A5FA' },
            ]}
          >
            {isReadOnly ? 'FINALIZADO' : 'EN CURSO'}
          </Text>
        </View>
      </View>

      <FlatList
        data={incidents}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderIncidentItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyIncidents}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom:
              Platform.OS === 'web'
                ? ('calc(env(safe-area-inset-bottom, 0px) + 40px)' as any)
                : insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#60A5FA"
              colors={['#2563EB']}
            />
          ) : undefined
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

      {/* 3. Modal de Confirmación de Cierre de Evento */}
      <ConfirmModal
        visible={isEndEventModalVisible}
        title="Finalizar Evento"
        message="¿Estás seguro de que deseas dar por finalizado este montaje? Esta acción bloqueará el registro de nuevas incidencias para este evento."
        confirmText="Finalizar"
        cancelText="Cancelar"
        isDestructive={true}
        confirmLoading={closingEvent}
        onConfirm={handleExecuteFinalizeEvent}
        onCancel={() => setEndEventModalVisible(false)}
      />
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    zIndex: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
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
    marginRight: 12,
  },
  topBarTexts: {
    flex: 1,
  },
  topBarSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerStatusBadgeActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  headerStatusBadgeFinalized: {
    backgroundColor: 'rgba(100, 116, 139, 0.14)',
    borderColor: 'rgba(100, 116, 139, 0.25)',
  },
  headerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  headerStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
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
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  statusBadgeFinalized: {
    backgroundColor: 'rgba(100, 116, 139, 0.14)',
    borderColor: 'rgba(100, 116, 139, 0.25)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    color: '#60A5FA',
    fontSize: 10.5,
    fontWeight: '600',
  },
  eventTitle: {
    color: '#FFFFFF',
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
    color: '#94A3B8',
    fontSize: 13.5,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#0F1422',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 14,
  },
  metricItem: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 12,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  metricValueSmall: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  metricUnit: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
  },
  metricSub: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 2,
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  lockIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  readOnlyTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  readOnlyDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  actionsContainer: {
    marginBottom: 18,
    gap: 10,
  },
  reportButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  finalizeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 11,
    borderRadius: 12,
  },
  finalizeInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finalizeText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  incidentsCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  incidentsCountText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
  },
  incidentCard: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
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
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  incidentTagText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
  qrCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  incidentQrCode: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  incidentObservations: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
    lineHeight: 16,
  },
  incidentDate: {
    color: '#64748B',
    fontSize: 10.5,
  },
  incidentThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyIncidentsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: '#121620',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyIncidentsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyIncidentsSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
