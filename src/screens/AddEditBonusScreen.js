import React, { useState } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApi } from '../context/ApiContext';

export default function AddEditBonusScreen({ navigation, route }) {
  const { cardId, bonus } = route.params;
  const isEdit = !!bonus;
  
  // Form state
  const [categoryName, setCategoryName] = useState(bonus?.categoryName || '');
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
  
  const api = useApi();

  const validateForm = () => {
    const newErrors = {};
    
    if (!categoryName.trim()) {
      newErrors.categoryName = 'Category name is required';
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
      categoryName: categoryName.trim(),
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
          {/* Category Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Category Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.categoryName && styles.inputError]}>
              <TextInput
                style={styles.input}
                value={categoryName}
                onChangeText={(text) => {
                  setCategoryName(text);
                  if (errors.categoryName) {
                    setErrors({ ...errors, categoryName: null });
                  }
                }}
                placeholder="e.g., Groceries, Dining, Gas"
                placeholderTextColor="#999"
                autoFocus={!isEdit}
                maxLength={30}
              />
            </View>
            {errors.categoryName && (
              <Text style={styles.errorText}>{errors.categoryName}</Text>
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
});