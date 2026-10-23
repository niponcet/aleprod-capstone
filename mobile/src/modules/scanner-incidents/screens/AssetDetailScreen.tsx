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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { ReportIncidentModal } from '../components/ReportIncidentModal';
import { insertLocalIncidencia } from '../../../core/db/database';
import { supabase } from '../../../core/api/supabase';
import { fetchHybridIncidents, UnifiedIncident } from '../../../core/api/incidencias';

export const AssetDetailScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ uuid?: string; title?: string; status?: string }>();

  const rawUuid = params.uuid || 'TEST-QR-001';
  const initialStatus = params.status || '• Operativo';

  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
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
    Alert.alert(
      'Confirmar Baja del Activo',
      `¿Estás seguro de registrar la baja del módulo "${displayTitle}"?\n\nEsta acción registrará la baja física en el SQLite local y se sincronizará con la bodega central de Supabase.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Dar de Baja',
          style: 'destructive',
          onPress: () => {
            try {
              insertLocalIncidencia(
                rawUuid,
                'Falla Crítica - Dado de Baja',
                undefined,
                'Baja confirmada por técnico en terreno',
                'Festival Estadio Nacional'
              );
              setCurrentStatus('• Dado de Baja');
              loadData();
              Alert.alert('Activo Actualizado', 'El módulo ha sido registrado como "Dado de baja".');
            } catch {
              Alert.alert('Error', 'No se pudo guardar la baja en el almacenamiento local.');
            }
          },
        },
      ]
    );
  };

  const isBaja = currentStatus.toLowerCase().includes('baja') || currentStatus.toLowerCase().includes('crítica');
  const isMantencion = currentStatus.toLowerCase().includes('mantención') || currentStatus.toLowerCase().includes('reparación');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.backgroundDark} />

      {/* Header Superior */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Detalle de Activo</Text>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() =>
            Alert.alert(
              'Opciones de Palmeta',
              `UUID: ${rawUuid}\nEstado: ${currentStatus}\nEventos previos: 4`,
              [{ text: 'Cerrar' }]
            )
          }
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado del Activo */}
        <View style={styles.assetHeader}>
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

          <View style={styles.uuidRow}>
            <Ionicons name="qr-code-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.uuidText}>UUID: {rawUuid}</Text>
          </View>
        </View>

        {/* Card: Especificaciones del Activo */}
        <View style={styles.specsCard}>
          <View style={styles.specsHeaderRow}>
            <Text style={styles.specsHeaderTitle}>ESPECIFICACIONES DEL ACTIVO</Text>
            <Text style={styles.loteText}>Lote: {assetMeta?.lote_ingreso || 'LOTE-102026'}</Text>
          </View>

          <View style={styles.specsGrid}>
            {/* Fila 1 */}
            <View style={styles.specsRow}>
              <View style={styles.specsColumn}>
                <Text style={styles.specsLabel}>Resolución / Pitch</Text>
                <View style={styles.specsValueRow}>
                  <Ionicons name="hardware-chip-outline" size={16} color="#8E95A2" style={{ marginRight: 6 }} />
                  <Text style={styles.specsValue}>P3.9 Indoor/Outdoor</Text>
                </View>
              </View>

              <View style={styles.specsColumn}>
                <Text style={styles.specsLabel}>Dimensiones</Text>
                <View style={styles.specsValueRow}>
                  <Ionicons name="scan-outline" size={16} color="#8E95A2" style={{ marginRight: 6 }} />
                  <Text style={styles.specsValue}>50 × 50 cm (0.25 m²)</Text>
                </View>
              </View>
            </View>

            {/* Fila 2 */}
            <View style={styles.specsRow}>
              <View style={styles.specsColumn}>
                <Text style={styles.specsLabel}>Ubicación actual</Text>
                <View style={styles.specsValueRow}>
                  <Ionicons name="location-outline" size={16} color="#8E95A2" style={{ marginRight: 6 }} />
                  <Text style={styles.specsValue}>Bodega Central / En Terreno</Text>
                </View>
              </View>

              <View style={styles.specsColumn}>
                <Text style={styles.specsLabel}>Última mantención</Text>
                <View style={styles.specsValueRow}>
                  <Ionicons name="calendar-outline" size={16} color="#8E95A2" style={{ marginRight: 6 }} />
                  <Text style={styles.specsValue}>
                    {incidents.length > 0 ? 'Con incidencias' : 'Sin mantenciones'}
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
              {incidents.length} {incidents.length === 1 ? 'registro previo' : 'registros previos'}
            </Text>
          </View>

          {incidents.length > 0 ? (
            incidents.map((h) => {
              const isBaja = h.tipo_falla.toLowerCase().includes('baja') || h.tipo_falla.toLowerCase().includes('crítica');
              const isMant = h.tipo_falla.toLowerCase().includes('manten') || h.tipo_falla.toLowerCase().includes('apagado') || h.tipo_falla.toLowerCase().includes('falla');
              const iconColor = isBaja ? colors.danger : isMant ? colors.warning : colors.success;
              const iconName: keyof typeof Ionicons.glyphMap = isBaja
                ? 'close-circle-outline'
                : isMant
                ? 'warning-outline'
                : 'checkmark-circle-outline';

              return (
                <View key={`hist-${h.id}`} style={styles.historySubCard}>
                  <View style={[styles.historyIconBox, { backgroundColor: isBaja ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                    <Ionicons name={iconName} size={18} color={iconColor} />
                  </View>
                  <View style={styles.historyContent}>
                    <View style={styles.historyTitleRow}>
                      <Text style={styles.historyTitle}>{h.tipo_falla}</Text>
                      <Text style={styles.historyDate}>{h.is_local ? 'Local' : 'Cloud'}</Text>
                    </View>
                    <Text style={styles.historySubtitle}>
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
          <Ionicons name="information-circle-outline" size={20} color="#8E95A2" style={{ marginRight: 10 }} />
          <Text style={styles.infoBannerText}>
            Si este módulo presenta pixeles apagados o fallas en conector, repórtalo de inmediato para el recambio en bodega.
          </Text>
        </View>
      </ScrollView>

      {/* Barra Inferior Fija de Acciones (2 botones mitad y mitad) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.decommissionButton}
          onPress={handleDecommission}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} style={{ marginRight: 6 }} />
          <Text style={styles.decommissionButtonText}>Dar de Baja</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="warning-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundDark,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  moreButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  assetHeader: {
    marginBottom: 20,
  },
  assetTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetTypeMono: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusBadgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  assetTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  uuidRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uuidText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  specsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  specsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  specsHeaderTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  loteText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  specsGrid: {
    marginTop: 4,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 14,
  },
  specsColumn: {
    flex: 1,
    minWidth: 0,
  },
  specsLabel: {
    color: '#8E95A2',
    fontSize: 12,
    marginBottom: 6,
  },
  specsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specsValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    flexShrink: 1,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  historyCountText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  historySubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E222B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  historyTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  historyDate: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  historySubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  emptyHistoryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  emptyHistorySubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  fullHistoryLink: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  fullHistoryLinkText: {
    color: colors.primaryAmber,
    fontSize: 13,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12151B',
    borderWidth: 1,
    borderColor: '#262A34',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoBannerText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  decommissionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  decommissionButtonText: {
    color: colors.danger,
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
    backgroundColor: colors.primaryAmber,
    shadowColor: colors.primaryAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  reportButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
});
