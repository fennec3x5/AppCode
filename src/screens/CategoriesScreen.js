// src/screens/CategoriesScreen.js
import React, { useState, useEffect } from 'react';
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
import { DEFAULT_CATEGORIES } from '../config/categories';

const CUSTOM_CATEGORIES_KEY = '@custom_categories';

export default function CategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('category');
  const [selectedColor, setSelectedColor] = useState('#666666');
  const [editingCategory, setEditingCategory] = useState(null);

  // Load custom categories from storage
  useEffect(() => {
    loadCustomCategories();
  }, []);

  const loadCustomCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCustomCategories(parsed);
      }
    } catch (error) {
      console.error('Error loading custom categories:', error);
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

  // Combine default and custom categories
  useEffect(() => {
    const combined = [...DEFAULT_CATEGORIES, ...customCategories];
    setCategories(combined);
  }, [customCategories]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    // Check if category already exists
    const exists = categories.some(
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

  const renderCategory = ({ item }) => (
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
      <Icon name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );

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
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerText}>
              Manage your bonus categories here. Long press to delete custom categories.
            </Text>
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
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    paddingBottom: 80,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  customBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  customBadgeText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  iconList: {
    paddingVertical: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  iconOptionSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});