import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApi } from '../context/ApiContext';
import { DEFAULT_CATEGORIES, CUSTOM_CATEGORIES_KEY } from '../config/categories';
import CategoryPickerModal from '../components/CategoryPickerModal';

export default function AddEditBonusScreen({ navigation, route }) {
  const { cardId, bonus } = route.params;
  const isEdit = !!bonus;
  
  // Form state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [rewardRate, setRewardRate] = useState(bonus?.rewardRate?.toString() || '');
  const [rewardType, setRewardType] = useState(bonus?.rewardType || 'percentage');
  const [startDate, setStartDate] = useState(
    bonus?.startDate ? new Date(bonus.startDate) : null
  );
  const [endDate, setEndDate] = useState(
    bonus?.endDate ? new Date(bonus.endDate) : null
  );
  const [isRotating, setIsRotating] = useState(bonus?.isRotating || false);
  const [notes, setNotes] = useState(bonus?.notes || '');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const api = useApi();

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // If editing, find the category
  useEffect(() => {
    if (isEdit && bonus && categories.length > 0) {
      const category = categories.find(cat => 
        cat.name.toLowerCase() === bonus.categoryName.toLowerCase()
      );
      if (category) {
        setSelectedCategory(category);
      } else {
        // If category not found, create a temporary one
        setSelectedCategory({
          id: 'temp',
          name: bonus.categoryName,
          icon: 'category',
          color: '#666',
        });
      }
    }
  }, [isEdit, bonus, categories]);

  const loadCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
      const customCategories = stored ? JSON.parse(stored) : [];
      setCategories([...DEFAULT_CATEGORIES, ...customCategories]);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const exists = categories.some(
      cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );

    if (exists) {
      Alert.alert('Error', 'This category already exists');
      return;
    }

    const newCategory = {
      id: `custom_${Date.now()}`,
      name: newCategoryName.trim(),
      icon: 'category',
      color: '#666666',
      isCustom: true,
    };

    try {
      const stored = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
      const customCategories = stored ? JSON.parse(stored) : [];
      const updated = [...customCategories, newCategory];
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
      
      // Update local state
      setCategories([...categories, newCategory]);
      setSelectedCategory(newCategory);
      setShowAddCategoryModal(false);
      setNewCategoryName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }
    
    if (!rewardRate.trim()) {
      newErrors.rewardRate = 'Reward rate is required';
    } else {
      const rate = parseFloat(rewardRate);
      if (isNaN(rate) || rate <= 0 || rate > 100) {
        newErrors.rewardRate = 'Please enter a valid rate between 0 and 100';
      }
    }
    
    if (startDate && endDate && startDate > endDate) {
      newErrors.dateRange = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const bonusData = {
      categoryName: selectedCategory.name,
      rewardRate: parseFloat(rewardRate),
      rewardType,
      startDate: startDate?.toISOString() || null,
      endDate: endDate?.toISOString() || null,
      isRotating,
      notes: notes.trim(),
    };

    try {
      setLoading(true);
      if (isEdit) {
        await api.updateBonus(cardId, bonus.id, bonusData);
        Alert.alert('Success', 'Bonus category updated successfully');
      } else {
        await api.createBonus(cardId, bonusData);
        Alert.alert('Success', 'Bonus category added successfully');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Error', 
        `Failed to ${isEdit ? 'update' : 'create'} bonus category. Please try again.`
      );
      console.error('Save bonus error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.categorySelector, errors.category && styles.inputError]}
              onPress={() => setShowCategoryPicker(true)}
              activeOpacity={0.7}
            >
              {selectedCategory ? (
                <>
                  <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategory.color + '20' }]}>
                    <Icon name={selectedCategory.icon} size={20} color={selectedCategory.color} />
                  </View>
                  <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
                </>
              ) : (
                <Text style={styles.placeholderText}>Select a category</Text>
              )}
              <Icon name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          {/* Reward Rate */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Reward Rate <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.rewardRate && styles.inputError]}>
              <TextInput
                style={styles.input}
                value={rewardRate}
                onChangeText={(text) => {
                  setRewardRate(text);
                  if (errors.rewardRate) {
                    setErrors({ ...errors, rewardRate: null });
                  }
                }}
                placeholder="e.g., 3"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                maxLength={5}
              />
              <Text style={styles.inputSuffix}>
                {rewardType === 'percentage' ? '%' : 'x'}
              </Text>
            </View>
            {errors.rewardRate && (
              <Text style={styles.errorText}>{errors.rewardRate}</Text>
            )}
          </View>

          {/* Reward Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reward Type</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  rewardType === 'percentage' && styles.radioButtonActive
                ]}
                onPress={() => setRewardType('percentage')}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radio,
                  rewardType === 'percentage' && styles.radioSelected
                ]}>
                  {rewardType === 'percentage' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={[
                  styles.radioLabel,
                  rewardType === 'percentage' && styles.radioLabelActive
                ]}>
                  Percentage (%)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  rewardType === 'points' && styles.radioButtonActive
                ]}
                onPress={() => setRewardType('points')}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radio,
                  rewardType === 'points' && styles.radioSelected
                ]}>
                  {rewardType === 'points' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={[
                  styles.radioLabel,
                  rewardType === 'points' && styles.radioLabelActive
                ]}>
                  Points (x)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.dateSection}>
            <Text style={styles.sectionTitle}>Validity Period</Text>
            <Text style={styles.helperText}>
              Set dates for limited-time bonus categories
            </Text>
            
            {/* Start Date */}
            <View style={styles.dateGroup}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.7}
              >
                <Icon name="event" size={20} color="#666" />
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
              {startDate && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setStartDate(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* End Date */}
            <View style={styles.dateGroup}>
              <Text style={styles.dateLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
                activeOpacity={0.7}
              >
                <Icon name="event" size={20} color="#666" />
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
              {endDate && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setEndDate(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {errors.dateRange && (
              <Text style={styles.errorText}>{errors.dateRange}</Text>
            )}
          </View>

          {/* Rotating Category Toggle */}
          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.label}>Rotating Category</Text>
                <Text style={styles.helperText}>
                  Mark if this bonus changes periodically
                </Text>
              </View>
              <Switch
                value={isRotating}
                onValueChange={setIsRotating}
                trackColor={{ false: '#E0E0E0', true: '#81b0ff' }}
                thumbColor={isRotating ? '#2196F3' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g., Up to $1500 per quarter"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
            <Text style={styles.helperText}>
              Add any conditions or limits
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={(category) => {
          setSelectedCategory(category);
          if (errors.category) {
            setErrors({ ...errors, category: null });
          }
        }}
        categories={categories}
        selectedCategory={selectedCategory}
        allowAddNew={true}
        onAddNew={() => setShowAddCategoryModal(true)}
      />

      {/* Add New Category Modal */}
      <Modal
        visible={showAddCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.addCategoryModalContent}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TextInput
              style={styles.newCategoryInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Category name"
              placeholderTextColor="#999"
              autoFocus
            />
            <Text style={styles.addCategoryHint}>
              You can customize the icon and color in the Categories screen
            </Text>
            <View style={styles.addCategoryButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddNewCategory}
              >
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
              if (errors.dateRange) {
                setErrors({ ...errors, dateRange: null });
              }
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
              if (errors.dateRange) {
                setErrors({ ...errors, dateRange: null });
              }
            }
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  form: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  selectedCategoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedCategoryText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  inputError: {
    borderColor: '#f44336',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputSuffix: {
    paddingRight: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  textArea: {
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#f44336',
    marginTop: 4,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  radioButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2196F3',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
  },
  radioLabel: {
    fontSize: 16,
    color: '#666',
  },
  radioLabelActive: {
    color: '#2196F3',
    fontWeight: '500',
  },
  dateSection: {
    marginBottom: 24,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dateGroup: {
    marginTop: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  addCategoryModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  newCategoryInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    marginTop: 16,
    marginBottom: 8,
  },
  addCategoryHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
  },
  addCategoryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});