import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useApi } from '../context/ApiContext';
import { DEFAULT_CATEGORIES, CUSTOM_CATEGORIES_KEY } from '../config/categories';
import CategoryPickerModal from '../components/CategoryPickerModal';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

const { width } = Dimensions.get('window');

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

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formScale = useRef(new Animated.Value(0.95)).current;
  const categoryScale = useRef(new Animated.Value(1)).current;
  const errorShake = useRef(new Animated.Value(0)).current;
  const rewardScale = useRef(new Animated.Value(1)).current;

  // Load categories on mount
  useEffect(() => {
    loadCategories();
    animateScreenEntry();
  }, []);

  const animateScreenEntry = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(formScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
        delay: 100,
      }),
    ]).start();
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(errorShake, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShake, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShake, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShake, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateCategorySelect = () => {
    Animated.sequence([
      Animated.timing(categoryScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(categoryScale, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

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

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
      animateCategorySelect();
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
    
    if (Object.keys(newErrors).length > 0) {
      shakeError();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Bonus category updated successfully');
      } else {
        await api.createBonus(cardId, bonusData);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Bonus category added successfully');
      }
      navigation.goBack();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  const handleRewardTypeChange = (type) => {
    Animated.timing(rewardScale, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setRewardType(type);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(rewardScale, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Header */}
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <Icon name="star" size={40} color="#FFF" />
            <Text style={styles.headerTitle}>
              {isEdit ? 'Edit Bonus Category' : 'Add Bonus Category'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEdit ? 'Update your bonus rewards' : 'Maximize rewards with bonus categories'}
            </Text>
          </View>
        </View>

        <Animated.View 
          style={[
            styles.form,
            {
              transform: [
                { scale: formScale },
                { translateX: errorShake },
              ],
            },
          ]}
        >
          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <Animated.View style={{ transform: [{ scale: categoryScale }] }}>
              <TouchableOpacity
                style={[styles.categorySelector, errors.category && styles.inputError]}
                onPress={() => {
                  setShowCategoryPicker(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                {selectedCategory ? (
                  <>
                    <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategory.color + '20' }]}>
                      <Icon name={selectedCategory.icon} size={24} color={selectedCategory.color} />
                    </View>
                    <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
                  </>
                ) : (
                  <View style={styles.placeholderContent}>
                    <Icon name="category" size={24} color={colors.textLight} />
                    <Text style={styles.placeholderText}>Select a category</Text>
                  </View>
                )}
                <Icon name="arrow-drop-down" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </Animated.View>
            {errors.category && (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={14} color={colors.error} />
                <Text style={styles.errorText}>{errors.category}</Text>
              </View>
            )}
          </View>

          {/* Reward Rate */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Reward Rate <Text style={styles.required}>*</Text>
            </Text>
            <Animated.View 
              style={[
                styles.rewardInputContainer,
                { transform: [{ scale: rewardScale }] }
              ]}
            >
              <View style={[styles.inputWrapper, styles.rewardInputWrapper, errors.rewardRate && styles.inputError]}>
                <TextInput
                  style={styles.rewardInput}
                  value={rewardRate}
                  onChangeText={(text) => {
                    setRewardRate(text);
                    if (errors.rewardRate) {
                      setErrors({ ...errors, rewardRate: null });
                    }
                  }}
                  placeholder="0"
                  placeholderTextColor={colors.textLight}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
                <View style={[styles.unitBadge, rewardType === 'percentage' ? styles.percentBadge : styles.pointsBadge]}>
                  <Text style={styles.unitText}>
                    {rewardType === 'percentage' ? '%' : 'x'}
                  </Text>
                </View>
              </View>
              <View style={styles.rewardPreview}>
                <Text style={styles.rewardPreviewText}>
                  {rewardRate || '0'}{rewardType === 'percentage' ? '% cashback' : 'x points'}
                </Text>
              </View>
            </Animated.View>
            {errors.rewardRate && (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={14} color={colors.error} />
                <Text style={styles.errorText}>{errors.rewardRate}</Text>
              </View>
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
                onPress={() => handleRewardTypeChange('percentage')}
                activeOpacity={0.7}
              >
                <Icon name="percent" size={20} color={rewardType === 'percentage' ? colors.primary : colors.textSecondary} />
                <Text style={[
                  styles.radioLabel,
                  rewardType === 'percentage' && styles.radioLabelActive
                ]}>
                  Percentage
                </Text>
                <View style={[
                  styles.radioIndicator,
                  rewardType === 'percentage' && styles.radioIndicatorActive
                ]} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  rewardType === 'points' && styles.radioButtonActive
                ]}
                onPress={() => handleRewardTypeChange('points')}
                activeOpacity={0.7}
              >
                <Icon name="stars" size={20} color={rewardType === 'points' ? colors.primary : colors.textSecondary} />
                <Text style={[
                  styles.radioLabel,
                  rewardType === 'points' && styles.radioLabelActive
                ]}>
                  Points
                </Text>
                <View style={[
                  styles.radioIndicator,
                  rewardType === 'points' && styles.radioIndicatorActive
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Range Section */}
          <View style={styles.dateSection}>
            <View style={styles.sectionHeader}>
              <Icon name="event" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Validity Period</Text>
            </View>
            <Text style={styles.helperText}>
              Set dates for limited-time bonus categories
            </Text>
            
            {/* Date Inputs */}
            <View style={styles.dateInputs}>
              {/* Start Date */}
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setShowStartPicker(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="today" size={18} color={colors.primary} />
                  <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                  {startDate && (
                    <TouchableOpacity
                      style={styles.clearDateButton}
                      onPress={() => {
                        setStartDate(null);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              {/* End Date */}
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setShowEndPicker(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="event" size={18} color={colors.primary} />
                  <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                  {endDate && (
                    <TouchableOpacity
                      style={styles.clearDateButton}
                      onPress={() => {
                        setEndDate(null);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {errors.dateRange && (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={14} color={colors.error} />
                <Text style={styles.errorText}>{errors.dateRange}</Text>
              </View>
            )}
          </View>

          {/* Rotating Category Toggle */}
          <View style={styles.switchContainer}>
            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => {
                setIsRotating(!isRotating);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.switchLeft}>
                <View style={[styles.switchIcon, isRotating && styles.switchIconActive]}>
                  <Icon name="autorenew" size={20} color={isRotating ? colors.primary : colors.textSecondary} />
                </View>
                <View style={styles.switchContent}>
                  <Text style={styles.switchTitle}>Rotating Category</Text>
                  <Text style={styles.switchSubtitle}>
                    Mark if this bonus changes periodically
                  </Text>
                </View>
              </View>
              <Switch
                value={isRotating}
                onValueChange={(value) => {
                  setIsRotating(value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={isRotating ? colors.primary : colors.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <View style={styles.textAreaContainer}>
              <Icon name="notes" size={20} color={colors.textSecondary} style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g., Up to $1500 per quarter"
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
            <Text style={styles.helperText}>
              Add any conditions or limits ({notes.length}/200)
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={styles.saveButtonContent}>
                  <Icon name="save" size={20} color="#FFF" style={styles.buttonIcon} />
                  <Text style={styles.saveButtonText}>
                    {isEdit ? 'Update Bonus' : 'Add Bonus'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={(category) => {
          setSelectedCategory(category);
          animateCategorySelect();
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
              placeholderTextColor={colors.textLight}
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
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  headerGradient: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...shadows.lg,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.surface,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body1,
    color: colors.surface,
    opacity: 0.9,
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: -spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    minHeight: 64,
  },
  selectedCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  selectedCategoryText: {
    flex: 1,
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  placeholderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeholderText: {
    ...typography.body1,
    color: colors.textLight,
    marginLeft: spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: '#FFF5F5',
  },
  rewardInputContainer: {
    marginBottom: spacing.sm,
  },
  rewardInputWrapper: {
    paddingLeft: spacing.md,
    paddingRight: 0,
    height: 56,
  },
  rewardInput: {
    flex: 1,
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    paddingVertical: spacing.sm,
  },
  unitBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    height: 40,
    justifyContent: 'center',
    minWidth: 48,
    alignItems: 'center',
  },
  percentBadge: {
    backgroundColor: colors.primaryBackground,
  },
  pointsBadge: {
    backgroundColor: '#FFF3E0',
  },
  unitText: {
    ...typography.h4,
    fontWeight: '700',
    color: colors.primary,
  },
  rewardPreview: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  rewardPreviewText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginHorizontal: spacing.xs,
  },
  radioButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBackground,
  },
  radioLabel: {
    ...typography.body1,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  radioLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  radioIndicatorActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dateSection: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  dateInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInputGroup: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    minHeight: 48,
  },
  dateText: {
    ...typography.body2,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  clearDateButton: {
    padding: spacing.xs,
  },
  switchContainer: {
    marginBottom: spacing.lg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  switchIconActive: {
    backgroundColor: colors.primaryBackground,
  },
  switchContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  switchSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  textAreaIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  textArea: {
    flex: 1,
    ...typography.body1,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginLeft: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  addCategoryModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  newCategoryInput: {
    ...typography.body1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  addCategoryHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  addCategoryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});