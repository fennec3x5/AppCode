// src/components/CategoryListItem.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

const CategoryListItem = React.memo(({ category, isFavorite, onToggleFavorite, onShowActions }) => {
  
  const handleMorePress = () => {
    // We still check here to prevent showing actions for default categories.
    if (!category.isCustom) {
      Alert.alert('Info', 'Default categories cannot be modified.');
      return;
    }
    // This is the key change: it calls the parent to handle the action.
    onShowActions(category);
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
      
      {category.isCustom ? (
        <TouchableOpacity onPress={handleMorePress} style={styles.actionButton}>
          <Icon name="more-vert" size={26} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
});

// --- THIS IS THE MISSING PART ---
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
  placeholder: {
    width: 26 + (spacing.sm * 2), 
  },
});

export default CategoryListItem;