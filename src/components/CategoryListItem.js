// src/components/CategoryListItem.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

const CategoryListItem = React.memo(({ category, isFavorite, onToggleFavorite, onEdit, onDelete }) => {
  // This handler is now only callable for custom categories, but the check is kept for robustness.
  const handleMorePress = () => {
    if (!category.isCustom) {
      Alert.alert('Info', 'Default categories cannot be modified.');
      return;
    }
    
    Alert.alert(
      `Manage "${category.name}"`,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeletePress() },
        { text: 'Edit', onPress: () => onEdit(category) },
      ],
      { cancelable: true }
    );
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(category.id) }
      ]
    )
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
        <Icon name={category.icon} size={24} color={category.color} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{category.name}</Text>
        {category.isCustom && <Text style={styles.customLabel}>Custom</Text>}
      </View>
      <TouchableOpacity onPress={() => onToggleFavorite(category.id)} style={styles.actionButton}>
        <Icon
          name={isFavorite ? 'star' : 'star-border'}
          size={26}
          color={isFavorite ? colors.warning : colors.textSecondary}
        />
      </TouchableOpacity>
      
      {/* Only render the 'more' button if the category is custom */}
      {category.isCustom ? (
        <TouchableOpacity onPress={handleMorePress} style={styles.actionButton}>
          <Icon name="more-vert" size={26} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : (
        // Render a placeholder to maintain alignment with custom items
        <View style={styles.placeholder} />
      )}

    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  customLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  actionButton: {
    padding: spacing.sm,
  },
  // Added a placeholder style
  placeholder: {
    // Takes up the same space as the button to keep item contents aligned
    width: 26 + (spacing.sm * 2), 
  },
});

export default CategoryListItem;