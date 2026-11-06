import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBox';

export const AssetDetailSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Hero Card Espejo */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <SkeletonBox width={120} height={14} borderRadius={6} />
          <SkeletonBox width={95} height={22} borderRadius={12} />
        </View>

        <SkeletonBox width="65%" height={26} borderRadius={8} style={{ marginVertical: 12 }} />

        <SkeletonBox width="80%" height={26} borderRadius={8} />
      </View>

      {/* Card de Especificaciones Técnicas */}
      <View style={styles.specsCard}>
        <View style={styles.cardHeaderRow}>
          <SkeletonBox width={20} height={20} borderRadius={10} style={{ marginRight: 8 }} />
          <SkeletonBox width={160} height={16} borderRadius={6} />
        </View>

        <View style={styles.specsGrid}>
          <View style={styles.specBox}>
            <SkeletonBox width={60} height={11} borderRadius={4} />
            <SkeletonBox width={80} height={14} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
          <View style={styles.specBox}>
            <SkeletonBox width={65} height={11} borderRadius={4} />
            <SkeletonBox width={75} height={14} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
          <View style={styles.specBox}>
            <SkeletonBox width={70} height={11} borderRadius={4} />
            <SkeletonBox width={85} height={14} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
          <View style={styles.specBox}>
            <SkeletonBox width={50} height={11} borderRadius={4} />
            <SkeletonBox width={60} height={14} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        </View>
      </View>

      {/* Historial de Incidencias Skeleton */}
      <View style={styles.historyCard}>
        <View style={styles.cardHeaderRow}>
          <SkeletonBox width={20} height={20} borderRadius={10} style={{ marginRight: 8 }} />
          <SkeletonBox width={150} height={16} borderRadius={6} />
        </View>

        <View style={styles.incidentItemSkeleton}>
          <SkeletonBox width={110} height={18} borderRadius={6} />
          <SkeletonBox width="90%" height={13} borderRadius={4} style={{ marginTop: 8 }} />
          <SkeletonBox width="60%" height={11} borderRadius={4} style={{ marginTop: 6 }} />
        </View>

        <View style={[styles.incidentItemSkeleton, { marginTop: 10 }]}>
          <SkeletonBox width={95} height={18} borderRadius={6} />
          <SkeletonBox width="85%" height={13} borderRadius={4} style={{ marginTop: 8 }} />
          <SkeletonBox width="55%" height={11} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
  },
  historyCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  incidentItemSkeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
  },
});

