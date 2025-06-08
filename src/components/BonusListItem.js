// src/components/BonusListItem.js
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius } from '../config/Theme';

export default function BonusListItem({ bonus, categoryInfo, onShowActions }) {
  const { isActive, isExpiringSoon, daysUntilExpiry } = useMemo(() => {
    // ... memo logic is unchanged
    const now = new Date();
    const active = (!bonus.startDate || new Date(bonus.startDate) <= now) && 
                   (!bonus.endDate || new Date(bonus.endDate) >= now);
    let days = null;
    if (bonus.endDate) {
      days = Math.ceil((new Date(bonus.endDate) - now) / (1000 * 60 * 60 * 24));
    }
    const expiring = active && days !== null && days <= 7;
    return { isActive: active, isExpiringSoon: expiring, daysUntilExpiry: days };
  }, [bonus.startDate, bonus.endDate]);

  return (
    <View style={[styles.container, !isActive && styles.inactiveContainer]}>
      <View style={[styles.iconContainer, { backgroundColor: categoryInfo.color + '20' }]}>
        <Icon name={categoryInfo.icon} size={24} color={categoryInfo.color} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.categoryName}>{bonus.categoryName}</Text>
        {isExpiringSoon ? (
            <Text style={styles.expiringText}>Expires in {daysUntilExpiry} days</Text>
        ) : !isActive && bonus.startDate ? (
            <Text style={styles.inactiveText}>Starts {new Date(bonus.startDate).toLocaleDateString()}</Text>
        ) : null}
      </View>
      <View style={styles.rewardContainer}>
        <Text style={styles.rewardRate}>{bonus.rewardRate}</Text>
        <Text style={styles.rewardUnit}>{bonus.rewardType === 'percentage' ? '%' : 'x'}</Text>
      </View>
      {/* --- CHANGE: The 'more' button now calls onShowActions with the bonus object --- */}
      <TouchableOpacity onPress={() => onShowActions(bonus)} style={styles.moreButton}>
        <Icon name="more-vert" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

// Styles are unchanged
const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
    inactiveContainer: { opacity: 0.6 },
    iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    infoContainer: { flex: 1 },
    categoryName: { ...typography.body1, fontWeight: '600', color: colors.text },
    expiringText: { ...typography.caption, color: colors.error, fontWeight: 'bold' },
    inactiveText: { ...typography.caption, color: colors.textSecondary },
    rewardContainer: { flexDirection: 'row', alignItems: 'baseline', marginLeft: spacing.md },
    rewardRate: { ...typography.h3, color: colors.primary },
    rewardUnit: { ...typography.h5, color: colors.primary, fontWeight: '600' },
    moreButton: { padding: spacing.sm, marginLeft: spacing.xs },
});