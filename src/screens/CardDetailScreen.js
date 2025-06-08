// src/screens/CardDetailScreen.js
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Animated, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Hooks and Components
import { useCategoryData } from '../hooks/useCategoryData';
import { useCardDetail } from '../hooks/useCardDetail';
import BonusListItem from '../components/BonusListItem';
import BonusActionModal from '../components/BonusActionModal';

import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

const { width } = Dimensions.get('window');

const CardDetailHeader = ({ card, scaleAnim }) => (
  <Animated.View style={[styles.cardHeaderSection, { transform: [{ scale: scaleAnim }] }]}>
    <View style={styles.cardHeader}>
      {card.imageUrl ? (
        <Image source={{ uri: card.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardIconLarge}>
          <Icon name="credit-card" size={56} color={colors.primary} />
        </View>
      )}
      <View style={styles.cardHeaderInfo}>
        <Text style={styles.cardName}>{card.cardName}</Text>
        {card.issuer && <Text style={styles.issuer}>{card.issuer}</Text>}
        <View style={styles.defaultRateContainer}>
          <Icon name="info-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.defaultRate}>{card.defaultRewardRate}% on other purchases</Text>
        </View>
      </View>
    </View>
  </Animated.View>
);

export default function CardDetailScreen({ navigation, route }) {
  const { card: initialCard } = route.params;
  
  // --- CHANGE #2a: State to control the action modal ---
  const [selectedBonus, setSelectedBonus] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;

  const { card, loading, deleteBonus, deleteCard } = useCardDetail(initialCard.id);
  const { categories } = useCategoryData();

  useEffect(() => {
    if (!loading && card) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(headerScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
      ]).start();
    }
  }, [loading, card]);

  const getCategoryInfo = (categoryName) => {
    return categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase()) || 
           { name: categoryName, icon: 'category', color: '#666' };
  };
  
  const sortedBonuses = useMemo(() => {
    if (!card?.bonuses) return [];
    const now = new Date();
    return [...card.bonuses].sort((a, b) => {
      const aIsActive = (!a.startDate || new Date(a.startDate) <= now) && (!a.endDate || new Date(a.endDate) >= now);
      const bIsActive = (!b.startDate || new Date(b.startDate) <= now) && (!b.endDate || new Date(b.endDate) >= now);
      if (aIsActive && !bIsActive) return -1;
      if (!bIsActive && aIsActive) return 1;
      return (b.rewardRate || 0) - (a.rewardRate || 0);
    });
  }, [card?.bonuses]);

  if (loading || !card) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView contentContainerStyle={styles.scrollContent} style={{ opacity: fadeAnim }}>
        <CardDetailHeader card={card} scaleAnim={headerScale} />
        
        {/* The Action Buttons container, now with no negative margin */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AddEditCard', { card })}>
            <Icon name="edit" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Edit Card</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { borderColor: colors.error }]} onPress={deleteCard}>
            <Icon name="delete" size={20} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bonusSection}>
          <View style={styles.bonusHeader}>
            <Text style={styles.sectionTitle}>Bonus Categories</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddEditBonus', { cardId: card.id })}>
              <Icon name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          {sortedBonuses.length > 0 ? (
            sortedBonuses.map(bonus => (
              <BonusListItem
                key={bonus.id}
                bonus={bonus}
                categoryInfo={getCategoryInfo(bonus.categoryName)}
                // --- CHANGE #2b: Pass the function to set the selected bonus ---
                onShowActions={() => setSelectedBonus(bonus)}
              />
            ))
          ) : (
             <View style={styles.emptyContainer}><Text style={styles.emptyText}>No bonus categories yet.</Text></View>
          )}
        </View>
      </Animated.ScrollView>

      {/* --- CHANGE #2c: The modal now correctly handles edit/delete actions --- */}
      <BonusActionModal
        bonus={selectedBonus}
        visible={!!selectedBonus}
        onClose={() => setSelectedBonus(null)}
        onEdit={() => {
          navigation.navigate('AddEditBonus', { cardId: card.id, bonus: selectedBonus });
          setSelectedBonus(null);
        }}
        onDelete={() => {
          deleteBonus(selectedBonus.id);
          setSelectedBonus(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 50 },
    cardHeaderSection: { backgroundColor: colors.surface, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, ...shadows.sm },
    cardHeader: { padding: spacing.xl, alignItems: 'center' },
    cardImage: { width: width - 120, height: (width - 120) * 0.63, borderRadius: 16, marginBottom: 20 },
    cardIconLarge: {
        width: width - 120, height: (width - 120) * 0.63,
        borderRadius: 16, backgroundColor: colors.primaryBackground,
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    cardHeaderInfo: { alignItems: 'center' },
    cardName: { ...typography.h2, color: colors.text, textAlign: 'center', marginBottom: 4 },
    issuer: { ...typography.h5, color: colors.textSecondary, marginBottom: 12 },
    defaultRateContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background,
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    },
    defaultRate: { ...typography.body2, color: colors.textSecondary, marginLeft: 6 },
    // --- CHANGE #1: The actionsSection now uses margin instead of negative margin ---
    actionsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: spacing.sm,
        marginHorizontal: spacing.lg,
        marginTop: spacing.md, // Spacing from the header above
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        ...shadows.md,
    },
    actionButton: {
        flexDirection: 'row', alignItems: 'center',
        padding: spacing.sm,
    },
    actionText: { ...typography.button, color: colors.primary, marginLeft: spacing.sm },
    bonusSection: { padding: spacing.lg, marginTop: spacing.sm },
    bonusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    sectionTitle: { ...typography.h4, color: colors.text },
    addButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center', ...shadows.sm,
    },
    emptyContainer: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.surface, borderRadius: borderRadius.lg },
    emptyText: { ...typography.body1, color: colors.textSecondary },
});