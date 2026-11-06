import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventItem } from '../screens/EventsScreen';

interface EventCardProps {
  event: EventItem & {
    centros_eventos?: { id?: string; nombre: string } | null;
    locacion?: string | null;
    centro_id?: string | null;
  };
  onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const isEnCurso = event.status === 'en_curso';
  const isFinalizado = event.status === 'finalizado';

  const badge = isFinalizado
    ? {
        bg: 'rgba(100, 116, 139, 0.12)',
        border: 'rgba(100, 116, 139, 0.25)',
        text: '#94A3B8',
        dot: '#64748B',
      }
    : isEnCurso
    ? {
        bg: 'rgba(59, 130, 246, 0.12)',
        border: 'rgba(59, 130, 246, 0.28)',
        text: '#60A5FA',
        dot: '#3B82F6',
      }
    : {
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.25)',
        text: '#34D399',
        dot: '#10B981',
      };

  const progressPercent = Math.min(
    100,
    Math.round(
      (event.deployedMeters / (event.totalMeters > 0 ? event.totalMeters : 1)) * 100
    )
  );

  // Prioridad: Relación relacional centros_eventos.nombre > venue calculado > locacion legacy
  const recintoNombre =
    event.centros_eventos?.nombre ||
    event.venue ||
    event.locacion ||
    'Recinto por definir';

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Fila Superior con Tag y Fecha */}
      <View style={styles.cardHeaderRow}>
        <View
          style={[
            styles.statusTag,
            { backgroundColor: badge.bg, borderColor: badge.border },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
          <Text style={[styles.statusTagText, { color: badge.text }]}>
            {event.statusLabel}
          </Text>
        </View>

        <View style={styles.datesPill}>
          <Ionicons
            name="time-outline"
            size={12}
            color="#94A3B8"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.datesText}>{event.dates}</Text>
        </View>
      </View>

      {/* Título y Chevron */}
      <View style={styles.titleRow}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Ionicons name="chevron-forward" size={18} color="#64748B" />
      </View>

      {/* Locación / Recinto Relacional */}
      <View style={styles.venueRow}>
        <Ionicons
          name="location-outline"
          size={14}
          color="#3B82F6"
          style={{ marginRight: 5 }}
        />
        <Text style={styles.venueText}>{recintoNombre}</Text>
      </View>

      {/* Ficha Técnica */}
      <View style={styles.techDetailsBox}>
        <View style={styles.techRow}>
          <Text style={styles.techLabel}>Configuración / Equipo:</Text>
          <Text style={styles.techValue}>{event.screenType}</Text>
        </View>
        <View style={styles.techRow}>
          <Text style={styles.techLabel}>Responsable:</Text>
          <Text style={styles.techValue}>{event.responsible}</Text>
        </View>
      </View>

      {/* Métrica de Despliegue en m² */}
      <View style={styles.metersBlock}>
        <View style={styles.metersHeader}>
          <Text style={styles.metersTitle}>Superficie Requerida</Text>
          <Text style={styles.metersValue}>
            <Text style={styles.metersBold}>{event.deployedMeters}</Text> / {event.totalMeters} m²
          </Text>
        </View>

        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercent}%`,
                backgroundColor:
                  event.status === 'en_curso'
                    ? '#3B82F6'
                    : event.status === 'finalizado'
                    ? '#64748B'
                    : '#10B981',
              },
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  datesPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datesText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 8,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  venueText: {
    fontSize: 13,
    color: '#93C5FD',
    fontWeight: '600',
  },
  techDetailsBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  techLabel: {
    fontSize: 11.5,
    color: '#64748B',
  },
  techValue: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  metersBlock: {
    marginTop: 2,
  },
  metersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metersTitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  metersValue: {
    fontSize: 12,
    color: '#94A3B8',
  },
  metersBold: {
    fontWeight: '700',
    color: '#F8FAFC',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});

