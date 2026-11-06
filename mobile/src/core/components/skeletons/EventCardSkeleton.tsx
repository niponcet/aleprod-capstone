import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

export const EventCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      {/* Fila Superior con Tag y Fecha */}
      <View style={styles.cardHeaderRow}>
        <SkeletonBox width={100} height={24} borderRadius={12} />
        <SkeletonBox width={115} height={22} borderRadius={10} />
      </View>

      {/* Título del Evento */}
      <View style={styles.titleRow}>
        <SkeletonBox width="68%" height={20} borderRadius={6} />
        <SkeletonBox width={18} height={18} borderRadius={9} />
      </View>

      {/* Recinto / Ubicación */}
      <View style={styles.venueRow}>
        <SkeletonBox width={16} height={16} borderRadius={8} style={{ marginRight: 8 }} />
        <SkeletonBox width="45%" height={14} borderRadius={6} />
      </View>

      {/* Ficha Técnica Box */}
      <View style={styles.techDetailsBox}>
        <View style={styles.techRow}>
          <SkeletonBox width="38%" height={12} borderRadius={4} />
          <SkeletonBox width="32%" height={12} borderRadius={4} />
        </View>
        <View style={[styles.techRow, { marginTop: 6 }]}>
          <SkeletonBox width="30%" height={12} borderRadius={4} />
          <SkeletonBox width="28%" height={12} borderRadius={4} />
        </View>
      </View>

      {/* Métrica de Superficie / Barra de Progreso */}
      <View style={styles.metersBlock}>
        <View style={styles.metersHeader}>
          <SkeletonBox width={120} height={12} borderRadius={4} />
          <SkeletonBox width={60} height={12} borderRadius={4} />
        </View>
        <SkeletonBox width="100%" height={6} borderRadius={3} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  techDetailsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metersBlock: {
    marginTop: 2,
  },
  metersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

