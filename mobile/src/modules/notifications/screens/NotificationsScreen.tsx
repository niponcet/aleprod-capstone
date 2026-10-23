import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '../../../core/utils/haptics';

interface NotificationMockItem {
  id: string;
  type: 'system' | 'alert' | 'equipment';
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const SAMPLE_NOTIFICATIONS: NotificationMockItem[] = [
  {
    id: '1',
    type: 'system',
    title: 'Sincronización Cloud Completada',
    description: 'Los registros locales de terreno se encuentran respaldados en Supabase.',
    time: 'Hace 15 min',
    read: false,
    icon: 'cloud-done-outline',
    iconColor: '#10B981',
  },
  {
    id: '2',
    type: 'equipment',
    title: 'Asignación de Pista LED',
    description: 'Se reservaron 70 m² de palmetas P3.9 para el próximo montaje.',
    time: 'Hace 2 horas',
    read: false,
    icon: 'grid-outline',
    iconColor: '#60A5FA',
  },
  {
    id: '3',
    type: 'alert',
    title: 'Turno de Terreno Iniciado',
    description: 'Sesión activa para técnico en terreno. Modo offline garantizado.',
    time: 'Hoy, 08:30',
    read: true,
    icon: 'shield-checkmark-outline',
    iconColor: '#94A3B8',
  },
];

export const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeSegment, setActiveSegment] = useState<'all' | 'alert' | 'system'>('all');
  const [notifications, setNotifications] = useState<NotificationMockItem[]>(SAMPLE_NOTIFICATIONS);

  const handleBack = () => {
    triggerHaptic('light');
    router.back();
  };

  const handleSegmentChange = (segment: 'all' | 'alert' | 'system') => {
    triggerHaptic('selection');
    setActiveSegment(segment);
  };

  const handleMarkAllAsRead = () => {
    triggerHaptic('medium');
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeSegment === 'all') return true;
    if (activeSegment === 'alert') return item.type === 'alert' || item.type === 'equipment';
    return item.type === 'system';
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080C14" />

      {/* Halo ambiental superior suave */}
      <LinearGradient
        colors={['rgba(29, 78, 216, 0.35)', 'rgba(15, 23, 42, 0.15)', 'transparent']}
        locations={[0, 0.55, 1]}
        style={styles.topAmbientGlow}
        pointerEvents="none"
      />

      {/* Header Superior Nativo */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTexts}>
            <Text style={styles.headerOrgText}>Aleprod Terreno</Text>
            <Text style={styles.headerTitle}>Notificaciones</Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={handleMarkAllAsRead}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done-outline" size={14} color="#60A5FA" style={{ marginRight: 4 }} />
            <Text style={styles.markReadText}>Leídas</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selector de Segmentos */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === 'all' && styles.segmentButtonActive]}
          onPress={() => handleSegmentChange('all')}
          activeOpacity={0.75}
        >
          <Text style={[styles.segmentText, activeSegment === 'all' && styles.segmentTextActive]}>
            Todas
          </Text>
          {unreadCount > 0 && (
            <View style={styles.segmentBadge}>
              <Text style={styles.segmentBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === 'alert' && styles.segmentButtonActive]}
          onPress={() => handleSegmentChange('alert')}
          activeOpacity={0.75}
        >
          <Text style={[styles.segmentText, activeSegment === 'alert' && styles.segmentTextActive]}>
            Alertas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === 'system' && styles.segmentButtonActive]}
          onPress={() => handleSegmentChange('system')}
          activeOpacity={0.75}
        >
          <Text style={[styles.segmentText, activeSegment === 'system' && styles.segmentTextActive]}>
            Sistema
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Notificaciones */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <View
              key={item.id}
              style={[
                styles.notificationCard,
                !item.read && styles.notificationCardUnread,
              ]}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={18} color={item.iconColor} />
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>

                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>

              {!item.read && <View style={styles.unreadDot} />}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={28} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>Bandeja al día</Text>
            <Text style={styles.emptySubtitle}>
              No tienes notificaciones pendientes ni alertas críticas en terreno.
            </Text>
          </View>
        )}
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
    height: 280,
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
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.28)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  markReadText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#121620',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  segmentButtonActive: {
    backgroundColor: '#2563EB',
  },
  segmentText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  segmentBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 5,
  },
  segmentBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121620',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  notificationCardUnread: {
    borderColor: 'rgba(59, 130, 246, 0.25)',
    backgroundColor: '#141A28',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  cardTime: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '500',
  },
  cardDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2563EB',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
