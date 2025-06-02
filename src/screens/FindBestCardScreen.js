import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from '../context/ApiContext';
import { DEFAULT_CATEGORIES, CUSTOM_CATEGORIES_KEY, FAVORITE_CATEGORIES_KEY } from '../config/categories';
import CategoryPickerModal from '../components/CategoryPickerModal';

export default function FindBestCardScreen() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categories, setCategories] = useState([]);
  const [favoriteCategories, setFavoriteCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  const api = useApi();

  // Load categories and favorites on mount
  useEffect(() => {
    loadCategories();
    loadFavorites();
  }, []);

  // Update favorite categories when categories or favorites change
  useEffect(() => {
    updateFavoriteCategories();
  }, [categories]);

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
    if (!selectedCategory) return;
    
    try {
      setLoading(true);
      setSearched(true);
      const data = await api.findBestCard(selectedCategory.name);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
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

  const renderResult = ({ item, index }) => {
    const isTopResult = index === 0;
    const categoryInfo = getCategoryInfo(item.categoryName);
    
    return (
      <View style={[
        styles.resultItem,
        isTopResult && styles.topResultItem
      ]}>
        {isTopResult && (
          <View style={styles.bestBadge}>
            <Icon name="star" size={16} color="#fff" />
            <Text style={styles.bestBadgeText}>BEST</Text>
          </View>
        )}
        
        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            <Icon 
              name="credit-card" 
              size={32} 
              color={isTopResult ? '#4CAF50' : '#2196F3'} 
            />
            <View style={styles.resultInfo}>
              <Text style={styles.cardName}>{item.cardName}</Text>
              {item.issuer && (
                <Text style={styles.issuer}>{item.issuer}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.rewardContainer}>
            <View style={styles.categoryWithIcon}>
              <View style={[styles.resultCategoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                <Icon name={categoryInfo.icon} size={16} color={categoryInfo.color} />
              </View>
              <Text style={styles.categoryMatch}>
                {item.isDefault ? 'All purchases' : item.categoryName}
              </Text>
            </View>
            <Text style={[
              styles.rewardRate,
              isTopResult && styles.topRewardRate
            ]}>
              {item.rewardRate}
              {item.rewardType === 'percentage' ? '%' : 'x'}
            </Text>
          </View>
          
          {item.notes && (
            <View style={styles.notesContainer}>
              <Icon name="info-outline" size={14} color="#999" />
              <Text style={styles.notes}>{item.notes}</Text>
            </View>
          )}
          
          {(item.startDate || item.endDate) && !item.isDefault && (
            <View style={styles.dateContainer}>
              <Icon name="schedule" size={14} color="#666" />
              <Text style={styles.dateRange}>
                {item.startDate && `From ${new Date(item.startDate).toLocaleDateString()}`}
                {item.startDate && item.endDate && ' • '}
                {item.endDate && `Until ${new Date(item.endDate).toLocaleDateString()}`}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderFavoriteCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.favoriteChip,
        selectedCategory?.id === item.id && styles.favoriteChipSelected
      ]}
      onPress={() => {
        setSelectedCategory(item);
        setSearched(false);
        setResults([]);
      }}
      activeOpacity={0.7}
    >
      <Icon name={item.icon} size={16} color={item.color} style={styles.favoriteIcon} />
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
      <View style={styles.searchSection}>
        <Text style={styles.searchTitle}>Find Your Best Card</Text>
        <Text style={styles.searchSubtitle}>
          Select a category to see which card gives you the most rewards
        </Text>
        
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryPicker(true)}
            activeOpacity={0.7}
          >
            {selectedCategory ? (
              <>
                <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategory.color + '20' }]}>
                  <Icon name={selectedCategory.icon} size={20} color={selectedCategory.color} />
                </View>
                <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
              </>
            ) : (
              <Text style={styles.placeholderText}>Select a category</Text>
            )}
            <Icon name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.searchButton, !selectedCategory && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={loading || !selectedCategory}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {!searched && favoriteCategories.length > 0 && (
          <View style={styles.favoritesContainer}>
            <View style={styles.favoritesHeader}>
              <Icon name="star" size={16} color="#FFB800" />
              <Text style={styles.favoritesLabel}>Favorite categories:</Text>
            </View>
            <FlatList
              horizontal
              data={favoriteCategories}
              renderItem={renderFavoriteCategory}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favoritesList}
            />
          </View>
        )}
      </View>

      {searched && (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item, index) => `${item.cardId}-${index}`}
          contentContainerStyle={styles.resultsList}
          ListHeaderComponent={
            results.length > 0 && (
              <Text style={styles.resultsHeader}>
                Found {results.length} card{results.length !== 1 ? 's' : ''} for {selectedCategory.name}
              </Text>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="search-off" size={64} color="#E0E0E0" />
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
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.tryAgainText}>Try Another Search</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={(category) => {
          setSelectedCategory(category);
          setSearched(false);
          setResults([]);
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
    backgroundColor: '#f5f5f5',
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  searchSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categorySelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
  },
  selectedCategoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedCategoryText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: '#999',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  favoritesContainer: {
    marginTop: 8,
  },
  favoritesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoritesLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  favoritesList: {
    paddingVertical: 4,
  },
  favoriteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  favoriteChipSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  favoriteIcon: {
    marginRight: 6,
  },
  favoriteText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  favoriteTextSelected: {
    color: '#2196F3',
  },
  resultsHeader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  resultsList: {
    paddingVertical: 16,
  },
  resultItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topResultItem: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  bestBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  bestBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  resultContent: {
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  issuer: {
    fontSize: 14,
    color: '#666',
  },
  rewardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultCategoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryMatch: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  rewardRate: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  topRewardRate: {
    color: '#4CAF50',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  notes: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 6,
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateRange: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 48,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  tryAgainButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  tryAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});