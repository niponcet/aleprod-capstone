import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';
import { triggerHaptic } from '../../../core/utils/haptics';

export const SupportScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleOpenWhatsApp = async () => {
    triggerHaptic('medium');
    const url = 'https://wa.me/56987654321?text=Hola,%20necesito%20asistencia%20en%20terreno%20con%20la%20app%20Aleprod.';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://wa.me/56987654321');
      }
    } catch {
      // Fallback silencioso si no hay cliente instalado
    }
  };

  const handleOpenEmail = async () => {
    triggerHaptic('medium');
    const url = 'mailto:soporte@aleprod.cl?subject=Soporte%20Terreno%20Aleprod&body=Hola%20Mesa%20de%20Ayuda,%0A%0A';
    try {
      await Linking.openURL(url);
    } catch {
      // Fallback
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Superior Inmersivo Edge-to-Edge */}
      <View
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === 'web'
                ? ('max(calc(env(safe-area-inset-top, 0px) + 8px), 20px)' as any)
                : insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Soporte Técnico</Text>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Platform.OS === 'web'
                ? ('calc(env(safe-area-inset-bottom, 0px) + 32px)' as any)
                : insets.bottom + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Presentación */}
        <View style={styles.heroBox}>
          <View style={styles.heroIconBox}>
            <Ionicons name="headset-outline" size={26} color={colors.primaryAmber} />
          </View>
          <Text style={styles.heroTitle}>Mesa de Ayuda Técnica</Text>
          <Text style={styles.heroDescription}>
            Asistencia prioritaria para operadores y técnicos durante montajes, pruebas de señal y eventos en vivo.
          </Text>
        </View>

        {/* Canales de Contacto Directo */}
        <Text style={styles.sectionTitle}>Canales de Atención Directa</Text>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={handleOpenWhatsApp}
          activeOpacity={0.75}
        >
          <View style={[styles.contactIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="logo-whatsapp" size={22} color="#10B981" />
          </View>
          <View style={styles.contactInfo}>
            <View style={styles.contactHeaderRow}>
              <Text style={styles.contactName}>Soporte vía WhatsApp</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>En línea</Text>
              </View>
            </View>
            <Text style={styles.contactValue}>+56 9 8765 4321</Text>
            <Text style={styles.contactDetail}>Coordinación en caliente para eventos en curso</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={handleOpenEmail}
          activeOpacity={0.75}
        >
          <View style={[styles.contactIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Ionicons name="mail-outline" size={22} color="#3B82F6" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Correo Electrónico</Text>
            <Text style={styles.contactValue}>soporte@aleprod.cl</Text>
            <Text style={styles.contactDetail}>Consultas de cuenta, accesos e incidencias complejas</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

        {/* Protocolo de Terreno */}
        <Text style={styles.sectionTitle}>Protocolo de Emergencia en Eventos</Text>

        <View style={styles.protocolCard}>
          <View style={styles.protocolRow}>
            <View style={styles.protocolStepBadge}>
              <Text style={styles.protocolStepNumber}>1</Text>
            </View>
            <View style={styles.protocolTextGroup}>
              <Text style={styles.protocolStepTitle}>Sin señal ni internet</Text>
              <Text style={styles.protocolStepBody}>
                La aplicación guarda todos los datos localmente en SQLite. No detengas el montaje ni reinicies tu sesión.
              </Text>
            </View>
          </View>

          <View style={styles.protocolDivider} />

          <View style={styles.protocolRow}>
            <View style={styles.protocolStepBadge}>
              <Text style={styles.protocolStepNumber}>2</Text>
            </View>
            <View style={styles.protocolTextGroup}>
              <Text style={styles.protocolStepTitle}>Falla crítica de palmeta</Text>
              <Text style={styles.protocolStepBody}>
                Escanea el QR y pulsa "Dar de Baja" para marcar el equipo como defectuoso y descontarlo de la superficie operativa.
              </Text>
            </View>
          </View>

          <View style={styles.protocolDivider} />

          <View style={styles.protocolRow}>
            <View style={styles.protocolStepBadge}>
              <Text style={styles.protocolStepNumber}>3</Text>
            </View>
            <View style={styles.protocolTextGroup}>
              <Text style={styles.protocolStepTitle}>Módulos descalibrados o pixeles muertos</Text>
              <Text style={styles.protocolStepBody}>
                Registra un reporte de "Placa LED" o "Fuente" para que el equipo de taller técnico reciba la notificación.
              </Text>
            </View>
          </View>
        </View>

        {/* Tarjeta de Horarios */}
        <View style={styles.coverageCard}>
          <Ionicons name="time-outline" size={18} color={colors.primaryAmber} style={{ marginRight: 10 }} />
          <Text style={styles.coverageText}>
            Horario de Guardia: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>24/7</Text> durante producciones activas y festivales.
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
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
  headerRightPlaceholder: {
    width: 38,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  heroBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
    alignItems: 'flex-start',
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 2,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  contactIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  contactName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  liveText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  contactValue: {
    color: colors.primaryAmber,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactDetail: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  protocolCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  protocolStepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  protocolStepNumber: {
    color: colors.primaryAmber,
    fontSize: 12,
    fontWeight: '800',
  },
  protocolTextGroup: {
    flex: 1,
  },
  protocolStepTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  protocolStepBody: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  protocolDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  coverageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: 12,
    padding: 14,
  },
  coverageText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
});

export default SupportScreen;

