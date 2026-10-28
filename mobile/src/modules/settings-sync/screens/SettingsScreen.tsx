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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../core/theme/colors';
import {
  getTotalPendingSyncCount,
  clearAllLocalIncidencias,
  clearAllPendingPalmetas,
} from '../../../core/db/database';
import { syncAllPendingData } from '../../../core/api/sync';
import { supabase } from '../../../core/api/supabase';
import { triggerHaptic } from '../../../core/utils/haptics';
import { TAB_OFFSET } from '../../../core/constants/navigation';

interface SettingsScreenProps {
  onSignOut?: () => void | Promise<void>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onSignOut }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    const executeLogout = async () => {
      try {
        await onSignOut?.();
      } catch (err) {
        console.warn('Error ejecutando cierre de sesión:', err);
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Cerrar Sesión\n\n¿Estás seguro de que deseas salir de la aplicación de terreno?'
      );
      if (confirmed) {
        executeLogout();
      }
      return;
    }

    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de la aplicación de terreno?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: executeLogout,
        },
      ]
    );
  };

  const headerTopPadding = Math.max(insets.top, 20);

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

      {/* Header Superior con Logo de Tuerca y Título Ajustes (sin acciones adicionales) */}
      <View style={[styles.headerContainer, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerProfile}>
          <View style={styles.gearIconCircle}>
            <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.headerOrgText}>Aleprod Terreno</Text>
            <Text style={styles.headerUserText}>Ajustes</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
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
                <View
                  style={[
                    styles.cloudIconCircle,
                    pendingCount === 0 && styles.cloudIconCircleSynced,
                  ]}
                >
                  <Ionicons
                    name={pendingCount > 0 ? 'cloud-offline-outline' : 'cloud-done-outline'}
                    size={18}
                    color={pendingCount > 0 ? '#F59E0B' : '#10B981'}
                  />
                </View>
                <Text style={styles.pendingCountText}>
                  {pendingCount} {pendingCount === 1 ? 'registro pendiente' : 'registros pendientes'} de envío
                </Text>
              </View>

              <View style={styles.pendingBadge}>
                <View
                  style={[
                    styles.pendingBadgeDot,
                    { backgroundColor: pendingCount === 0 ? '#10B981' : '#F59E0B' },
                  ]}
                />
                <Text style={styles.pendingBadgeText}>
                  {pendingCount > 0 ? 'PENDIENTE' : 'AL DÍA'}
                </Text>
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
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
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
              onPress={() => {
                triggerHaptic('selection');
                router.push('/activity-history');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeftGroup}>
                <Ionicons name="time-outline" size={20} color="#94A3B8" style={styles.optionIcon} />
                <Text style={styles.optionLabel}>Historial de Incidencias</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.optionDivider} />

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                Alert.alert(
                  'Restablecer Datos Locales',
                  '¿Deseas vaciar la base de datos local SQLite (incidencias y palmetas pendientes)? Esta acción restablecerá el dispositivo a 0 registros locales.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Sí, Restablecer',
                      style: 'destructive',
                      onPress: () => {
                        clearAllLocalIncidencias();
                        clearAllPendingPalmetas();
                        setPendingCount(0);
                        triggerHaptic('success');
                        Alert.alert('Datos Restablecidos', 'La base de datos local ha quedado limpia con 0 incidencias registradas.');
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeftGroup}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" style={styles.optionIcon} />
                <Text style={[styles.optionLabel, { color: '#EF4444' }]}>Restablecer Datos Locales</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
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
                <Ionicons name="book-outline" size={20} color="#94A3B8" style={styles.optionIcon} />
                <Text style={styles.optionLabel}>Manual de Usuario</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
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
                <Ionicons name="headset-outline" size={20} color="#94A3B8" style={styles.optionIcon} />
                <Text style={styles.optionLabel}>Soporte Técnico</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón Cerrar Sesión */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Versión y Build */}
        <Text style={styles.versionText}>Aleprod Móvil · Versión 1.2.4 (Build 2026.09)</Text>
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
    zIndex: -1,
    transform: [{ translateZ: 0 } as any],
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
  gearIconCircle: {
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 120,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  profileAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileAvatarText: {
    color: '#60A5FA',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileDetails: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  terrenoBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.28)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  terrenoBadgeText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '700',
  },
  profileEmail: {
    color: '#94A3B8',
    fontSize: 13,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  storageCard: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  offlineStatusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  dbVersionText: {
    color: '#64748B',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pendingSubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F131D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cloudIconCircleSynced: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  pendingCountText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  pendingBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4.5,
  },
  pendingBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#E2E8F0',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    height: 48,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  optionsGroup: {
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 18,
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  optionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginLeft: 48,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    height: 48,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  versionText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
});
