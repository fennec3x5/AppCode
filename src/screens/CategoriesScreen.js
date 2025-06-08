// src/screens/CategoriesScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCategoryData } from '../hooks/useCategoryData';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';
import CategoryListItem from '../components/CategoryListItem';
import CategoryEditorModal from '../components/CategoryEditorModal';

export default function CategoriesScreen({ navigation }) {
  const {
    categories,
    favoriteIds,
    toggleFavorite,
    addCategory,
    updateCategory,
    deleteCategory,
    isLoading,
  } = useCategoryData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const openAddModal = () => {
    setEditingCategory(null);
    setModalVisible(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setModalVisible(true);
  };

  const handleModalSubmit = (categoryData) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
    } else {
      addCategory(categoryData);
    }
    setModalVisible(false);
    setEditingCategory(null);
  };

  const sections = useMemo(() => {
    let filtered = categories;
    if (searchQuery.trim()) {
      filtered = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // If searching, show a single flat list.
    if (searchQuery.trim()) {
      return [{ title: 'Search Results', data: filtered }];
    }

    // Otherwise, split into Favorites and All Categories.
    const favorites = filtered.filter(cat => favoriteIds.includes(cat.id));
    const nonFavorites = filtered.filter(cat => !favoriteIds.includes(cat.id));

    const result = [];
    if (favorites.length > 0) {
      result.push({ title: 'Favorites', data: favorites });
    }
    if (nonFavorites.length > 0) {
      result.push({ title: 'All Categories', data: nonFavorites });
    }
    return result;
  }, [categories, favoriteIds, searchQuery]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={22} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryListItem
            category={item}
            isFavorite={favoriteIds.includes(item.id)}
            onToggleFavorite={toggleFavorite}
            onEdit={openEditModal}
            onDelete={deleteCategory}
          />
        )}
        renderSectionHeader={({ section: { title, data } }) =>
          // Only show headers if not searching and there's data
          !searchQuery.trim() && data.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="search-off" size={64} color={colors.divider} />
            <Text style={styles.emptyText}>No Categories Found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? `Try a different search term.` : `Tap the '+' button to add one.`}
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.8}>
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <CategoryEditorModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        initialData={editingCategory}
        existingNames={categories.map(c => c.name)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body1, color: colors.textSecondary, marginTop: spacing.md },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    ...typography.body1,
    color: colors.text,
  },
  listContent: {
    paddingBottom: 120, // Space for FAB
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  sectionHeaderText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '30%',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    ...typography.h4,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});