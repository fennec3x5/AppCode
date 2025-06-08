// src/components/ResultListItem.js
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

const ResultListItem = ({ result, isTopResult, index, category }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, slideAnim, index]);

  const categoryInfo = category || { icon: 'category', color: '#666' };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, isTopResult && styles.topResultContainer]}>
      {isTopResult && (
        <View style={styles.bestBadge}>
          <Icon name="emoji-events" size={16} color="#FFF" />
          <Text style={styles.bestBadgeText}>BEST MATCH</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          {result.imageUrl ? (
            <Image source={{ uri: result.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardIconPlaceholder, isTopResult && styles.cardIconPlaceholderTop]}>
              <Icon name="credit-card" size={28} color={isTopResult ? colors.success : colors.primary} />
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, isTopResult && styles.cardNameTop]}>{result.cardName}</Text>
            {result.issuer && <Text style={styles.issuer}>{result.issuer}</Text>}
          </View>
          <View style={styles.rewardContainer}>
            <Text style={[styles.rewardRate, isTopResult && styles.rewardRateTop]}>{result.rewardRate}</Text>
            <Text style={[styles.rewardUnit, isTopResult && styles.rewardRateTop]}>
              {result.rewardType === 'percentage' ? '%' : 'x'}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '1A' }]}>
            <Icon name={categoryInfo.icon} size={16} color={categoryInfo.color} />
            <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
              {result.isDefault ? 'All purchases' : result.categoryName}
            </Text>
          </View>
          {result.notes && (
            <View style={styles.noteContainer}>
              <Icon name="info-outline" size={14} color={colors.textSecondary} style={{marginTop: 2}}/>
              <Text style={styles.noteText}>{result.notes}</Text>
            </View>
          )}
          {result.endDate && !result.isDefault && (
            <View style={styles.noteContainer}>
              <Icon name="event-busy" size={14} color={colors.textSecondary} />
              <Text style={styles.noteText}>Expires {new Date(result.endDate).toLocaleDateString()}</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// Styles for ResultListItem
const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        marginHorizontal: spacing.md,
        marginVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        ...shadows.sm,
    },
    topResultContainer: {
        borderColor: colors.success,
        borderWidth: 2,
        ...shadows.md,
    },
    bestBadge: {
        position: 'absolute',
        top: -1, right: 12,
        backgroundColor: colors.success,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderBottomLeftRadius: borderRadius.lg,
        borderTopRightRadius: borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    bestBadgeText: {
        ...typography.caption,
        color: colors.surface,
        fontWeight: '700',
        marginLeft: spacing.xs,
    },
    content: { padding: spacing.lg },
    header: { flexDirection: 'row', alignItems: 'center' },
    cardImage: { width: 64, height: 40, borderRadius: borderRadius.sm, backgroundColor: colors.divider },
    cardIconPlaceholder: {
        width: 64, height: 40, borderRadius: borderRadius.sm,
        backgroundColor: colors.primaryBackground,
        justifyContent: 'center', alignItems: 'center',
    },
    cardIconPlaceholderTop: { backgroundColor: colors.success + '20' },
    cardInfo: { flex: 1, marginLeft: spacing.md },
    cardName: { ...typography.h4, color: colors.text },
    cardNameTop: { color: colors.success },
    issuer: { ...typography.body2, color: colors.textSecondary },
    rewardContainer: { flexDirection: 'row', alignItems: 'baseline' },
    rewardRate: { ...typography.h1, fontWeight: '800', color: colors.primary },
    rewardRateTop: { color: colors.success },
    rewardUnit: { ...typography.h4, fontWeight: '700', color: colors.primary, marginLeft: 2 },
    details: { borderTopWidth: 1, borderColor: colors.divider, marginTop: spacing.md, paddingTop: spacing.md },
    categoryBadge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
        borderRadius: borderRadius.md, alignSelf: 'flex-start',
    },
    categoryText: { ...typography.body2, fontWeight: '600', marginLeft: spacing.xs },
    noteContainer: { flexDirection: 'row', marginTop: spacing.sm, alignItems: 'flex-start' },
    noteText: { ...typography.caption, color: colors.textSecondary, flex: 1, marginLeft: spacing.sm, lineHeight: 18 },
});


export default React.memo(ResultListItem);