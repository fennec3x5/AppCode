import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApi } from '../context/ApiContext';

export default function FindBestCardScreen() {
  const [category, setCategory] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState([
    'Groceries',
    'Dining',
    'Gas',
    'Travel',
    'Online Shopping'
  ]);
  
  const api = useApi();

  const handleSearch = async (searchTerm = category) => {
    if (!searchTerm.trim()) return;

    Keyboard.dismiss();
    
    try {
      setLoading(true);
      setSearched(true);
      const data = await api.findBestCard(searchTerm);
      setResults(data);
      
      // Add to recent searches if not already there
      if (!recentSearches.includes(searchTerm)) {
        setRecentSearches([searchTerm, ...recentSearches.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = ({ item, index }) => {
    const isTopResult = index === 0;
    
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
            <Text style={styles.categoryMatch}>
              {item.isDefault ? 'All purchases' : item.categoryName}
            </Text>
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

  const renderQuickSearch = ({ item }) => (
    <TouchableOpacity
      style={styles.quickSearchChip}
      onPress={() => {
        setCategory(item);
        handleSearch(item);
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.quickSearchText}>{item}</Text>
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
          Enter a spending category to see which card gives you the most rewards
        </Text>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={24} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={category}
              onChangeText={setCategory}
              placeholder="What are you buying?"
              placeholderTextColor="#999"
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
              autoCapitalize="words"
            />
            {category.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setCategory('');
                  setSearched(false);
                  setResults([]);
                }}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Icon name="close" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => handleSearch()}
            disabled={loading || !category.trim()}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {!searched && (
          <View style={styles.quickSearchContainer}>
            <Text style={styles.quickSearchLabel}>Popular categories:</Text>
            <FlatList
              horizontal
              data={recentSearches}
              renderItem={renderQuickSearch}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickSearchList}
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
                Found {results.length} card{results.length !== 1 ? 's' : ''} for "{category}"
              </Text>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="search-off" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>
                No cards found for "{category}"
              </Text>
              <Text style={styles.emptySubtext}>
                Try a different category or add bonus categories to your cards
              </Text>
              <TouchableOpacity
                style={styles.tryAgainButton}
                onPress={() => {
                  setCategory('');
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
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 12,
  },
  searchIcon: {
    paddingLeft: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 8,
    marginRight: 4,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickSearchContainer: {
    marginTop: 8,
  },
  quickSearchLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  quickSearchList: {
    paddingVertical: 4,
  },
  quickSearchChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  quickSearchText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
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