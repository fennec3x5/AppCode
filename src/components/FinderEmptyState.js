// src/components/FinderEmptyState.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

export const FinderEmptyState = ({ categoryName, onReset, error }) => (
  <View style={styles.container}>
    <View style={styles.iconContainer}>
      <Icon name={error ? "error-outline" : "search-off"} size={64} color={error ? colors.error : colors.textLight} />
    </View>
    <Text style={styles.title}>{error ? "Search Failed" : "No Cards Found"}</Text>
    <Text style={styles.subtitle}>
      {error || `We couldn't find any cards with a bonus for "${categoryName}".`}
    </Text>
    <TouchableOpacity style={styles.button} onPress={onReset} activeOpacity={0.8}>
      <Icon name="refresh" size={20} color={colors.surface} />
      <Text style={styles.buttonText}>Try Another Search</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    iconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg, ...shadows.sm },
    title: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
    subtitle: { ...typography.body1, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
    button: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: borderRadius.round, ...shadows.sm },
    buttonText: { ...typography.button, color: colors.surface, marginLeft: spacing.sm },
});