import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { LiquidGlassView } from '../../../core/components/LiquidGlassView';
import { getRecentActivity, LocalIncidencia } from '../../../core/db/database';
import { TAB_OFFSET } from '../../../core/constants/navigation';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [realIncidencias, setRealIncidencias] = useState<LocalIncidencia[]>([]);

  // Recargar datos locales cada vez que el usuario regresa a la pantalla
  useFocusEffect(
    useCallback(() => {
      const records = getRecentActivity(5);
      setRealIncidencias(records);
    }, [])
  );

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
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header Superior Fijo — Respetando safe area y Dynamic Island / Notch */}
      <View style={[styles.fixedHeaderContainer, { top: insets.top + 10 }]}>
        <LiquidGlassView borderRadius={16} intensity={85} style={styles.headerCard}>
          <View style={styles.headerProfile}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>AP</Text>
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.headerOrgText}>Aleprod Terreno</Text>
              <Text style={styles.headerUserText}>Hola, Técnico</Text>
            </View>
          </View>

          <View style={styles.syncBadge}>
            <Ionicons name="cloud-done-outline" size={15} color={colors.success} style={{ marginRight: 5 }} />
            <Text style={styles.syncBadgeText}>Sincronizado</Text>
          </View>
        </LiquidGlassView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card: Montaje Activo */}
        <View style={styles.activeMountCard}>
          <View style={styles.activeMountTopRow}>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>MONTAJE ACTIVO</Text>
            </View>
            <View style={styles.locationPill}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.locationPillText}>Escenario A</Text>
            </View>
          </View>

          <Text style={styles.eventTitle}>Festival Estadio Nacional</Text>

          <View style={styles.cardDivider} />

          <View style={styles.activeMountBottomRow}>
            <Text style={styles.metersLabel}>Metros utilizados</Text>
            <Text style={styles.metersValue}>
              <Text style={styles.metersValueBold}>50 m²</Text> / 50 m²
            </Text>
          </View>
        </View>

        {/* Sección: Estado de Equipos */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Estado de equipos</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>Total: 140 m²</Text>
            </View>
          </View>

          {/* Card Principal — Operativos Disponibles */}
          <View style={styles.mainStatusCard}>
            <View style={styles.statusCardHeader}>
              <View style={styles.statusIconAndName}>
                <View style={styles.checkIconBox}>
                  <Ionicons name="checkmark-sharp" size={18} color={colors.success} />
                </View>
                <View>
                  <Text style={styles.statusCategoryLabel}>Operativos disponibles</Text>
                  <Text style={styles.statusMainValue}>70 m²</Text>
                </View>
              </View>

              <View style={styles.statusRightBadgeGroup}>
                <View style={styles.palmetasCountBadge}>
                  <Text style={styles.palmetasCountText}>140 palmetas</Text>
                </View>
                <Text style={styles.statusPercentageText}>50.0% disponible</Text>
              </View>
            </View>

            {/* Barra de progreso horizontal */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: '50%' }]} />
            </View>
          </View>

          {/* Grid de 2 Cards: En Mantención y Dados de Baja */}
          <View style={styles.gridRow}>
            {/* Card Izquierda: En Mantención */}
            <View style={[styles.gridCard, { marginRight: 8 }]}>
              <View style={styles.gridCardHeader}>
                <View style={styles.gridIconBox}>
                  <Ionicons name="build-outline" size={16} color={colors.warning} />
                </View>
                <View style={styles.revisionBadge}>
                  <Text style={styles.revisionBadgeText}>Revisión</Text>
                </View>
              </View>

              <Text style={styles.gridCardLabel}>En mantención</Text>
              <Text style={styles.gridCardValue}>15 m²</Text>

              <View style={styles.gridCardFooter}>
                <Ionicons name="warning-outline" size={13} color={colors.warning} style={{ marginRight: 4 }} />
                <Text style={styles.gridFooterAmber}>30 palmetas</Text>
              </View>
            </View>

            {/* Card Derecha: Dados de Baja */}
            <View style={[styles.gridCard, { marginLeft: 8 }]}>
              <View style={styles.gridCardHeader}>
                <View style={styles.gridIconBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                </View>
                <View style={styles.bajaBadge}>
                  <Text style={styles.bajaBadgeText}>Baja</Text>
                </View>
              </View>

              <Text style={styles.gridCardLabel}>Dados de baja</Text>
              <Text style={styles.gridCardValue}>5 m²</Text>

              <View style={styles.gridCardFooter}>
                <Ionicons name="close-circle-outline" size={13} color={colors.danger} style={{ marginRight: 4 }} />
                <Text style={styles.gridFooterRed}>10 palmetas</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sección: Actividad Reciente */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividad reciente</Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Historial Completo',
                  `Hay un total de ${realIncidencias.length} escaneos locales registrados en este dispositivo.`
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.historyLinkText}>Historial &gt;</Text>
            </TouchableOpacity>
          </View>

          {/* Registros Reales de SQLite (si existen) */}
          {realIncidencias.map((item) => {
            const shortCode = item.qr_uuid.length > 8 ? item.qr_uuid.slice(-4).toUpperCase() : item.qr_uuid;
            const itemStatus = item.tipo_falla?.toLowerCase().includes('baja')
              ? '• Dado de Baja'
              : item.tipo_falla?.toLowerCase().includes('mantención')
                ? '• En Mantención'
                : '• Operativo';

            return (
              <TouchableOpacity
                key={`real-${item.id}`}
                style={styles.activityCard}
                onPress={() =>
                  handlePalmetaPress(
                    item.qr_uuid,
                    `Palmeta #${shortCode}`,
                    itemStatus
                  )
                }
                activeOpacity={0.8}
              >
                <View style={[styles.activityIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons name="qr-code-outline" size={18} color={colors.success} />
                </View>

                <View style={styles.activityDetails}>
                  <View style={styles.activityTitleRow}>
                    <Text style={styles.activityTitle}>Palmeta #{shortCode}</Text>
                    <Text style={styles.activityTime}>{formatTimeAgo(item.fecha)}</Text>
                  </View>
                  <Text style={styles.activitySubtitle} numberOfLines={1}>
                    {item.tipo_falla || 'Escaneo en terreno'} · {item.sincronizado ? 'Sync OK' : 'Local'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Registros de Referencia del Diseño Oficial */}
          <TouchableOpacity
            style={styles.activityCard}
            onPress={() =>
              handlePalmetaPress(
                'aleprod-p39-0045-cl',
                'Palmeta #A45',
                '• Dado de Baja'
              )
            }
            activeOpacity={0.8}
          >
            <View style={[styles.activityIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
            </View>

            <View style={styles.activityDetails}>
              <View style={styles.activityTitleRow}>
                <Text style={styles.activityTitle}>Palmeta #A45</Text>
                <Text style={styles.activityTime}>Hace 12 min</Text>
              </View>
              <Text style={[styles.activitySubtitle, { color: colors.danger }]} numberOfLines={1}>
                Dada de baja por conector roto
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.activityCard}
            onPress={() =>
              handlePalmetaPress(
                'aleprod-p39-0012-cl',
                'Palmeta #B12',
                '• Operativo'
              )
            }
            activeOpacity={0.8}
          >
            <View style={[styles.activityIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            </View>

            <View style={styles.activityDetails}>
              <View style={styles.activityTitleRow}>
                <Text style={styles.activityTitle}>Palmeta #B12</Text>
                <Text style={styles.activityTime}>Hace 35 min</Text>
              </View>
              <Text style={[styles.activitySubtitle, { color: colors.success }]} numberOfLines={1}>
                Escaneada · Operativa OK
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
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
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },
  headerTexts: {
    justifyContent: 'center',
  },
  headerOrgText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  headerUserText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 1,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  syncBadgeText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  activeMountCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
  },
  activeMountTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeTag: {
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    color: colors.primaryAmber,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  locationPillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  activeMountBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metersLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  metersValue: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  metersValueBold: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  totalBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalBadgeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  mainStatusCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  statusIconAndName: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#262A34',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusCategoryLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  statusMainValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  statusRightBadgeGroup: {
    alignItems: 'flex-end',
  },
  palmetasCountBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  palmetasCountText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  statusPercentageText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#262A34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revisionBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  revisionBadgeText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '700',
  },
  bajaBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bajaBadgeText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '700',
  },
  gridCardLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  gridCardValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 8,
  },
  gridCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridFooterAmber: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  gridFooterRed: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  historyLinkText: {
    color: colors.primaryAmber,
    fontSize: 13,
    fontWeight: '600',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  activityIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    marginBottom: 3,
  },
  activityTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  activityTime: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  activitySubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
