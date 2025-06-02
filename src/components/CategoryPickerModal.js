import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FAVORITE_CATEGORIES_KEY } from '../config/categories';

export default function CategoryPickerModal({
  visible,
  onClose,
  onSelect,
  categories,
  selectedCategory,
  allowAddNew = false,
  onAddNew,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITE_CATEGORIES_KEY);
      if (stored) {
        setFavoriteIds(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (categoryId) => {
    try {
      let newFavorites;
      if (favoriteIds.includes(categoryId)) {
        newFavorites = favoriteIds.filter(id => id !== categoryId);
      } else {
        newFavorites = [...favoriteIds, categoryId];
      }
      setFavoriteIds(newFavorites);
      await AsyncStorage.setItem(FAVORITE_CATEGORIES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // Filter and sort categories
  const filteredAndSortedCategories = useMemo(() => {
    // Filter by search query
    let filtered = categories;
    if (searchQuery.trim()) {
      filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort: favorites first, then alphabetical
    return filtered.sort((a, b) => {
      const aIsFavorite = favoriteIds.includes(a.id);
      const bIsFavorite = favoriteIds.includes(b.id);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      return a.name.localeCompare(b.name);
    });
  }, [categories, searchQuery, favoriteIds]);

  const renderCategory = ({ item }) => {
    const isFavorite = favoriteIds.includes(item.id);
    const isSelected = selectedCategory?.id === item.id;

    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => {
          onSelect(item);
          onClose();
          setSearchQuery('');
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
          <Icon name={item.icon} size={24} color={item.color} />
        </View>
        <Text style={styles.categoryName}>{item.name}</Text>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon 
            name={isFavorite ? 'star' : 'star-border'} 
            size={20} 
            color={isFavorite ? '#FFB800' : '#999'} 
          />
        </TouchableOpacity>
        {isSelected && (
          <Icon name="check" size={20} color="#2196F3" style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const renderSeparator = () => {
    const firstNonFavoriteIndex = filteredAndSortedCategories.findIndex(
      cat => !favoriteIds.includes(cat.id)
    );
    
    if (firstNonFavoriteIndex === 0 || firstNonFavoriteIndex === -1) {
      return null;
    }

    return (
      <View style={styles.separator}>
        <Text style={styles.separatorText}>All Categories</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search categories..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Icon name="close" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {favoriteIds.length > 0 && searchQuery === '' && (
            <View style={styles.favoritesHeader}>
              <Icon name="star" size={16} color="#FFB800" />
              <Text style={styles.favoritesHeaderText}>Favorites</Text>
            </View>
          )}

          <FlatList
            data={filteredAndSortedCategories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            style={styles.categoryList}
            ItemSeparatorComponent={({ leadingItem }) => {
              const leadingIndex = filteredAndSortedCategories.indexOf(leadingItem);
              const isLastFavorite = favoriteIds.includes(leadingItem.id) && 
                (leadingIndex + 1 >= filteredAndSortedCategories.length || 
                 !favoriteIds.includes(filteredAndSortedCategories[leadingIndex + 1].id));
              
              return isLastFavorite && searchQuery === '' ? renderSeparator() : null;
            }}
            ListFooterComponent={
              allowAddNew && (
                <TouchableOpacity
                  style={styles.addNewButton}
                  onPress={() => {
                    onClose();
                    onAddNew?.();
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="add-circle-outline" size={24} color="#2196F3" />
                  <Text style={styles.addNewText}>Add New Category</Text>
                </TouchableOpacity>
              )
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No categories found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  favoritesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  favoritesHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  favoriteButton: {
    padding: 4,
    marginRight: 4,
  },
  checkIcon: {
    marginLeft: 4,
  },
  separator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
  },
  separatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addNewText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});