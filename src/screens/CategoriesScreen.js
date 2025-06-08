// src/screens/CategoriesScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from '../context/ApiContext';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';
import { DEFAULT_CATEGORIES, CUSTOM_CATEGORIES_KEY, FAVORITE_CATEGORIES_KEY } from '../config/categories';


export default function CategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('category');
  const [selectedColor, setSelectedColor] = useState('#666666');
  const [editingCategory, setEditingCategory] = useState(null);
  const api = useApi();

  // Load custom categories and favorites from storage
  useEffect(() => {
    loadCustomCategories();
    loadFavorites();
  }, []);

  const loadCustomCategories = async () => {
  try {
    // Load saved custom categories from AsyncStorage
    const stored = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const savedCustomCategories = stored ? JSON.parse(stored) : [];
    
    // Load all cards to find categories that might not be in storage
    const allCards = await api.getCards();
    const categoriesFromCards = new Set();
    
    // Extract all unique category names from cards
    allCards.forEach(card => {
      if (card.bonuses && Array.isArray(card.bonuses)) {
        card.bonuses.forEach(bonus => {
          if (bonus.categoryName) {
            categoriesFromCards.add(bonus.categoryName);
          }
        });
      }
    });
    
    // Find categories that exist in cards but not in DEFAULT_CATEGORIES or saved custom categories
    const allExistingCategories = [...DEFAULT_CATEGORIES, ...savedCustomCategories];
    const existingCategoryNames = allExistingCategories.map(cat => cat.name.toLowerCase());
    
    const newCustomCategories = [];
    categoriesFromCards.forEach(categoryName => {
      if (!existingCategoryNames.includes(categoryName.toLowerCase())) {
        // This is a category that was created on a card but not saved to custom categories
        newCustomCategories.push({
          id: `custom_${categoryName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
          name: categoryName,
          icon: 'category',
          color: '#666666',
          isCustom: true,
        });
      }
    });
    
    // Merge saved custom categories with newly discovered ones
    const allCustomCategories = [...savedCustomCategories, ...newCustomCategories];
    
    // Save the updated list back to storage if we found new categories
    if (newCustomCategories.length > 0) {
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(allCustomCategories));
    }
    
    setCustomCategories(allCustomCategories);
  } catch (error) {
    console.error('Error loading custom categories:', error);
    // If loading from API fails, at least load from storage
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
      if (stored) {
        setCustomCategories(JSON.parse(stored));
      }
    } catch (storageError) {
      console.error('Error loading from storage:', storageError);
    }
  }
};

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

  const saveCustomCategories = async (categories) => {
    try {
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
      setCustomCategories(categories);
    } catch (error) {
      console.error('Error saving custom categories:', error);
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
    // Combine default and custom categories
    const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
    
    // Filter by search query
    let filtered = allCategories;
    if (searchQuery.trim()) {
      filtered = allCategories.filter(cat =>
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
  }, [customCategories, searchQuery, favoriteIds]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    // Check if category already exists
    const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
    const exists = allCategories.some(
      cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );

    if (exists && !editingCategory) {
      Alert.alert('Error', 'A category with this name already exists');
      return;
    }

    if (editingCategory) {
      // Update existing custom category
      const updated = customCategories.map(cat =>
        cat.id === editingCategory.id
          ? {
              ...cat,
              name: newCategoryName.trim(),
              icon: selectedIcon,
              color: selectedColor,
            }
          : cat
      );
      saveCustomCategories(updated);
    } else {
      // Add new custom category
      const newCategory = {
        id: `custom_${Date.now()}`,
        name: newCategoryName.trim(),
        icon: selectedIcon,
        color: selectedColor,
        isCustom: true,
      };
      saveCustomCategories([...customCategories, newCategory]);
    }

    resetModal();
  };

  const handleEditCategory = (category) => {
    if (!category.isCustom) {
      Alert.alert('Info', 'Default categories cannot be edited');
      return;
    }

    setEditingCategory(category);
    setNewCategoryName(category.name);
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setShowAddModal(true);
  };

  const handleDeleteCategory = (category) => {
    if (!category.isCustom) {
      Alert.alert('Info', 'Default categories cannot be deleted');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const filtered = customCategories.filter(cat => cat.id !== category.id);
            saveCustomCategories(filtered);
          },
        },
      ]
    );
  };

  const resetModal = () => {
    setShowAddModal(false);
    setNewCategoryName('');
    setSelectedIcon('category');
    setSelectedColor('#666666');
    setEditingCategory(null);
  };

  const renderCategory = ({ item }) => {
    const isFavorite = favoriteIds.includes(item.id);
    
    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => handleEditCategory(item)}
        onLongPress={() => handleDeleteCategory(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
          <Icon name={item.icon} size={24} color={item.color} />
        </View>
        <Text style={styles.categoryName}>{item.name}</Text>
        {item.isCustom && (
          <View style={styles.customBadge}>
            <Text style={styles.customBadgeText}>Custom</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon 
            name={isFavorite ? 'star' : 'star-border'} 
            size={24} 
            color={isFavorite ? '#FFB800' : '#999'} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSeparator = () => {
    const firstNonFavoriteIndex = filteredAndSortedCategories.findIndex(
      cat => !favoriteIds.includes(cat.id)
    );
    
    if (firstNonFavoriteIndex === 0 || firstNonFavoriteIndex === -1 || searchQuery.trim()) {
      return null;
    }

    return (
      <View style={styles.separator}>
        <Text style={styles.separatorText}>All Categories</Text>
      </View>
    );
  };

  const iconOptions = [
    'category', 'shopping-cart', 'local-gas-station', 'restaurant',
    'flight', 'computer', 'movie', 'play-circle-outline',
    'power', 'local-pharmacy', 'home', 'store',
    'warehouse', 'train', 'local-taxi', 'hotel',
    'fitness-center', 'autorenew', 'business-center', 'security',
    'school', 'local-hospital', 'pets', 'directions-car',
    'local-mall', 'beach-access', 'spa', 'golf-course',
    'local-cafe', 'local-bar', 'fastfood', 'more-horiz'
  ];

  const colorOptions = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
    '#795548', '#9E9E9E', '#607D8B', '#000000'
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
      <View style={styles.headerGradient}>
        <Icon name="category" size={40} color="#FFF" />
        <Text style={styles.headerTitle}>Categories</Text>
        <Text style={styles.headerSubtitle}>
          Manage your bonus categories and favorites
        </Text>
      </View>
    </View>

    {/* Update searchContainer style */}
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
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={({ leadingItem }) => {
          if (!leadingItem || searchQuery.trim()) return null;
          const leadingIndex = filteredAndSortedCategories.indexOf(leadingItem);
          const isLastFavorite = favoriteIds.includes(leadingItem.id) && 
            (leadingIndex + 1 >= filteredAndSortedCategories.length || 
             !favoriteIds.includes(filteredAndSortedCategories[leadingIndex + 1].id));
          
          return isLastFavorite ? renderSeparator() : null;
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerText}>
              Manage your bonus categories here. Tap the star to favorite, long press custom categories to delete.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No categories found</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Category Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </Text>
              <TouchableOpacity onPress={resetModal}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="e.g., Pet Supplies"
                placeholderTextColor="#999"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Icon</Text>
              <FlatList
                horizontal
                data={iconOptions}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.iconOption,
                      selectedIcon === item && styles.iconOptionSelected
                    ]}
                    onPress={() => setSelectedIcon(item)}
                  >
                    <Icon 
                      name={item} 
                      size={24} 
                      color={selectedIcon === item ? '#fff' : '#666'} 
                    />
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconList}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Color</Text>
              <View style={styles.colorGrid}>
                {colorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Icon name="check" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={resetModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddCategory}
              >
                <Text style={styles.saveButtonText}>
                  {editingCategory ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md, // Changed from negative margin to positive
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body1,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
  },
  favoritesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  favoritesHeaderText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  customBadge: {
    backgroundColor: colors.primaryBackground,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  customBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  favoriteButton: {
    padding: spacing.sm,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  separatorText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body1,
    color: colors.textLight,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
    maxHeight: '90%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    color: colors.text,
  },
  iconList: {
    paddingVertical: spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  iconOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.xs,
    ...shadows.sm,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.surface,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.surface,
  },
});