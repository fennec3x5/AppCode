// src/hooks/useCategoryData.js
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from '../context/ApiContext';
import { DEFAULT_CATEGORIES, CUSTOM_CATEGORIES_KEY, FAVORITE_CATEGORIES_KEY } from '../config/categories';

export const useCategoryData = () => {
  const [categories, setCategories] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const api = useApi();

  // Helper to ensure we are always working with an array
  const getSafeArray = (arr) => (Array.isArray(arr) ? arr : []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedCustom = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
      // Use helper for safety
      const savedCustomCategories = getSafeArray(storedCustom ? JSON.parse(storedCustom) : []);

      const storedFavorites = await AsyncStorage.getItem(FAVORITE_CATEGORIES_KEY);
      const savedFavoriteIds = storedFavorites ? new Set(JSON.parse(storedFavorites)) : new Set();
      
      const allCards = await api.getCards();
      const categoriesFromCards = new Set();
      // Use helper here to prevent crash if API returns non-array
      getSafeArray(allCards).forEach(card => {
        card.bonuses?.forEach(bonus => {
          if (bonus.categoryName) categoriesFromCards.add(bonus.categoryName);
        });
      });
      
      const existingCategoryNames = new Set(
        [...getSafeArray(DEFAULT_CATEGORIES), ...savedCustomCategories].map(c => c.name.toLowerCase())
      );

      const newDiscoveredCategories = [];
      categoriesFromCards.forEach(name => {
        if (!existingCategoryNames.has(name.toLowerCase())) {
          newDiscoveredCategories.push({
            id: `custom_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
            name: name,
            icon: 'category',
            color: '#666666',
            isCustom: true,
          });
        }
      });

      const allCustomCategories = [...savedCustomCategories, ...newDiscoveredCategories];
      if (newDiscoveredCategories.length > 0) {
        await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(allCustomCategories));
      }
      
      // Final safe composition before sorting
      const allCategories = [...getSafeArray(DEFAULT_CATEGORIES), ...allCustomCategories].sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      setCategories(allCategories);
      setFavoriteIds(savedFavoriteIds);
    } catch (error) {
      console.error('Failed to load category data:', error);
      Alert.alert('Error', 'Could not load category data. Please try again later.');
      setCategories(getSafeArray(DEFAULT_CATEGORIES));
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveCustomCategories = async (customCats) => {
    const catsToSave = getSafeArray(customCats);
    await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(catsToSave));
    
    const allCategories = [...getSafeArray(DEFAULT_CATEGORIES), ...catsToSave].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    setCategories(allCategories);
  };

  const addCategory = async (newCategoryData) => {
    const customCats = categories.filter(c => c.isCustom);
    const newCategory = {
      id: `custom_${Date.now()}`,
      ...newCategoryData,
      isCustom: true,
    };
    await saveCustomCategories([...customCats, newCategory]);
    return newCategory;
  };
  
  const updateCategory = (id, updatedData) => {
    const customCats = categories.filter(c => c.isCustom);
    const updated = customCats.map(cat => (cat.id === id ? { ...cat, ...updatedData } : cat));
    saveCustomCategories(updated);
  };
  
  const deleteCategory = (idToDelete) => {
    const customCats = categories.filter(c => c.isCustom);
    const updated = customCats.filter(cat => cat.id !== idToDelete);
    saveCustomCategories(updated);
  };

  const toggleFavorite = useCallback(async (categoryId) => {
    setFavoriteIds(prevIds => {
      const newIds = new Set(prevIds);
      if (newIds.has(categoryId)) newIds.delete(categoryId);
      else newIds.add(categoryId);
      AsyncStorage.setItem(FAVORITE_CATEGORIES_KEY, JSON.stringify(Array.from(newIds)));
      return newIds;
    });
  }, []);

  return { 
    categories, 
    favoriteIds: Array.from(favoriteIds),
    toggleFavorite, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    isLoading,
    loadData,
  };
};