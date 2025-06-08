// src/components/AddNewCategoryModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../config/Theme';

export default function AddNewCategoryModal({ visible, onClose, onAdd, existingNames = [] }) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Category name cannot be empty.');
      return;
    }
    if (existingNames.some(existing => existing.toLowerCase() === trimmedName.toLowerCase())) {
      Alert.alert('Error', 'A category with this name already exists.');
      return;
    }
    onAdd(trimmedName);
    setName(''); // Reset for next time
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Category</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Pet Supplies"
            autoFocus
          />
          <Text style={styles.hint}>
            You can customize the icon and color later from the Categories screen.
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.addButton]} onPress={handleSubmit}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
  },
  input: {
    ...typography.body1,
    height: 50,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.text,
  },
  addButtonText: {
    ...typography.button,
    color: '#fff',
  },
});