import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useApi } from '../context/ApiContext';
import { DEFAULT_CATEGORIES, CUSTOM_CATEGORIES_KEY, FAVORITE_CATEGORIES_KEY } from '../config/categories';
import CategoryPickerModal from '../components/CategoryPickerModal';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

const { width } = Dimensions.get('window');

export default function FindBestCardScreen() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categories, setCategories] = useState([]);
  const [favoriteCategories, setFavoriteCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  const api = useApi();

  // Debug: Check API availability
  useEffect(() => {
    console.log('FindBestCardScreen: API object available:', !!api);
    console.log('FindBestCardScreen: findBestCard method type:', typeof api?.findBestCard);
  }, []);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const searchButtonScale = useRef(new Animated.Value(1)).current;
  const categoryScale = useRef(new Animated.Value(1)).current;
  const resultAnimations = useRef({}).current;
  const favoritesSlideAnim = useRef(new Animated.Value(-50)).current;

  // Load categories and favorites on mount
  useEffect(() => {
    loadCategories();
    animateScreenEntry();
  }, []);

  const animateScreenEntry = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(favoritesSlideAnim, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getResultAnimation = (index) => {
    if (!resultAnimations[index]) {
      resultAnimations[index] = {
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(50),
        scale: new Animated.Value(0.9),
      };
    }
    return resultAnimations[index];
  };

  const animateResults = () => {
    results.forEach((_, index) => {
      const animation = getResultAnimation(index);
      Animated.parallel([
        Animated.timing(animation.opacity, {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(animation.translateY, {
          toValue: 0,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.spring(animation.scale, {
          toValue: 1,
          tension: 40,
          friction: 8,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Reload favorites when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [categories])
  );

  // Update favorite categories when categories or favorites change
  useEffect(() => {
    updateFavoriteCategories();
  }, [categories]);

  useEffect(() => {
    if (results.length > 0) {
      animateResults();
    }
  }, [results]);

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

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITE_CATEGORIES_KEY);
      if (stored) {
        const favoriteIds = JSON.parse(stored);
        updateFavoriteCategories(favoriteIds);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const updateFavoriteCategories = async (favoriteIds = null) => {
    try {
      if (!favoriteIds) {
        const stored = await AsyncStorage.getItem(FAVORITE_CATEGORIES_KEY);
        favoriteIds = stored ? JSON.parse(stored) : [];
      }
      
      const favorites = categories.filter(cat => favoriteIds.includes(cat.id));
      setFavoriteCategories(favorites);
    } catch (error) {
      console.error('Error updating favorite categories:', error);
    }
  };

  const handleSearch = async () => {
    // Prevent multiple simultaneous searches
    if (loading) {
      console.log('Search already in progress, ignoring...');
      return;
    }
    
    if (!selectedCategory) {
      console.log('No category selected');
      return;
    }
    
    console.log('Starting search for category:', selectedCategory.name);
    
    try {
      // Set loading first to prevent multiple clicks
      setLoading(true);
      
      // Haptic feedback - only on iOS
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Animate button press
      Animated.sequence([
        Animated.timing(searchButtonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(searchButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Reset previous animations
      Object.keys(resultAnimations).forEach(key => {
        resultAnimations[key].opacity.setValue(0);
        resultAnimations[key].translateY.setValue(50);
        resultAnimations[key].scale.setValue(0.9);
      });
      
      console.log('About to call API findBestCard with:', selectedCategory.name);
      
      // Make the API call
      const data = await api.findBestCard(selectedCategory.name);
      
      console.log('API Response received:', data);
      
      // Set results and mark as searched
      setResults(data || []);
      setSearched(true);
      
      if (!data || data.length === 0) {
        console.log('No results found for category:', selectedCategory.name);
      } else {
        console.log(`Found ${data.length} results`);
      }
    } catch (error) {
      console.error('Search error occurred:', error);
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Set empty results and still show the results view
      setResults([]);
      setSearched(true);
      
      // Show user-friendly error
      Alert.alert(
        'Search Failed', 
        'Unable to find best cards. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      // Always reset loading state
      setLoading(false);
      console.log('Search completed');
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSearched(false);
    setResults([]);
    
    // Haptic feedback - only on iOS
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Animated.sequence([
      Animated.timing(categoryScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(categoryScale, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
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

  const renderResult = ({ item, index }) => {
    const isTopResult = index === 0;
    const categoryInfo = getCategoryInfo(item.categoryName);
    const animation = getResultAnimation(index);
    
    return (
      <Animated.View
        style={[
          {
            opacity: animation.opacity,
            transform: [
              { translateY: animation.translateY },
              { scale: animation.scale },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.resultItem,
            isTopResult && styles.topResultItem
          ]}
          activeOpacity={0.9}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
        >
          {isTopResult && (
            <View style={styles.bestBadgeContainer}>
              <View style={styles.bestBadge}>
                <Icon name="emoji-events" size={16} color="#FFF" />
                <Text style={styles.bestBadgeText}>BEST MATCH</Text>
              </View>
            </View>
          )}
          
          <View style={styles.resultContent}>
            <View style={styles.resultHeader}>
              <View style={styles.cardImageContainer}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                ) : (
                  <View style={[
                    styles.cardIconPlaceholder,
                    isTopResult && styles.cardIconPlaceholderTop
                  ]}>
                    <Icon 
                      name="credit-card" 
                      size={28} 
                      color={isTopResult ? colors.success : colors.primary} 
                    />
                  </View>
                )}
              </View>
              
              <View style={styles.resultInfo}>
                <Text style={[styles.cardName, isTopResult && styles.cardNameTop]}>
                  {item.cardName}
                </Text>
                {item.issuer && (
                  <Text style={styles.issuer}>{item.issuer}</Text>
                )}
              </View>
              
              <View style={styles.rewardRateContainer}>
                <Text style={[
                  styles.rewardRate,
                  isTopResult && styles.rewardRateTop
                ]}>
                  {item.rewardRate}
                </Text>
                <Text style={[
                  styles.rewardRateUnit,
                  isTopResult && styles.rewardRateTop
                ]}>
                  {item.rewardType === 'percentage' ? '%' : 'x'}
                </Text>
              </View>
            </View>
            
            <View style={styles.categoryBadgeContainer}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '15' }]}>
                <Icon name={categoryInfo.icon} size={16} color={categoryInfo.color} />
                <Text style={[styles.categoryBadgeText, { color: categoryInfo.color }]}>
                  {item.isDefault ? 'All purchases' : item.categoryName}
                </Text>
              </View>
            </View>
            
            {item.notes && (
              <View style={styles.notesContainer}>
                <Icon name="info-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.notes}>{item.notes}</Text>
              </View>
            )}
            
            {(item.startDate || item.endDate) && !item.isDefault && (
              <View style={styles.dateContainer}>
                <Icon name="schedule" size={14} color={colors.textSecondary} />
                <Text style={styles.dateRange}>
                  {item.endDate && `Valid until ${new Date(item.endDate).toLocaleDateString()}`}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderFavoriteCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.favoriteChip,
        selectedCategory?.id === item.id && styles.favoriteChipSelected
      ]}
      onPress={() => {
        handleCategorySelect(item);
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.favoriteIconContainer, { backgroundColor: item.color + '20' }]}>
        <Icon name={item.icon} size={18} color={item.color} />
      </View>
      <Text style={[
        styles.favoriteText,
        selectedCategory?.id === item.id && styles.favoriteTextSelected
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View
        style={[
          styles.headerSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: headerScale }],
          },
        ]}
      >
        <View style={styles.headerGradient}>
          <Icon name="search" size={40} color="#FFF" />
          <Text style={styles.headerTitle}>Find Your Best Card</Text>
          <Text style={styles.headerSubtitle}>
            Discover which card gives you the highest rewards
          </Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.searchSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.searchContainer,
            { transform: [{ scale: categoryScale }] },
          ]}
        >
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => {
              setShowCategoryPicker(true);
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            activeOpacity={0.7}
          >
            {selectedCategory ? (
              <>
                <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategory.color + '20' }]}>
                  <Icon name={selectedCategory.icon} size={24} color={selectedCategory.color} />
                </View>
                <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
              </>
            ) : (
              <View style={styles.placeholderContent}>
                <Icon name="category" size={24} color={colors.textLight} />
                <Text style={styles.placeholderText}>Select a category</Text>
              </View>
            )}
            <Icon name="arrow-drop-down" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <Animated.View style={{ transform: [{ scale: searchButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.searchButton,
                !selectedCategory && styles.searchButtonDisabled
              ]}
              onPress={handleSearch}
              disabled={loading || !selectedCategory}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={styles.searchButtonContent}>
                  <Icon name="search" size={20} color="#FFF" />
                  <Text style={styles.searchButtonText}>Search</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {favoriteCategories.length > 0 && (
          <Animated.View
            style={[
              styles.favoritesContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateX: favoritesSlideAnim }],
              },
            ]}
          >
            <View style={styles.favoritesHeader}>
              <Icon name="star" size={16} color={colors.warning} />
              <Text style={styles.favoritesLabel}>Quick select:</Text>
            </View>
            <FlatList
              horizontal
              data={favoriteCategories}
              renderItem={renderFavoriteCategory}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favoritesList}
            />
          </Animated.View>
        )}
      </Animated.View>

      {searched && (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item, index) => `${item.cardId}-${index}`}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            results.length > 0 && (
              <View style={styles.resultsHeaderContainer}>
                <Text style={styles.resultsHeader}>
                  Found {results.length} card{results.length !== 1 ? 's' : ''} for
                </Text>
                <View style={[styles.resultsCategory, { backgroundColor: selectedCategory.color + '15' }]}>
                  <Icon name={selectedCategory.icon} size={16} color={selectedCategory.color} />
                  <Text style={[styles.resultsCategoryText, { color: selectedCategory.color }]}>
                    {selectedCategory.name}
                  </Text>
                </View>
              </View>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Icon name="credit-card-off" size={64} color={colors.textLight} />
              </View>
              <Text style={styles.emptyText}>
                No cards found for {selectedCategory.name}
              </Text>
              <Text style={styles.emptySubtext}>
                Add bonus categories to your cards to see them here
              </Text>
              <TouchableOpacity
                style={styles.tryAgainButton}
                onPress={() => {
                  setSelectedCategory(null);
                  setSearched(false);
                  setResults([]);
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                activeOpacity={0.8}
              >
                <Icon name="refresh" size={20} color="#FFF" />
                <Text style={styles.tryAgainText}>Try Another Search</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {!searched && (
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionCard}>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Choose a category</Text>
                <Text style={styles.stepDescription}>
                  Select from your favorite categories or browse all
                </Text>
              </View>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Hit search</Text>
                <Text style={styles.stepDescription}>
                  We'll find your highest earning cards instantly
                </Text>
              </View>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Maximize rewards</Text>
                <Text style={styles.stepDescription}>
                  Use the best card for each purchase category
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={(category) => {
          setSelectedCategory(category);
          setShowCategoryPicker(false);
          console.log('Category selected:', category);
        }}
        categories={categories}
        selectedCategory={selectedCategory}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    overflow: 'hidden',
  },
  headerGradient: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...shadows.lg,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.surface,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body1,
    color: colors.surface,
    opacity: 0.9,
  },
  searchSection: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: -spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categorySelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    minHeight: 56,
  },
  selectedCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  selectedCategoryText: {
    flex: 1,
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  placeholderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeholderText: {
    ...typography.body1,
    color: colors.textLight,
    marginLeft: spacing.md,
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    minWidth: 100,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  searchButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  searchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButtonText: {
    ...typography.button,
    color: colors.surface,
    marginLeft: spacing.sm,
  },
  favoritesContainer: {
    marginTop: spacing.md,
  },
  favoritesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  favoritesLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  favoritesList: {
    paddingVertical: spacing.xs,
  },
  favoriteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  favoriteChipSelected: {
    backgroundColor: colors.primaryBackground,
    borderColor: colors.primary,
  },
  favoriteIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  favoriteText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  favoriteTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  resultsHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  resultsHeader: {
    ...typography.body1,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  resultsCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  resultsCategoryText: {
    ...typography.body2,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  resultsList: {
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  resultItem: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  topResultItem: {
    borderWidth: 2,
    borderColor: colors.success,
    ...shadows.md,
  },
  bestBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  bestBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestBadgeText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '700',
    marginLeft: spacing.xs,
    letterSpacing: 0.5,
  },
  resultContent: {
    padding: spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardImageContainer: {
    marginRight: spacing.md,
  },
  cardImage: {
    width: 64,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
  },
  cardIconPlaceholder: {
    width: 64,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconPlaceholderTop: {
    backgroundColor: colors.success + '20',
  },
  resultInfo: {
    flex: 1,
  },
  cardName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: 2,
  },
  cardNameTop: {
    color: colors.success,
  },
  issuer: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  rewardRateContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  rewardRate: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: '800',
  },
  rewardRateTop: {
    color: colors.success,
  },
  rewardRateUnit: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 2,
  },
  categoryBadgeContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  categoryBadgeText: {
    ...typography.body2,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  notes: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: spacing.xs,
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  dateRange: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body1,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.round,
    ...shadows.sm,
  },
  tryAgainText: {
    ...typography.button,
    color: colors.surface,
    marginLeft: spacing.sm,
  },
  instructionsContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  instructionCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  stepDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});