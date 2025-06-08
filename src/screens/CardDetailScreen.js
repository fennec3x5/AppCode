import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from '../context/ApiContext';
import { DEFAULT_CATEGORIES } from '../config/categories';

const CUSTOM_CATEGORIES_KEY = '@custom_categories';
const { width } = Dimensions.get('window');

export default function CardDetailScreen({ navigation, route }) {
  const { card: initialCardFromRoute } = route.params;
  const [currentCard, setCurrentCard] = useState(initialCardFromRoute);
  const [categories, setCategories] = useState([]);
  const api = useApi();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const bonusAnimations = useRef({}).current;
  const actionButtonsAnim = useRef(new Animated.Value(-100)).current;

  // Update screen title
  React.useEffect(() => {
    if (currentCard) {
      navigation.setOptions({
        title: currentCard.cardName,
      });
    }
  }, [navigation, currentCard]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
    animateScreenEntry();
  }, []);

  const animateScreenEntry = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(actionButtonsAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getBonusAnimation = (bonusId) => {
    if (!bonusAnimations[bonusId]) {
      bonusAnimations[bonusId] = {
        scale: new Animated.Value(1),
        opacity: new Animated.Value(0),
        translateX: new Animated.Value(50),
      };
    }
    return bonusAnimations[bonusId];
  };

  const animateBonusEntry = (bonusId, index) => {
    const animation = getBonusAnimation(bonusId);
    
    Animated.parallel([
      Animated.timing(animation.opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(animation.translateX, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
      const customCategories = stored ? JSON.parse(stored) : [];
      setCategories([...DEFAULT_CATEGORIES, ...customCategories]);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const getCategoryInfo = (categoryName) => {
    const category = categories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    return category || {
      name: categoryName,
      icon: 'category',
      color: '#666666'
    };
  };

  const loadCardDetails = useCallback(async () => {
    const cardIdToLoad = initialCardFromRoute.id;

    if (!cardIdToLoad) {
      return;
    }

    try {
      const allCards = await api.getCards();
      const updatedCardFromServer = allCards.find(c => c.id === cardIdToLoad);

      if (updatedCardFromServer) {
        setCurrentCard(updatedCardFromServer);
        // Animate bonuses
        updatedCardFromServer.bonuses?.forEach((bonus, index) => {
          animateBonusEntry(bonus.id, index);
        });
      } else {
        Alert.alert('Card not found', 'This card may no longer exist.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Failed to refresh card details:', error);
      Alert.alert('Error', 'Could not load updated card details. Please try again.');
    }
  }, [api, initialCardFromRoute.id, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadCardDetails();
      loadCategories();
      return () => {};
    }, [loadCardDetails])
  );

  const handleActionPress = (action, onPress) => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
    
    Animated.sequence([
      Animated.timing(actionButtonsAnim, {
        toValue: -5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(actionButtonsAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onPress();
    });
  };

  const handleDeleteCard = () => {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete "${currentCard.cardName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteCard(currentCard.id);
              navigation.navigate('CardList');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete card. Please try again.');
              console.error('Delete card error:', error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteBonus = (bonus) => {
    const animation = getBonusAnimation(bonus.id);
    
    Alert.alert(
      'Delete Bonus Category',
      `Are you sure you want to delete the "${bonus.categoryName}" bonus?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Animate out
            Animated.parallel([
              Animated.timing(animation.opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(animation.translateX, {
                toValue: -width,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(async () => {
              try {
                await api.deleteBonus(currentCard.id, bonus.id);
                loadCardDetails();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete bonus. Please try again.');
                console.error('Delete bonus error:', error);
              }
            });
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isActiveBonus = (bonus) => {
    const now = new Date();
    if (bonus.startDate && new Date(bonus.startDate) > now) return false;
    if (bonus.endDate && new Date(bonus.endDate) < now) return false;
    return true;
  };

  const getDaysUntilExpiry = (bonus) => {
    if (!bonus.endDate) return null;
    const daysUntil = Math.ceil((new Date(bonus.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil;
  };

  const sortedBonuses = React.useMemo(() => {
    return [...(currentCard?.bonuses || [])].sort((a, b) => {
      const aActive = isActiveBonus(a);
      const bActive = isActiveBonus(b);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return (b.rewardRate || 0) - (a.rewardRate || 0);
    });
  }, [currentCard?.bonuses]);

  const renderBonus = (bonus, index) => {
    const isActive = isActiveBonus(bonus);
    const categoryInfo = getCategoryInfo(bonus.categoryName);
    const animation = getBonusAnimation(bonus.id);
    const daysUntilExpiry = getDaysUntilExpiry(bonus);
    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

    return (
      <Animated.View
        key={bonus.id}
        style={[
          {
            opacity: animation.opacity,
            transform: [
              { translateX: animation.translateX },
              { scale: animation.scale },
            ],
          },
        ]}
      >
        <View style={[
          styles.bonusItem,
          !isActive && styles.inactiveBonus,
          isExpiringSoon && styles.expiringBonus
        ]}>
          <TouchableOpacity
            style={styles.bonusContent}
            onPress={() => navigation.navigate('AddEditBonus', {
              cardId: currentCard.id,
              bonus
            })}
            activeOpacity={0.7}
          >
            <View style={styles.bonusMainContent}>
              <View style={styles.bonusLeftSection}>
                <View style={[styles.bonusCategoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                  <Icon name={categoryInfo.icon} size={26} color={categoryInfo.color} />
                </View>
                
                <View style={styles.bonusCategoryInfo}>
                  <View style={styles.categoryNameRow}>
                    <Text style={styles.categoryName}>{bonus.categoryName}</Text>
                    {!isActive && (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
                      </View>
                    )}
                    {isExpiringSoon && (
                      <View style={styles.expiringBadge}>
                        <Icon name="schedule" size={10} color="#FFF" />
                        <Text style={styles.expiringBadgeText}>{daysUntilExpiry}d</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.bonusMetadata}>
                    {(bonus.startDate || bonus.endDate) && (
                      <View style={styles.metadataItem}>
                        <Icon name="calendar-today" size={12} color="#9E9E9E" />
                        <Text style={styles.metadataText}>
                          {bonus.endDate ? formatDate(bonus.endDate) : 'Ongoing'}
                        </Text>
                      </View>
                    )}
                    
                    {bonus.isRotating && (
                      <View style={styles.metadataItem}>
                        <Icon name="autorenew" size={12} color="#9E9E9E" />
                        <Text style={styles.metadataText}>Rotating</Text>
                      </View>
                    )}
                  </View>
                  
                  {bonus.notes && (
                    <Text style={styles.notes} numberOfLines={1}>{bonus.notes}</Text>
                  )}
                </View>
              </View>

              <View style={styles.bonusRightSection}>
                <View style={styles.rewardRateWrapper}>
                  <View style={styles.rewardRateContainer}>
                    <Text style={[styles.rewardRate, !isActive && styles.rewardRateInactive]}>
                      {bonus.rewardRate}
                    </Text>
                    <Text style={[styles.rewardRateUnit, !isActive && styles.rewardRateInactive]}>
                      {bonus.rewardType === 'percentage' ? '%' : 'x'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteBonus(bonus)}
            activeOpacity={0.7}
          >
            <Icon name="close" size={18} color="#9E9E9E" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <Animated.View 
        style={[
          styles.cardHeaderSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: headerScale }],
          },
        ]}
      >
        <View style={styles.cardHeader}>
          {currentCard.imageUrl ? (
            <Image source={{ uri: currentCard.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardIconLarge}>
              <Icon name="credit-card" size={56} color="#1976D2" />
            </View>
          )}
          
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.cardName}>{currentCard.cardName}</Text>
            {currentCard.issuer && (
              <Text style={styles.issuer}>{currentCard.issuer}</Text>
            )}
            {currentCard.defaultRewardRate != null && (
              <View style={styles.defaultRateContainer}>
                <Icon name="info-outline" size={14} color="#6C757D" />
                <Text style={styles.defaultRate}>
                  {currentCard.defaultRewardRate}% default cashback
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          styles.actionsSection,
          {
            transform: [{ translateY: actionButtonsAnim }],
          },
        ]}
      >
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddEditCard', { card: currentCard })}
            activeOpacity={0.7}
          >
            <Icon name="edit" size={20} color="#2196F3" />
            <Text style={styles.actionText}>Edit Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteActionButton]}
            onPress={handleDeleteCard}
            activeOpacity={0.7}
          >
            <Icon name="delete" size={20} color="#f44336" />
            <Text style={[styles.actionText, styles.deleteText]}>Delete Card</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bonus Categories</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEditBonus', { cardId: currentCard.id })}
            activeOpacity={0.7}
            style={styles.addButton}
          >
            <Icon name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {sortedBonuses.length === 0 ? (
          <View style={styles.emptyBonuses}>
            <View style={styles.emptyIconContainer}>
              <Icon name="category" size={48} color="#E0E0E0" />
            </View>
            <Text style={styles.emptyText}>No bonus categories yet</Text>
            <Text style={styles.emptySubtext}>
              Add bonus categories to maximize your rewards
            </Text>
            <TouchableOpacity
              style={styles.addBonusButton}
              onPress={() => navigation.navigate('AddEditBonus', { cardId: currentCard.id })}
              activeOpacity={0.7}
            >
              <Icon name="add" size={20} color="#FFF" />
              <Text style={styles.addBonusButtonText}>Add Bonus Category</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bonusList}>
            {sortedBonuses.map((bonus, index) => renderBonus(bonus, index))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  cardHeaderSection: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 12,
  },
  cardHeader: {
    padding: 24,
    alignItems: 'center',
  },
  cardImage: {
    width: width - 120,
    height: (width - 120) * 0.63,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconLarge: {
    width: width - 120,
    height: (width - 120) * 0.63,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderInfo: {
    alignItems: 'center',
  },
  cardName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  issuer: {
    fontSize: 18,
    color: '#6C757D',
    marginBottom: 12,
  },
  defaultRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  defaultRate: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 6,
  },
  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: '#FFFFFF',
    marginHorizontal: -8,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    backgroundColor: '#fff',
  },
  deleteActionButton: {
    borderColor: '#f44336',
  },
  actionText: {
    marginLeft: 8,
    color: '#2196F3',
    fontWeight: '500',
    fontSize: 16,
  },
  deleteText: {
    color: '#f44336',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyBonuses: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C757D',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ADB5BD',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addBonusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 24,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBonusButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bonusList: {
    paddingHorizontal: 16,
  },
  bonusItem: {
    backgroundColor: '#F8F9FA',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  inactiveBonus: {
    opacity: 0.7,
    backgroundColor: '#FAFAFA',
  },
  expiringBonus: {
    borderColor: '#FF6B6B',
    borderWidth: 1.5,
  },
  bonusContent: {
    padding: 16,
  },
  bonusMainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bonusLeftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bonusCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bonusCategoryInfo: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 8,
  },
  bonusMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metadataText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginLeft: 4,
  },
  notes: {
    fontSize: 13,
    color: '#6C757D',
    fontStyle: 'italic',
  },
  bonusRightSection: {
    marginLeft: 16,
    paddingRight: 36, // Add padding to make room for the X button
  },
  rewardRateWrapper: {
    alignItems: 'flex-end',
  },
  rewardRateContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  rewardRate: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2196F3',
    letterSpacing: -1,
  },
  rewardRateInactive: {
    color: '#9E9E9E',
  },
  rewardRateUnit: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
    marginLeft: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#9E9E9E',
    borderRadius: 4,
    marginRight: 6,
  },
  inactiveBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  expiringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  expiringBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 2,
  },
  deleteIconButton: {
    backgroundColor: '#FFF5F5',
  },
});