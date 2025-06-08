// src/screens/FindBestCardScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useCategoryData } from '../hooks/useCategoryData';
import { useCardFinder } from '../hooks/useCardFinder';

import CategoryPickerModal from '../components/CategoryPickerModal';
import ResultListItem from '../components/ResultListItem';
import { FinderInstructions } from '../components/FinderInstructions';
import { FinderEmptyState } from '../components/FinderEmptyState';

import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

export default function FindBestCardScreen() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const { categories, favoriteIds, loadData: loadCategoryData } = useCategoryData();
  const { results, loading, error, search, clearSearch } = useCardFinder();

  // --- THE FIX IS HERE ---
  // Use the correct variable name: loadCategoryData
  useFocusEffect(useCallback(() => {
    loadCategoryData();
  }, []));
  // --- END OF FIX ---

  const favoriteCategories = useMemo(() => {
    if (!categories || !favoriteIds) return [];
    const favoritesSet = new Set(favoriteIds);
    return categories
      .filter(cat => favoritesSet.has(cat.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, favoriteIds]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    clearSearch();
    if (showCategoryPicker) {
      setShowCategoryPicker(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedCategory || loading) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    search(selectedCategory.name);
  };

  const resetSearch = () => {
    setSelectedCategory(null);
    clearSearch();
  };
  
  const renderFavoriteCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.favoriteChip, selectedCategory?.id === item.id && styles.favoriteChipSelected]}
      onPress={() => handleCategorySelect(item)}
      activeOpacity={0.7}
    >
      <Icon name={item.icon} size={20} color={selectedCategory?.id === item.id ? colors.primary : item.color} />
      <Text style={[styles.favoriteText, selectedCategory?.id === item.id && styles.favoriteTextSelected]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={colors.primary} style={styles.centered} />;
    }
    if (results !== null) {
      if (results.length > 0) {
        return (
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.cardId}-${index}`}
            renderItem={({ item, index }) => (
              <ResultListItem result={item} isTopResult={index === 0} index={index} category={selectedCategory} />
            )}
            contentContainerStyle={styles.resultsList}
            ListHeaderComponent={
              <Text style={styles.resultsHeader}>
                Best cards for <Text style={{fontWeight: 'bold'}}>{selectedCategory.name}</Text>
              </Text>
            }
          />
        );
      } else {
        return <FinderEmptyState categoryName={selectedCategory?.name} onReset={resetSearch} error={error} />;
      }
    }
    return <FinderInstructions />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="search" size={40} color="#FFF" />
        <Text style={styles.headerTitle}>Find Your Best Card</Text>
        <Text style={styles.headerSubtitle}>Which card should you use?</Text>
      </View>
      
      <View style={styles.searchSection}>
          <View style={styles.searchControlsRow}>
              <TouchableOpacity style={styles.categorySelector} onPress={() => setShowCategoryPicker(true)}>
              {selectedCategory ? (
                  <>
                  <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color + '20'}]}>
                      <Icon name={selectedCategory.icon} size={24} color={selectedCategory.color} />
                  </View>
                  <Text style={styles.selectedCategoryText} numberOfLines={1}>{selectedCategory.name}</Text>
                  </>
              ) : (
                  <Text style={styles.placeholderText}>Select a category</Text>
              )}
              <Icon name="arrow-drop-down" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                  style={[styles.searchButton, !selectedCategory && styles.searchButtonDisabled]}
                  onPress={handleSearch}
                  disabled={!selectedCategory || loading}
              >
              <Text style={styles.searchButtonText}>Find</Text>
              </TouchableOpacity>
          </View>

          {favoriteCategories.length > 0 && (
              <View style={styles.favoritesContainer}>
                  <View style={styles.favoritesHeader}>
                      <Icon name="star" size={16} color={colors.warning} />
                      <Text style={styles.favoritesTitle}>Your Favorites</Text>
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

      <KeyboardAvoidingView 
        style={styles.contentArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderContent()}
      </KeyboardAvoidingView>

      <CategoryPickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={handleCategorySelect}
        categories={categories}
        selectedCategory={selectedCategory}
      />
    </View>
  );
}

// Styles are unchanged from the last stable version
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { ...typography.h2, color: colors.surface, marginTop: spacing.md },
  headerSubtitle: { ...typography.body1, color: colors.surface, opacity: 0.9 },
  searchSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.md,
    padding: spacing.md,
    margin: spacing.md,
  },
  searchControlsRow: { flexDirection: 'row', alignItems: 'center', },
  categorySelector: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    marginRight: spacing.md, minHeight: 56,
    borderWidth: 1, borderColor: colors.border,
  },
  categoryIcon: {
    width: 40, height: 40,
    borderRadius: borderRadius.lg, justifyContent: 'center',
    alignItems: 'center', marginRight: spacing.sm,
  },
  selectedCategoryText: { flex: 1, ...typography.body1, fontWeight: '600', color: colors.text },
  placeholderText: { flex: 1, ...typography.body1, color: colors.textSecondary },
  searchButton: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.lg,
    height: 56, justifyContent: 'center',
    alignItems: 'center', borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  searchButtonDisabled: { backgroundColor: colors.divider },
  searchButtonText: { ...typography.button, color: colors.surface, fontWeight: 'bold' },
  favoritesContainer: {
    marginTop: spacing.md, borderTopWidth: 1,
    borderTopColor: colors.divider, paddingTop: spacing.md,
  },
  favoritesHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.xs, marginBottom: spacing.sm,
  },
  favoritesTitle: {
      ...typography.caption, color: colors.textSecondary,
      fontWeight: 'bold', marginLeft: spacing.xs,
  },
  favoritesList: { paddingHorizontal: spacing.xs },
  favoriteChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md, borderRadius: borderRadius.round,
    marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  favoriteChipSelected: {
    borderColor: colors.primary, backgroundColor: colors.primaryBackground,
  },
  favoriteText: {
    ...typography.body2, color: colors.text,
    marginLeft: spacing.sm, fontWeight: '500',
  },
  favoriteTextSelected: { color: colors.primary, fontWeight: 'bold', },
  contentArea: {
    flex: 1,
  },
  resultsList: { paddingVertical: spacing.md, paddingHorizontal: spacing.md, paddingBottom: 100 },
  resultsHeader: {
    ...typography.body1, color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
});