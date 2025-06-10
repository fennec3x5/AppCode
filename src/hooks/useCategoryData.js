// src/hooks/useCategoryData.js
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_CATEGORIES, FAVORITE_CATEGORIES_KEY } from '../config/categories';

export const useCategoryData = () => {
  const [categories, setCategories] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const api = useApi();
  const { user } = useAuth();

  // Helper to ensure we are always working with an array
  const getSafeArray = (arr) => (Array.isArray(arr) ? arr : []);

  const loadData = useCallback(async () => {
    if (!user) {
      setCategories(getSafeArray(DEFAULT_CATEGORIES));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get user profile with custom categories
      const userProfile = await api.getUserProfile();
      const userCustomCategories = getSafeArray(userProfile.customCategories);

      // Get favorite categories for this user
      const favKey = `${FAVORITE_CATEGORIES_KEY}_${user.uid}`;
      const storedFavorites = await AsyncStorage.getItem(favKey);
      const savedFavoriteIds = storedFavorites ? new Set(JSON.parse(storedFavorites)) : new Set();
      
      // Get all cards to find categories in use
      const allCards = await api.getCards();
      const categoriesFromCards = new Set();
      
      getSafeArray(allCards).forEach(card => {
        card.bonuses?.forEach(bonus => {
          if (bonus.categoryName) categoriesFromCards.add(bonus.categoryName);
        });
      });
      
      // Check which categories from cards are not in our list
      const existingCategoryNames = new Set(
        [...getSafeArray(DEFAULT_CATEGORIES), ...userCustomCategories].map(c => c.name.toLowerCase())
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

      // If we found new categories, update user's custom categories
      if (newDiscoveredCategories.length > 0) {
        const allCustomCategories = [...userCustomCategories, ...newDiscoveredCategories];
        await api.updateUserCategories(allCustomCategories);
      }
      
      // Combine all categories
      const allCategories = [
        ...getSafeArray(DEFAULT_CATEGORIES), 
        ...userCustomCategories,
        ...newDiscoveredCategories
      ].sort((a, b) => a.name.localeCompare(b.name));

      setCategories(allCategories);
      setFavoriteIds(savedFavoriteIds);
    } catch (error) {
      console.error('Failed to load category data:', error);
      Alert.alert('Error', 'Could not load category data. Please try again later.');
      setCategories(getSafeArray(DEFAULT_CATEGORIES));
    } finally {
      setIsLoading(false);
    }
  }, [api, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveCustomCategories = async (customCats) => {
    if (!user) return;
    
    const catsToSave = getSafeArray(customCats);
    
    try {
      // Save to server
      await api.updateUserCategories(catsToSave);
      
      // Update local state
      const allCategories = [...getSafeArray(DEFAULT_CATEGORIES), ...catsToSave].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      setCategories(allCategories);
    } catch (error) {
      console.error('Failed to save custom categories:', error);
      Alert.alert('Error', 'Could not save categories. Please try again.');
    }
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
  
  const updateCategory = async (id, updatedData) => {
    const customCats = categories.filter(c => c.isCustom);
    const updated = customCats.map(cat => (cat.id === id ? { ...cat, ...updatedData } : cat));
    await saveCustomCategories(updated);
  };
  
  const deleteCategory = async (idToDelete) => {
    const customCats = categories.filter(c => c.isCustom);
    const updated = customCats.filter(cat => cat.id !== idToDelete);
    await saveCustomCategories(updated);
  };

  const toggleFavorite = useCallback(async (categoryId) => {
    if (!user) return;
    
    setFavoriteIds(prevIds => {
      const newIds = new Set(prevIds);
      if (newIds.has(categoryId)) newIds.delete(categoryId);
      else newIds.add(categoryId);
      
      // Save user-specific favorites
      const favKey = `${FAVORITE_CATEGORIES_KEY}_${user.uid}`;
      AsyncStorage.setItem(favKey, JSON.stringify(Array.from(newIds)));
      
      return newIds;
    });
  }, [user]);

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