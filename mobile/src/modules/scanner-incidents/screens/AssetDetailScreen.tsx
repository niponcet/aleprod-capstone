import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useEdgeInsets } from '../../../core/hooks/useEdgeInsets';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { triggerHaptic } from '../../../core/utils/haptics';
import { ConfirmModal } from '../../../core/components/ConfirmModal';
import { InfoModal } from '../../../core/components/InfoModal';
import { ReportIncidentModal } from '../components/ReportIncidentModal';
import { insertLocalIncidencia } from '../../../core/db/database';
import { decommissionPalmeta } from '../../../core/api/palmetas';
import { useToast } from '../../../core/context/ToastContext';
import { supabase } from '../../../core/api/supabase';
import { fetchHybridIncidents, UnifiedIncident } from '../../../core/api/incidencias';

export const AssetDetailScreen: React.FC = () => {
  const router = useRouter();
  const { insets } = useEdgeInsets();
  const params = useLocalSearchParams<{ uuid?: string; title?: string; status?: string }>();

  const rawUuid = params.uuid || 'TEST-QR-001';
  const initialStatus = params.status || '• Operativo';

  const { showToast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [decommissioning, setDecommissioning] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [helpModalVisible, setHelpModalVisible] = useState<boolean>(false);
  const [isDecommissionModalVisible, setDecommissionModalVisible] = useState<boolean>(false);
  const [incidents, setIncidents] = useState<UnifiedIncident[]>([]);
  const [assetMeta, setAssetMeta] = useState<{
    codigo_visible?: string;
    lote_ingreso?: string;
    estado?: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const displayTitle = assetMeta?.codigo_visible
    ? `Módulo #${assetMeta.codigo_visible}`
    : params.title || (rawUuid.length > 8 ? `Módulo #${rawUuid.slice(-4).toUpperCase()}` : `Módulo #${rawUuid}`);

  const loadData = useCallback(async () => {
    try {
      // 1. Obtener historial combinado de incidencias para este QR
      const allIncidents = await fetchHybridIncidents();
      const filtered = allIncidents.filter((item) => item.qr_uuid === rawUuid);
      setIncidents(filtered);

      // 2. Consultar metadata real de la palmeta en Supabase
      const { data, error } = await supabase
        .from('palmetas_led')
        .select('codigo_visible, lote_ingreso, estado')
        .eq('codigo_qr', rawUuid)
        .maybeSingle();

      if (!error && data) {
        setAssetMeta(data);
        if (data.estado) {
          const st = data.estado.toLowerCase();
          if (st === 'operativo') {
            setCurrentStatus('• Operativo');
          } else if (st === 'mantencion' || st === 'reparacion') {
            setCurrentStatus('• En Mantención');
          } else if (st === 'baja') {
            setCurrentStatus('• Dado de Baja');
          }
        }
      }
    } catch (err) {
      console.warn('Error cargando detalle del activo:', err);
    } finally {
      setLoading(false);
    }
  }, [rawUuid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDecommission = () => {
    triggerHaptic('warning');
    setDecommissionModalVisible(true);
  };

  const handleExecuteDecommission = async () => {
    setDecommissionModalVisible(false);
    // Optimistic UI: actualizar estado en pantalla inmediatamente
    const previousStatus = currentStatus;
    setCurrentStatus('• Dado de Baja');
    setDecommissioning(true);

    try {
      const result = await decommissionPalmeta(
        rawUuid,
        'Baja confirmada por técnico en terreno',
        'Festival Estadio Nacional'
      );

      if (result.mode === 'cloud') {
        showToast({
          type: 'success',
          title: 'ACTIVO DADO DE BAJA',
          message: 'Actualizado en tiempo real en Supabase.',
          code: rawUuid,
        });
      } else {
        showToast({
          type: 'offline',
          title: 'GUARDADO LOCALMENTE',
          message: 'Guardado localmente. Se sincronizará cuando haya conexión.',
          code: rawUuid,
        });
      }

      loadData();
    } catch (err: any) {
      console.error('Error durante la baja del activo:', err);
      setCurrentStatus(previousStatus);
      showToast({
        type: 'error',
        title: 'ERROR AL DAR DE BAJA',
        message: err?.message || 'No se pudo registrar la baja del activo.',
        code: rawUuid,
      });
    } finally {
      setDecommissioning(false);
    }
  };

  const isBaja = currentStatus.toLowerCase().includes('baja') || currentStatus.toLowerCase().includes('crítica');
  const isMantencion = currentStatus.toLowerCase().includes('mantención') || currentStatus.toLowerCase().includes('reparación');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Halo ambiental superior suave idéntico a Notificaciones */}
      <LinearGradient
        colors={['#000000', '#000000', 'rgba(29, 78, 216, 0.35)', 'rgba(37, 99, 235, 0.18)', 'transparent']}
        locations={[0, 0.22, 0.50, 0.78, 1]}
        style={styles.topAmbientGlow}
        pointerEvents="none"
      />

      {/* Header Superior Nativo */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop:
              Platform.OS === 'web'
                ? ('max(calc(env(safe-area-inset-top, 0px) + 12px), 20px)' as any)
                : insets.top + 12,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTexts}>
            <Text style={styles.headerOrgText}>Aleprod Terreno</Text>
            <Text style={styles.headerTitle}>Detalle de Activo</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setHelpModalVisible(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="help-circle-outline" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado del Activo (Hero Card) */}
        <View style={styles.assetHeroCard}>
          <View style={styles.assetTypeRow}>
            <Text style={styles.assetTypeMono}>MÓDULO LED P3.9</Text>
            <View
              style={[
                styles.statusBadge,
                isBaja
                  ? styles.statusBadgeDanger
                  : isMantencion
                  ? styles.statusBadgeWarning
                  : styles.statusBadgeSuccess,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isBaja
                    ? { color: colors.danger }
                    : isMantencion
                    ? { color: colors.warning }
                    : { color: colors.success },
                ]}
              >
                {currentStatus}
              </Text>
            </View>
          </View>

          <Text style={styles.assetTitle}>{displayTitle}</Text>

          <View style={styles.uuidBadge}>
            <Ionicons name="qr-code-outline" size={13} color="#60A5FA" style={{ marginRight: 6 }} />
            <Text style={styles.uuidText}>UUID: {rawUuid}</Text>
          </View>
        </View>

        {/* Card: Especificaciones del Activo */}
        <View style={styles.specsCard}>
          <View style={styles.specsHeaderRow}>
            <Text style={styles.specsHeaderTitle}>ESPECIFICACIONES DEL ACTIVO</Text>
            <View style={styles.loteBadge}>
              <Text style={styles.loteText}>Lote: {assetMeta?.lote_ingreso || 'LOTE-102026'}</Text>
            </View>
          </View>

          <View style={styles.specsGrid}>
            {/* Fila 1 */}
            <View style={styles.specsRow}>
              <View style={styles.specsColumn}>
                <Text style={styles.specsLabel}>Resolución / Pitch</Text>
                <View style={styles.specsValueRow}>
                  <View style={styles.specsIconCircle}>
                    <Ionicons name="hardware-chip-outline" size={15} color="#60A5FA" />
                  </View>
                  <Text style={styles.specsValue}>P3.9 In/Out</Text>
                </View>
              </View>

              <View style={styles.specsColumn}>
                <Text style={styles.specsLabel}>Dimensiones</Text>
                <View style={styles.specsValueRow}>
                  <View style={styles.specsIconCircle}>
                    <Ionicons name="scan-outline" size={15} color="#60A5FA" />
                  </View>
                  <Text style={styles.specsValue}>50 × 50 cm</Text>
                </View>
              </View>
            </View>

            {/* Fila 2 */}
            <View style={styles.specsRow}>
              <View style={styles.specsColumn}>
                <Text style={styles.specsLabel}>Ubicación actual</Text>
                <View style={styles.specsValueRow}>
                  <View style={styles.specsIconCircle}>
                    <Ionicons name="location-outline" size={15} color="#60A5FA" />
                  </View>
                  <Text style={styles.specsValue}>En Terreno / Bodega</Text>
                </View>
              </View>

              <View style={styles.specsColumn}>
                <Text style={styles.specsLabel}>Última mantención</Text>
                <View style={styles.specsValueRow}>
                  <View style={styles.specsIconCircle}>
                    <Ionicons name="calendar-outline" size={15} color="#60A5FA" />
                  </View>
                  <Text style={styles.specsValue}>
                    {incidents.length > 0 ? 'Con incidencias' : 'Al día'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Card: Historial Rápido */}
        <View style={styles.historyCard}>
          <View style={styles.specsHeaderRow}>
            <Text style={styles.specsHeaderTitle}>HISTORIAL RÁPIDO</Text>
            <Text style={styles.historyCountText}>
              {incidents.length} {incidents.length === 1 ? 'registro' : 'registros'}
            </Text>
          </View>

          {incidents.length > 0 ? (
            incidents.map((h) => {
              const isItemBaja = h.tipo_falla.toLowerCase().includes('baja') || h.tipo_falla.toLowerCase().includes('crítica');
              const isItemMant = h.tipo_falla.toLowerCase().includes('manten') || h.tipo_falla.toLowerCase().includes('apagado') || h.tipo_falla.toLowerCase().includes('falla');
              const iconColor = isItemBaja ? colors.danger : isItemMant ? colors.warning : colors.success;
              const iconName: keyof typeof Ionicons.glyphMap = isItemBaja
                ? 'close-circle-outline'
                : isItemMant
                ? 'warning-outline'
                : 'checkmark-circle-outline';

              return (
                <View key={`hist-${h.id}`} style={styles.historySubCard}>
                  <View style={[styles.historyIconBox, { backgroundColor: isItemBaja ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)' }]}>
                    <Ionicons name={iconName} size={18} color={iconColor} />
                  </View>
                  <View style={styles.historyContent}>
                    <View style={styles.historyTitleRow}>
                      <Text style={styles.historyTitle}>{h.tipo_falla}</Text>
                      <View style={styles.sourceTag}>
                        <Text style={styles.sourceTagText}>{h.is_local ? 'Local' : 'Cloud'}</Text>
                      </View>
                    </View>
                    <Text style={styles.historySubtitle} numberOfLines={1}>
                      {h.descripcion || 'Incidencia en terreno'} · {h.evento_nombre || 'Evento en curso'}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyHistoryBox}>
              <View style={styles.emptyHistoryIconCircle}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyHistoryTitle}>Sin incidencias reportadas</Text>
                <Text style={styles.emptyHistorySubtitle}>
                  Este módulo se encuentra operativo y no registra fallas técnicas ni intervenciones.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.fullHistoryLink}
            onPress={() => router.push('/activity-history')}
            activeOpacity={0.7}
          >
            <Text style={styles.fullHistoryLinkText}>Ver historial general &gt;</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Informativo */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#60A5FA" style={{ marginRight: 10 }} />
          <Text style={styles.infoBannerText}>
            Si este módulo presenta pixeles apagados o fallas en conector, repórtalo de inmediato para el recambio en bodega.
          </Text>
        </View>
      </ScrollView>

      {/* Barra Inferior Fija de Acciones Anclada (Edge-to-Edge) */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom:
              Platform.OS === 'web'
                ? ('calc(env(safe-area-inset-bottom, 0px) + 16px)' as any)
                : insets.bottom + 16,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.decommissionButton, decommissioning && { opacity: 0.6 }]}
          onPress={handleDecommission}
          disabled={decommissioning}
          activeOpacity={0.8}
        >
          {decommissioning ? (
            <ActivityIndicator size="small" color={colors.danger} style={{ marginRight: 6 }} />
          ) : (
            <Ionicons name="trash-outline" size={17} color={colors.danger} style={{ marginRight: 6 }} />
          )}
          <Text style={styles.decommissionButtonText}>
            {decommissioning ? 'Guardando...' : 'Dar de Baja'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="warning-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.reportButtonText}>Reportar Falla</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Reportar Falla (HU-11 y HU-12) */}
      <ReportIncidentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        qrUuid={rawUuid}
        onSuccess={() => {
          loadData();
          setCurrentStatus('• En Mantención');
        }}
      />

      {/* Modal de Ayuda de Uso del Módulo */}
      <InfoModal
        visible={helpModalVisible}
        title="Uso del Módulo"
        description="Desde esta pantalla puedes consultar las especificaciones técnicas del activo y su lote. Utiliza los botones inferiores para 'Dar de baja' el equipo en caso de falla crítica, o 'Reportar falla' para programar una mantención técnica."
        buttonText="Entendido"
        onClose={() => setHelpModalVisible(false)}
      />

      {/* Modal de Confirmación de Baja del Activo */}
      <ConfirmModal
        visible={isDecommissionModalVisible}
        title="Confirmar Baja del Activo"
        message={`¿Estás seguro de registrar la baja del módulo "${displayTitle}"?\n\nEsta acción registrará la baja física en el sistema y descontará el equipo del inventario operativo.`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        isDestructive={true}
        confirmLoading={decommissioning}
        onConfirm={handleExecuteDecommission}
        onCancel={() => setDecommissionModalVisible(false)}
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
    height: 220,
    zIndex: -1,
    ...Platform.select({
      web: {
        transform: [{ translateZ: 0 } as any],
      },
    }),
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTexts: {
    justifyContent: 'center',
  },
  headerOrgText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  helpButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  assetHeroCard: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  assetTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetTypeMono: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 20,
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  statusBadgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  assetTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  uuidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  uuidText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  specsCard: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  specsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  specsHeaderTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  loteBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  loteText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  specsGrid: {
    marginTop: 2,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  specsColumn: {
    flex: 1,
    minWidth: 0,
  },
  specsLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  specsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specsIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  specsValue: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
    flexShrink: 1,
  },
  historyCard: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  historyCountText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  historySubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141A28',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 11,
    marginBottom: 8,
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  historyContent: {
    flex: 1,
  },
  historyTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  sourceTag: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  sourceTagText: {
    color: '#60A5FA',
    fontSize: 9.5,
    fontWeight: '600',
  },
  historySubtitle: {
    color: '#94A3B8',
    fontSize: 11.5,
  },
  emptyHistoryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141A28',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.20)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  emptyHistoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  emptyHistorySubtitle: {
    color: '#94A3B8',
    fontSize: 11.5,
    lineHeight: 16,
  },
  fullHistoryLink: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  fullHistoryLinkText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.20)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#080C14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  decommissionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  decommissionButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  reportButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
