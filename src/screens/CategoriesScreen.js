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
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCategoryData } from '../hooks/useCategoryData';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';
import CategoryListItem from '../components/CategoryListItem';
import CategoryEditorModal from '../components/CategoryEditorModal';
import CategoryActionModal from '../components/CategoryActionModal';

export default function CategoriesScreen({ navigation }) {
  const {
    categories, favoriteIds, toggleFavorite, addCategory,
    updateCategory, deleteCategory, isLoading,
  } = useCategoryData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorVisible, setEditorVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [actionCategory, setActionCategory] = useState(null);

  const openAddModal = () => {
    setEditingCategory(null);
    setEditorVisible(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setEditorVisible(true);
  };
  
  const handleDeleteConfirm = (category) => {
      Alert.alert(
          'Delete Category',
          `Are you sure you want to delete "${category.name}"? This cannot be undone.`,
          [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(category.id) }
          ]
      )
  };

  const handleEditorSubmit = (categoryData) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
    } else {
      addCategory(categoryData);
    }
    setEditorVisible(false);
    setEditingCategory(null);
  };

  const sections = useMemo(() => {
    let filtered = categories;
    if (searchQuery.trim()) {
      filtered = categories.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (searchQuery.trim()) return [{ title: 'Search Results', data: filtered }];
    const favorites = filtered.filter(cat => favoriteIds.includes(cat.id));
    const nonFavorites = filtered.filter(cat => !favoriteIds.includes(cat.id));
    const result = [];
    if (favorites.length > 0) result.push({ title: 'Favorites', data: favorites });
    if (nonFavorites.length > 0) result.push({ title: 'All Categories', data: nonFavorites });
    return result;
  }, [categories, favoriteIds, searchQuery]);

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
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
          // --- THIS IS THE FIX ---
          // Replaced `onEdit` and `onDelete` with the correct `onShowActions` prop.
          <CategoryListItem
            category={item}
            isFavorite={favoriteIds.includes(item.id)}
            onToggleFavorite={toggleFavorite}
            onShowActions={setActionCategory}
          />
          // --- END OF FIX ---
        )}
        renderSectionHeader={({ section: { title, data } }) =>
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
        visible={isEditorVisible}
        onClose={() => setEditorVisible(false)}
        onSubmit={handleEditorSubmit}
        initialData={editingCategory}
        existingNames={categories.map(c => c.name)}
      />

      <CategoryActionModal
        category={actionCategory}
        visible={!!actionCategory}
        onClose={() => setActionCategory(null)}
        onEdit={() => {
          openEditModal(actionCategory);
          setActionCategory(null);
        }}
        onDelete={() => {
          handleDeleteConfirm(actionCategory);
          setActionCategory(null);
        }}
      />
    </View>
  );
}

// Styles are unchanged and correct.
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
    paddingBottom: 120,
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