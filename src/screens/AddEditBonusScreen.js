// src/screens/AddEditBonusScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Reusable hooks and components
import { useApi } from '../context/ApiContext';
import { useCategoryData } from '../hooks/useCategoryData';
import { useBonusForm } from '../hooks/useBonusForm';
import CategoryPickerModal from '../components/CategoryPickerModal';
import AddNewCategoryModal from '../components/AddNewCategoryModal';

import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

const FormGroup = ({ label, required, error, children, style }) => (
  <View style={[styles.inputGroup, style]}>
    <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
    {children}
    {error && (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={14} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )}
  </View>
);

export default function AddEditBonusScreen({ route }) {
  const { cardId, bonus } = route.params;
  
  const [showDatePicker, setShowDatePicker] = useState({ visible: false, type: 'start' });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  
  const [existingBonuses, setExistingBonuses] = useState([]);
  
  const api = useApi();
  const { categories, addCategory: addNewCategoryToStorage } = useCategoryData();
  const { state, setters, actions, isEdit } = useBonusForm(cardId, bonus, categories);
  const { category, rewardRate, rewardType, startDate, endDate, isRotating, notes, errors, isSaving } = state;
  
  useEffect(() => {
    const fetchCardBonuses = async () => {
      try {
        const cardDetails = await api.getCard(cardId);
        if (cardDetails && cardDetails.bonuses) {
          setExistingBonuses(cardDetails.bonuses);
        }
      } catch (error) {
        console.error("Failed to fetch card bonuses:", error);
      }
    };
    fetchCardBonuses();
  }, [cardId, api]);

  const handleCategorySelection = useCallback((selectedCat) => {
    const isDuplicate = existingBonuses.some(
      b => b.categoryName.toLowerCase() === selectedCat.name.toLowerCase()
    );
    const isEditingOriginal = isEdit && bonus?.categoryName.toLowerCase() === selectedCat.name.toLowerCase();

    if (isDuplicate && !isEditingOriginal) {
      Alert.alert("Duplicate Category", "This card already has a bonus for this category.");
    } else {
      setters.setCategory(selectedCat);
      setShowCategoryPicker(false);
      if (errors.category) actions.setErrors({ ...errors, category: null });
    }
  }, [existingBonuses, isEdit, bonus, setters, actions, errors]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker({ visible: false, type: 'start' });
    if (event.type === 'set' && selectedDate) {
        if (showDatePicker.type === 'start') setters.setStartDate(selectedDate);
        else setters.setEndDate(selectedDate);
        if (errors.date) actions.setErrors({ ...errors, date: null });
    }
  };

  const handleAddNewCategory = async (name) => {
    const newCategory = await addNewCategoryToStorage({ name, icon: 'category', color: '#666666' });
    if (newCategory) {
        handleCategorySelection(newCategory);
        setShowAddCategoryModal(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
            <Icon name="star" size={40} color="#FFF" />
            <Text style={styles.headerTitle}>{isEdit ? 'Edit Bonus' : 'Add Bonus'}</Text>
        </View>

        <View style={styles.form}>
          <FormGroup label="Category" required error={errors.category}>
            <TouchableOpacity
              style={[styles.selector, errors.category && styles.inputError]}
              onPress={() => setShowCategoryPicker(true)}
            >
              {category ? (
                <>
                  <Icon name={category.icon} size={24} color={category.color} style={{ marginRight: spacing.md }} />
                  <Text style={styles.selectorText}>{category.name}</Text>
                </>
              ) : (
                <Text style={styles.placeholderText}>Select a category</Text>
              )}
              <Icon name="arrow-drop-down" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </FormGroup>

          <FormGroup label="Reward Rate" required error={errors.rewardRate}>
            <View style={[styles.inputWrapper, errors.rewardRate && styles.inputError]}>
                <TextInput
                    style={styles.input}
                    value={rewardRate}
                    onChangeText={setters.setRewardRate}
                    placeholder="e.g., 5"
                    keyboardType="decimal-pad"
                />
                <TouchableOpacity onPress={() => setters.setRewardType('percentage')} style={[styles.unitToggle, rewardType === 'percentage' && styles.unitToggleActive]}>
                    <Text style={[styles.unitText, rewardType === 'percentage' && styles.unitTextActive]}>%</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setters.setRewardType('points')} style={[styles.unitToggle, rewardType === 'points' && styles.unitToggleActive]}>
                    <Text style={[styles.unitText, rewardType === 'points' && styles.unitTextActive]}>x</Text>
                </TouchableOpacity>
            </View>
          </FormGroup>

          <View style={styles.dateRow}>
            <FormGroup label="Start Date" error={errors.date} style={{ flex: 1 }}>
              <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker({ visible: true, type: 'start' })}>
                <Icon name="event" size={20} color={colors.textSecondary} />
                <Text style={styles.selectorText}>{startDate ? startDate.toLocaleDateString() : 'None'}</Text>
              </TouchableOpacity>
            </FormGroup>
            <FormGroup label="End Date" style={{ flex: 1 }}>
              <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker({ visible: true, type: 'end' })}>
                <Icon name="event" size={20} color={colors.textSecondary} />
                <Text style={styles.selectorText}>{endDate ? endDate.toLocaleDateString() : 'None'}</Text>
              </TouchableOpacity>
            </FormGroup>
          </View>
          {errors.date && <Text style={styles.errorTextDate}>{errors.date}</Text>}

          <FormGroup label="Notes">
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setters.setNotes}
              placeholder="e.g. Only applies to online purchases."
              placeholderTextColor={colors.textLight}
              multiline
            />
          </FormGroup>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Is this a rotating category?</Text>
            <Switch
              value={isRotating}
              onValueChange={setters.setIsRotating}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isRotating ? colors.primary : colors.textLight}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={actions.save}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>{isEdit ? 'Update Bonus' : 'Add Bonus'}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <CategoryPickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={handleCategorySelection}
        categories={categories}
        selectedCategory={category}
        allowAddNew={true}
        onAddNew={() => { setShowCategoryPicker(false); setShowAddCategoryModal(true); }}
      />

      <AddNewCategoryModal
        visible={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onAdd={handleAddNewCategory}
        // --- THIS IS THE CRITICAL FIX ---
        // We ensure `categories` is an array before calling .map on it.
        existingNames={Array.isArray(categories) ? categories.map(c => c.name) : []}
      />

      {showDatePicker.visible && (
        <DateTimePicker
          value={showDatePicker.type === 'start' ? (startDate || new Date()) : (endDate || new Date())}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: 50 },
    header: {
        backgroundColor: colors.primary,
        padding: spacing.xl,
        paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
        paddingBottom: spacing.lg,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: { ...typography.h2, color: colors.surface, marginTop: spacing.sm },
    form: { padding: spacing.lg },
    inputGroup: { marginBottom: spacing.lg },
    label: { ...typography.body1, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
    required: { color: colors.error },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: colors.border,
        borderRadius: borderRadius.md, backgroundColor: colors.surface,
        minHeight: 52,
    },
    input: {
        flex: 1, ...typography.body1,
        paddingHorizontal: spacing.md,
        color: colors.text,
        // The input style no longer needs a fixed height
    },
    notesInput: {
        ...typography.body1,
        minHeight: 100,
        textAlignVertical: 'top',
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        color: colors.text,
    },
    selector: {
        flexDirection: 'row', alignItems: 'center',
        padding: spacing.md, borderWidth: 1,
        borderColor: colors.border, borderRadius: borderRadius.md,
        backgroundColor: colors.surface, minHeight: 52,
    },
    selectorText: { flex: 1, ...typography.body1, color: colors.text, marginLeft: spacing.sm },
    placeholderText: { flex: 1, ...typography.body1, color: colors.textLight },
    unitToggle: {
        paddingHorizontal: spacing.lg, alignSelf: 'stretch',
        justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: colors.border,
    },
    unitToggleActive: { backgroundColor: colors.primaryBackground },
    unitText: { ...typography.body1, color: colors.textSecondary },
    unitTextActive: { color: colors.primary, fontWeight: 'bold' },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
    switchRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: spacing.sm,
        marginBottom: spacing.xl,
    },
    switchLabel: { ...typography.body1, color: colors.text, flex: 1 },
    saveButton: {
        backgroundColor: colors.primary, padding: spacing.lg,
        borderRadius: borderRadius.lg, alignItems: 'center', ...shadows.sm,
    },
    saveButtonDisabled: { backgroundColor: colors.textLight },
    saveButtonText: { ...typography.button, color: '#fff' },
    inputError: { borderColor: colors.error, backgroundColor: colors.error + '1A' },
    errorContainer: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
    errorText: { ...typography.caption, color: colors.error, marginLeft: spacing.xs },
    errorTextDate: { ...typography.caption, color: colors.error, marginTop: -spacing.md, marginBottom: spacing.md },
});