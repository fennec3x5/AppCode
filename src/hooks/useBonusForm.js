// src/hooks/useBonusForm.js
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useApi } from '../context/ApiContext';
import { useNavigation } from '@react-navigation/native';

export const useBonusForm = (cardId, initialBonus, categories) => {
  const [category, setCategory] = useState(null);
  const [rewardRate, setRewardRate] = useState('');
  const [rewardType, setRewardType] = useState('percentage');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const api = useApi();
  const navigation = useNavigation();
  const isEdit = !!initialBonus;

  useEffect(() => {
    if (initialBonus) {
      setRewardRate(initialBonus.rewardRate?.toString() || '');
      setRewardType(initialBonus.rewardType || 'percentage');
      setStartDate(initialBonus.startDate ? new Date(initialBonus.startDate) : null);
      setEndDate(initialBonus.endDate ? new Date(initialBonus.endDate) : null);
      setIsRotating(initialBonus.isRotating || false);
      setNotes(initialBonus.notes || '');
      
      if (categories.length > 0) {
        const foundCategory = categories.find(cat => cat.name.toLowerCase() === initialBonus.categoryName.toLowerCase());
        setCategory(foundCategory || { id: 'temp', name: initialBonus.categoryName, icon: 'category', color: '#666' });
      }
    }
  }, [initialBonus, categories]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!category) newErrors.category = 'Please select a category';
    if (!rewardRate.trim()) {
      newErrors.rewardRate = 'Reward rate is required';
    } else if (isNaN(parseFloat(rewardRate)) || parseFloat(rewardRate) <= 0 || parseFloat(rewardRate) > 100) {
      newErrors.rewardRate = 'Please enter a valid rate (0-100)';
    }
    if (startDate && endDate && startDate > endDate) {
      newErrors.date = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [category, rewardRate, startDate, endDate]);

  const save = useCallback(async () => {
    if (!validate()) return;

    setIsSaving(true);
    const bonusData = {
      categoryName: category.name,
      rewardRate: parseFloat(rewardRate),
      rewardType,
      startDate: startDate?.toISOString() || null,
      endDate: endDate?.toISOString() || null,
      isRotating,
      notes: notes.trim(),
    };

    try {
      if (isEdit) {
        await api.updateBonus(cardId, initialBonus.id, bonusData);
      } else {
        await api.createBonus(cardId, bonusData);
      }
      Alert.alert('Success', `Bonus successfully ${isEdit ? 'updated' : 'added'}.`);
      navigation.goBack();
    } catch (e) {
      console.error('Save bonus error:', e);
      Alert.alert('Error', `Failed to save bonus. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  }, [validate, api, navigation, cardId, initialBonus, category, rewardRate, rewardType, startDate, endDate, isRotating, notes, isEdit]);

  return {
    state: { category, rewardRate, rewardType, startDate, endDate, isRotating, notes, errors, isSaving },
    setters: { setCategory, setRewardRate, setRewardType, setStartDate, setEndDate, setIsRotating, setNotes },
    actions: { save, setErrors },
    isEdit
  };
};