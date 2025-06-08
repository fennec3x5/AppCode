// src/screens/CardListScreen.js
import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Animated,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCardList } from '../hooks/useCardList'; // Import the new hook

const { width } = Dimensions.get('window');

export default function CardListScreen({ navigation }) {
  // All state and data logic is now handled by the custom hook.
  const { cards, loading, refreshing, onRefresh } = useCardList();
  
  // Animation values remain here as they are part of the view logic.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fabScale = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef({}).current;

  // Animate screen entry once, not on every focus.
  useEffect(() => {
    animateScreenEntry();
  }, []);

  // Animate cards whenever the cards array changes.
  useEffect(() => {
    if (cards.length > 0) {
      cards.forEach((card, index) => {
        animateCardEntry(card.id, index);
      });
    }
  }, [cards]);

  const animateScreenEntry = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true, delay: 300 }),
    ]).start();
  };

  const getCardAnimation = (cardId) => {
    if (!cardAnimations[cardId]) {
      cardAnimations[cardId] = { scale: new Animated.Value(1), opacity: new Animated.Value(0), translateY: new Animated.Value(30) };
    }
    return cardAnimations[cardId];
  };

  const animateCardEntry = (cardId, index) => {
    const animation = getCardAnimation(cardId);
    Animated.parallel([
      Animated.timing(animation.opacity, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }),
      Animated.timing(animation.translateY, { toValue: 0, duration: 400, delay: index * 100, useNativeDriver: true }),
    ]).start();
  };

  const getActiveBonusCount = (card) => {
    if (!card.bonuses || !Array.isArray(card.bonuses)) return 0;
    const now = new Date();
    return card.bonuses.filter(bonus => {
      if (!bonus.startDate && !bonus.endDate) return true;
      if (bonus.startDate && new Date(bonus.startDate) > now) return false;
      if (bonus.endDate && new Date(bonus.endDate) < now) return false;
      return true;
    }).length;
  };

  const handleCardPress = (item) => {
    const animation = getCardAnimation(item.id);
    if (Platform.OS === 'ios') Vibration.vibrate(10);
    Animated.sequence([
      Animated.timing(animation.scale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(animation.scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      navigation.navigate('CardDetail', { card: item });
    });
  };

  const handleFabPress = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      navigation.navigate('AddEditCard');
    });
  };

  const renderCard = ({ item, index }) => {
    const activeBonuses = getActiveBonusCount(item);
    const hasExpiringSoon = item.bonuses?.some(bonus => {
      if (!bonus.endDate) return false;
      const daysUntilExpiry = Math.ceil((new Date(bonus.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    });
    
    const animation = getCardAnimation(item.id);
    
    return (
      <Animated.View style={[{ opacity: animation.opacity, transform: [{ translateY: animation.translateY }, { scale: animation.scale }] }]}>
        <TouchableOpacity onPress={() => handleCardPress(item)} activeOpacity={0.7}>
          <View style={[styles.cardItem, hasExpiringSoon && styles.cardItemExpiring]}>
            <View style={styles.cardImageContainer}>
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} /> : <View style={styles.cardIconPlaceholder}><Icon name="credit-card" size={32} color="#1976D2" /></View>}
              {hasExpiringSoon && <View style={styles.expiringBadge}><Icon name="schedule" size={12} color="#FFF" /></View>}
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={1}>{item.cardName}</Text>
              {item.issuer ? <Text style={styles.issuer} numberOfLines={1}>{item.issuer}</Text> : null}
              <View style={styles.bonusContainer}>
                {activeBonuses > 0 ? (
                  <><View style={styles.bonusIndicator}><Icon name="star" size={14} color="#FFB800" /></View><Text style={styles.bonusCount}>{activeBonuses} active bonus{activeBonuses !== 1 ? 'es' : ''}</Text></>
                ) : (
                  <Text style={styles.noBonusText}>No active bonuses</Text>
                )}
              </View>
            </View>
            <View style={styles.chevronContainer}><Icon name="chevron-right" size={24} color="#B0BEC5" /></View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const LoadingSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}><View style={styles.skeletonImage} /><View style={styles.skeletonContent}><View style={styles.skeletonTitle} /><View style={styles.skeletonSubtitle} /><View style={styles.skeletonBadge} /></View></View>
      ))}
    </View>
  );

  if (loading && !refreshing) {
    return <View style={styles.container}><LoadingSkeleton /></View>;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <FlatList
          data={cards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} tintColor="#2196F3" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}><View style={styles.emptyIconGradient}><Icon name="credit-card" size={60} color="#1976D2" /></View></View>
              <Text style={styles.emptyText}>No cards added yet</Text>
              <Text style={styles.emptySubtext}>Add your first card to start tracking rewards</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('AddEditCard')} activeOpacity={0.8}><Text style={styles.emptyButtonText}>Add Your First Card</Text></TouchableOpacity>
            </View>
          }
        />
      </Animated.View>
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity style={styles.fab} onPress={handleFabPress} activeOpacity={0.8}><View style={styles.fabGradient}><Icon name="add" size={28} color="#fff" /></View></TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// All styles are unchanged.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flex: 1 },
  listContent: { paddingTop: 12, paddingBottom: 24, flexGrow: 1 },
  cardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardItemExpiring: { borderWidth: 1, borderColor: '#FF6B6B' },
  cardImageContainer: { width: 72, height: 48, marginRight: 16, position: 'relative' },
  cardImage: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: '#F8F9FA' },
  cardIconPlaceholder: { width: '100%', height: '100%', borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E3F2FD' },
  expiringBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF6B6B', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '600', color: '#1A1A1A', marginBottom: 4, letterSpacing: 0.2 },
  issuer: { fontSize: 14, color: '#6C757D', marginBottom: 8 },
  bonusContainer: { flexDirection: 'row', alignItems: 'center' },
  bonusIndicator: { marginRight: 6 },
  bonusCount: { fontSize: 14, color: '#2196F3', fontWeight: '500' },
  noBonusText: { fontSize: 14, color: '#ADB5BD', fontStyle: 'italic' },
  chevronContainer: { padding: 4 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIconContainer: { marginBottom: 24 },
  emptyIconGradient: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E3F2FD', shadowColor: '#2196F3', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 5 },
  emptyText: { fontSize: 22, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  emptySubtext: { fontSize: 16, color: '#6C757D', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  emptyButton: { backgroundColor: '#2196F3', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 25, shadowColor: '#2196F3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  emptyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  fabContainer: { position: 'absolute', right: 16, bottom: 24 },
  fab: { width: 56, height: 56, borderRadius: 28, shadowColor: '#2196F3', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  fabGradient: { width: '100%', height: '100%', borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2196F3' },
  skeletonContainer: { paddingTop: 12, paddingHorizontal: 16 },
  skeletonCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  skeletonImage: { width: 72, height: 48, borderRadius: 8, backgroundColor: '#E9ECEF', marginRight: 16 },
  skeletonContent: { flex: 1 },
  skeletonTitle: { width: '60%', height: 16, backgroundColor: '#E9ECEF', borderRadius: 4, marginBottom: 8 },
  skeletonSubtitle: { width: '40%', height: 14, backgroundColor: '#E9ECEF', borderRadius: 4, marginBottom: 8 },
  skeletonBadge: { width: '30%', height: 12, backgroundColor: '#E9ECEF', borderRadius: 4 },
});