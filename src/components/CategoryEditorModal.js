// src/components/CategoryEditorModal.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

// Moved outside component to prevent re-creation on render
const iconOptions = ['category', 'shopping-cart', 'local-gas-station', 'restaurant', 'flight', 'computer', 'movie', 'play-circle-outline', 'power', 'local-pharmacy', 'home', 'store', 'warehouse', 'train', 'local-taxi', 'hotel', 'fitness-center', 'autorenew', 'business-center', 'security', 'school', 'local-hospital', 'pets', 'directions-car', 'local-mall', 'beach-access', 'spa', 'golf-course', 'local-cafe', 'local-bar', 'fastfood', 'more-horiz'];
const colorOptions = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#000000'];

const CategoryEditorModal = ({ visible, onClose, onSubmit, initialData, existingNames = [] }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('category');
  const [color, setColor] = useState('#666666');
  
  const isEditing = !!initialData;

  useEffect(() => {
    if (visible && initialData) {
      setName(initialData.name);
      setIcon(initialData.icon);
      setColor(initialData.color);
    } else if (!visible) {
      // Reset form on close
      setName('');
      setIcon('category');
      setColor('#666666');
    }
  }, [visible, initialData]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Category name cannot be empty.');
      return;
    }

    const isNameTaken = existingNames.some(
      existingName => 
        existingName.toLowerCase() === trimmedName.toLowerCase() &&
        (!isEditing || initialData.name.toLowerCase() !== trimmedName.toLowerCase())
    );

    if (isNameTaken) {
      Alert.alert('Validation Error', 'A category with this name already exists.');
      return;
    }
    
    onSubmit({ name: trimmedName, icon, color });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Category' : 'Add Category'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={26} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Category Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Online Shopping"
            autoFocus
          />

          <Text style={styles.label}>Icon</Text>
          <FlatList
            horizontal
            data={iconOptions}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.iconOption, icon === item && styles.iconOptionSelected]}
                onPress={() => setIcon(item)}
              >
                <Icon name={item} size={24} color={icon === item ? '#fff' : '#666'} />
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
          
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {colorOptions.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorOption, { backgroundColor: c }, color === c && styles.colorOptionSelected]}
                onPress={() => setColor(c)}
              >
                {color === c && <Icon name="check" size={20} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
            <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Add Category'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Styles are largely the same, but simplified and organized
const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: { ...typography.h3, color: colors.text },
  closeButton: { padding: spacing.xs },
  label: { ...typography.body1, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm },
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
  iconOption: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
  },
  iconOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  colorOption: {
    width: 44, height: 44, borderRadius: 22,
    margin: spacing.xs, justifyContent: 'center', alignItems: 'center'
  },
  colorOptionSelected: { borderWidth: 3, borderColor: 'white', elevation: 4, shadowOpacity: 0.3 },
  saveButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: { ...typography.button, color: '#fff' }
});

export default CategoryEditorModal;