import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { getTotalPendingSyncCount } from '../../../core/db/database';
import { syncAllPendingData } from '../../../core/api/sync';
import { supabase } from '../../../core/api/supabase';
import { triggerHaptic } from '../../../core/utils/haptics';
import { TAB_OFFSET } from '../../../core/constants/navigation';

interface SettingsScreenProps {
  onSignOut?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onSignOut }) => {
  const { width: screenWidth } = useWindowDimensions();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('tecnico@aleprod.cl');
  const [userName, setUserName] = useState<string>('Técnico Terreno');

  // Obtener conteo consolidado de pendientes cada vez que la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      const count = getTotalPendingSyncCount();
      setPendingCount(count);
    }, [])
  );

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
        try {
          const { data: profile } = await supabase
            .from('perfiles')
            .select('nombre_completo')
            .eq('id', user.id)
            .single();
          if (profile?.nombre_completo) {
            setUserName(profile.nombre_completo);
          }
        } catch { }
      }
    }).catch(() => { });
  }, []);

  // HU-14 y HU-13: Motor de Sincronización Real con Supabase Cloud y Storage
  const handleSyncNow = async () => {
    if (pendingCount === 0) {
      Alert.alert(
        'Almacenamiento Sincronizado',
        'No hay registros pendientes de envío. Todos los reportes y palmetas locales ya están respaldados en la nube.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    setSyncing(true);
    triggerHaptic('medium');

    try {
      const { incidencias, palmetas } = await syncAllPendingData();
      const remaining = getTotalPendingSyncCount();
      setPendingCount(remaining);

      const totalSynced = incidencias.syncedCount + palmetas.syncedCount;
      const totalFailed = incidencias.failedCount + palmetas.failedCount;

      if (totalSynced > 0 || palmetas.duplicateCount > 0) {
        triggerHaptic('success');
        const photoMsg = incidencias.photosUploaded > 0
          ? `\n\n📸 Fotografías respaldadas: ${incidencias.photosUploaded} en Supabase Storage.`
          : '';
        const palmetasMsg = palmetas.syncedCount > 0
          ? `\n📦 Palmetas aprovisionadas: ${palmetas.syncedCount} activas.`
          : '';
        const dupMsg = palmetas.duplicateCount > 0
          ? `\nℹ️ ${palmetas.duplicateCount} palmeta(s) ya existían previamente en la nube.`
          : '';

        if (totalFailed === 0) {
          Alert.alert(
            'Sincronización Exitosa',
            `Se respaldaron con éxito todos los datos:${palmetasMsg}\n📋 Incidencias: ${incidencias.syncedCount}.${photoMsg}${dupMsg}`,
            [{ text: 'Excelente' }]
          );
        } else {
          Alert.alert(
            'Sincronización Parcial',
            `Se respaldaron ${totalSynced} registro(s), pero ${totalFailed} no pudieron subirse.${palmetasMsg}${photoMsg}\n\nLos registros pendientes se mantienen seguros en SQLite para el próximo reintento.`,
            [{ text: 'Entendido' }]
          );
        }
      } else {
        triggerHaptic('warning');
        Alert.alert(
          'Sin Conexión con Supabase',
          'No fue posible contactar la nube. Tus datos permanecen almacenados localmente de forma segura en SQLite.',
          [{ text: 'Entendido' }]
        );
      }
    } catch (err: any) {
      triggerHaptic('warning');
      console.warn('Excepción sincronizando:', err);
      Alert.alert(
        'Aviso de Red',
        'Ocurrió un error al contactar el servidor. Los datos continuarán seguros en el dispositivo.',
        [{ text: 'Entendido' }]
      );
    } finally {
      setSyncing(false);
    }
  };


  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de la aplicación de terreno?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch { }
            onSignOut?.();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { width: screenWidth, marginLeft: TAB_OFFSET }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Título Superior Centrado */}
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>Configuración</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card de Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {userName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'TT'}
            </Text>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{userName}</Text>
              <View style={styles.terrenoBadge}>
                <Text style={styles.terrenoBadgeText}>Terreno</Text>
              </View>
            </View>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>
        </View>

        {/* Sección: Almacenamiento Local (SQLite) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>ALMACENAMIENTO LOCAL (SQLITE)</Text>

          <View style={styles.storageCard}>
            {/* Cabecera Storage */}
            <View style={styles.storageHeaderRow}>
              <View style={styles.offlineStatusGroup}>
                <View style={styles.greenStatusDot} />
                <Text style={styles.offlineStatusText}>Modo Offline Activo</Text>
              </View>
              <Text style={styles.dbVersionText}>DB: sqlite.v2</Text>
            </View>

            {/* Sub-card de Registros Pendientes */}
            <View style={styles.pendingSubCard}>
              <View style={styles.pendingLeftGroup}>
                <View style={styles.cloudIconCircle}>
                  <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
                </View>
                <Text style={styles.pendingCountText}>
                  {pendingCount} {pendingCount === 1 ? 'registro pendiente' : 'registros pendientes'} de envío
                </Text>
              </View>

              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>PENDIENTE</Text>
              </View>
            </View>

            {/* Botón Sincronizar Ahora */}
            <TouchableOpacity
              style={[styles.syncButton, syncing && { opacity: 0.7 }]}
              onPress={handleSyncNow}
              disabled={syncing}
              activeOpacity={0.8}
            >
              {syncing ? (
                <ActivityIndicator size="small" color={colors.textPrimary} style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="refresh-outline" size={18} color={colors.textPrimary} style={{ marginRight: 8 }} />
              )}
              <Text style={styles.syncButtonText}>
                {syncing ? 'Sincronizando con Supabase...' : 'Sincronizar Ahora'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección: Opciones Generales */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>OPCIONES GENERALES</Text>

          <View style={styles.optionsGroup}>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() =>
                Alert.alert(
                  'Historial de Actividad',
                  'Mostrando registros consolidados en memoria local SQLite y respaldos en la nube.'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.optionLeftGroup}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} style={styles.optionIcon} />
                <Text style={styles.optionLabel}>Historial de Actividad</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() =>
                Alert.alert(
                  'Manual de Usuario Terreno',
                  'Regla de los 3 Taps:\n1. Apunta y escanea el código QR.\n2. Toca el tipo de incidencia detectada.\n3. Presiona confirmar reporte.'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.optionLeftGroup}>
                <Ionicons name="book-outline" size={20} color={colors.textSecondary} style={styles.optionIcon} />
                <Text style={styles.optionLabel}>Manual de Usuario</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() =>
                Alert.alert(
                  'Soporte Técnico',
                  'Mesa de Ayuda Alejandra Producciones:\nCorreo: soporte@aleprod.cl\nTeléfono Terreno: +56 9 8765 4321'
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.optionLeftGroup}>
                <Ionicons name="headset-outline" size={20} color={colors.textSecondary} style={styles.optionIcon} />
                <Text style={styles.optionLabel}>Soporte Técnico</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón Cerrar Sesión */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Versión y Build */}
        <Text style={styles.versionText}>Aleprod Móvil · Versión 1.2.4 (Build 2026.09)</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundDark,
  },
  topHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E232D',
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileAvatarText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  profileDetails: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  terrenoBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  terrenoBadgeText: {
    color: colors.primaryAmber,
    fontSize: 11,
    fontWeight: '700',
  },
  profileEmail: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  storageCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  storageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  offlineStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 8,
  },
  offlineStatusText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  dbVersionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pendingSubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  pendingLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cloudIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pendingCountText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#262A34',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    height: 46,
  },
  syncButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  optionsGroup: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  optionLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  optionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 14,
    height: 48,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  versionText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
