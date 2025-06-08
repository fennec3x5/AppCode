// src/screens/AddEditCardScreen.js
import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

// Our new custom hooks
import { useCardForm } from '../hooks/useCardForm';
import { useCardImageHandler } from '../hooks/useCardImageHandler';

import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

// Reusable input component to reduce boilerplate
const FormInput = ({ label, icon, value, onChangeText, error, required, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
    <View style={[styles.inputWrapper, error && styles.inputError]}>
      <Icon name={icon} size={20} color={colors.textSecondary} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textLight}
        {...props}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default function AddEditCardScreen({ navigation, route }) {
  const card = route.params?.card;

  // Use our custom hooks for logic and state management
  const { state: formState, setters, actions, isEdit } = useCardForm(card);
  const { imageUri, isUploading, handlePickImage, handleRemoveImage, processImage } = useCardImageHandler(card?.imageUrl);
  
  const handleSave = async () => {
    if (!actions.validate()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
        const finalImageUrl = await processImage(card);
        await actions.save(finalImageUrl);
    } catch (error) {
        Alert.alert("Save Failed", error.message || "An unexpected error occurred.");
    }
  };
  
  const isLoading = formState.isSaving || isUploading;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
            <Icon name="credit-card" size={40} color="#FFF" />
            <Text style={styles.headerTitle}>{isEdit ? 'Edit Card' : 'Add New Card'}</Text>
        </View>

        <View style={styles.form}>
            <TouchableOpacity onPress={handlePickImage} disabled={isLoading}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.cardImage} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Icon name="add-a-photo" size={32} color={colors.primary} />
                        <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
                    </View>
                )}
            </TouchableOpacity>
            {imageUri && <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}><Icon name="close" size={18} color="#fff" /></TouchableOpacity>}
            {isUploading && <View style={styles.uploadingOverlay}><ActivityIndicator color="#fff" /></View>}

            <FormInput
                label="Card Name"
                icon="credit-card"
                value={formState.cardName}
                onChangeText={setters.setCardName}
                placeholder="e.g., Chase Sapphire Preferred"
                error={formState.errors.cardName}
                required
            />
            <FormInput
                label="Issuer"
                icon="business"
                value={formState.issuer}
                onChangeText={setters.setIssuer}
                placeholder="e.g., Chase"
            />
            <FormInput
                label="Default Reward Rate (%)"
                icon="percent"
                value={formState.defaultRewardRate}
                onChangeText={setters.setDefaultRewardRate}
                keyboardType="decimal-pad"
                error={formState.errors.defaultRewardRate}
            />

            <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isLoading}
            >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{isEdit ? 'Update Card' : 'Add Card'}</Text>}
            </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Simplified and more robust styles
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: 50 },
    header: {
        backgroundColor: colors.primary,
        padding: spacing.xl,
        paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
        alignItems: 'center',
    },
    headerTitle: { ...typography.h2, color: colors.surface, marginTop: spacing.sm },
    form: {
        padding: spacing.lg,
        marginTop: -spacing.lg, // Pulls form up slightly
        marginHorizontal: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        ...shadows.md,
    },
    cardImage: {
        width: '100%',
        aspectRatio: 1.586, // Standard credit card aspect ratio
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    imagePlaceholder: {
        width: '100%',
        aspectRatio: 1.586,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.primaryBackground,
        borderWidth: 2,
        borderColor: colors.divider,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    imagePlaceholderText: { ...typography.body1, color: colors.primary, fontWeight: '600', marginTop: spacing.sm },
    removeImageButton: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    inputGroup: { marginBottom: spacing.lg },
    label: { ...typography.body1, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        height: 52,
        backgroundColor: colors.background,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
    },
    inputIcon: { marginRight: spacing.sm },
    input: { flex: 1, ...typography.body1, color: colors.text },
    inputError: { borderColor: colors.error, backgroundColor: colors.error + '1A' },
    errorText: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
    saveButton: {
        backgroundColor: colors.primary,
        height: 52,
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.md,
    },
    saveButtonDisabled: { backgroundColor: colors.textLight },
    saveButtonText: { ...typography.button, color: '#fff' },
    required: { color: colors.error }
});