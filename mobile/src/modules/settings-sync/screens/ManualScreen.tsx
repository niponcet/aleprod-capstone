import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../core/theme/colors';

export const ManualScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

        <Text style={styles.headerTitle}>Manual de Terreno</Text>

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
            <Ionicons name="book-outline" size={26} color={colors.primaryAmber} />
          </View>
          <Text style={styles.heroTitle}>Guía de Operaciones</Text>
          <Text style={styles.heroDescription}>
            Protocolos oficiales para el aprovisionamiento de palmetas LED P3.9, gestión de montajes en recintos y reporte de fallas técnicas.
          </Text>
        </View>

        {/* Sección: Regla de los 3 Taps */}
        <Text style={styles.sectionTitle}>1. Regla de los 3 Taps (Reporte de Falla)</Text>
        <View style={styles.guideCard}>
          <Text style={styles.guideCardIntro}>
            Diseñado para reportar cualquier avería en menos de 10 segundos en medio de un evento con alta exigencia:
          </Text>

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Escanear Código QR</Text>
              <Text style={styles.stepDescription}>
                Abre el escáner desde la barra flotante y enfoca el código QR físico grabado en la palmeta.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Seleccionar Componente</Text>
              <Text style={styles.stepDescription}>
                Toca directamente el componente afectado: Placa LED, Cable de datos, Conector de poder o Fuente de poder.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Foto y Confirmación</Text>
              <Text style={styles.stepDescription}>
                Captura la evidencia fotográfica con la cámara y confirma el reporte con un solo toque.
              </Text>
            </View>
          </View>
        </View>

        {/* Sección: Aprovisionamiento en Ráfaga */}
        <Text style={styles.sectionTitle}>2. Aprovisionamiento en Ráfaga</Text>
        <View style={styles.guideCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="flash-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.cardHeaderTitle}>Enrolamiento Masivo de Bodega</Text>
          </View>

          <Text style={styles.cardParagraph}>
            Al recibir un nuevo cargamento de palmetas en bodega, activa el <Text style={styles.boldText}>Modo Ráfaga</Text> en el escáner.
          </Text>

          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>
              Escanea continuamente sin cerrar la pantalla de la cámara ni presionar botones adicionales.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>
              Asigna el lote de importación automáticamente a todos los equipos del lote.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>
              El sistema detecta códigos duplicados inmediatamente y emite una alerta háptica diferenciada.
            </Text>
          </View>
        </View>

        {/* Sección: Gestión de Montajes */}
        <Text style={styles.sectionTitle}>3. Gestión de Montajes y Eventos</Text>
        <View style={styles.guideCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIconBox, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
              <Ionicons name="layers-outline" size={20} color={colors.primaryAmber} />
            </View>
            <Text style={styles.cardHeaderTitle}>Superficie y Trazabilidad</Text>
          </View>

          <Text style={styles.cardParagraph}>
            En la pantalla principal puedes consultar en tiempo real el evento actualmente activo en terreno:
          </Text>

          <View style={styles.bulletRow}>
            <Ionicons name="cube-outline" size={16} color={colors.primaryAmber} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Cálculo de Superficie:</Text> Cada palmeta LED P3.9 estándar equivale a 0.25 m² (4 palmetas = 1 m²).
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="list-outline" size={16} color={colors.primaryAmber} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Trazabilidad de Averías:</Text> Desde el detalle del evento puedes auditar el historial completo de incidencias vinculadas a esa producción.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="stop-circle-outline" size={16} color={colors.danger} style={styles.bulletIcon} />
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Cierre de Evento:</Text> Finaliza la producción solo una vez desmontada la pista de baile y completada la carga en camiones.
            </Text>
          </View>
        </View>

        {/* Sección: Operación Offline y Sincronización */}
        <Text style={styles.sectionTitle}>4. Operación Offline y Respaldo</Text>
        <View style={styles.guideCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="cloud-offline-outline" size={20} color="#10B981" />
            </View>
            <Text style={styles.cardHeaderTitle}>Arquitectura Local SQLite</Text>
          </View>

          <Text style={styles.cardParagraph}>
            La app opera bajo un paradigma <Text style={styles.boldText}>Online-First con Offline-Fallback</Text>:
          </Text>

          <View style={styles.bulletRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" style={styles.bulletIcon} />
            <Text style={styles.bulletText}>
              Si hay conexión, los datos se guardan instantáneamente en Supabase Cloud y las fotos en Supabase Storage.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" style={styles.bulletIcon} />
            <Text style={styles.bulletText}>
              Si estás en un subsuelo o recinto sin señal, todo se almacena en SQLite local (`incidencias_locales` y `palmetas_pendientes`).
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="refresh-circle-outline" size={16} color="#10B981" style={styles.bulletIcon} />
            <Text style={styles.bulletText}>
              Al recuperar conectividad, puedes pulsar <Text style={styles.boldText}>"Sincronizar Almacenamiento"</Text> en la pestaña de Ajustes para despachar los registros pendientes en bloque.
            </Text>
          </View>
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
  guideCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
  },
  guideCardIntro: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    color: colors.primaryAmber,
    fontSize: 12,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  stepDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  cardParagraph: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  boldText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});

export default ManualScreen;

