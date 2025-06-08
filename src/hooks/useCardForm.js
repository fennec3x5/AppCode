// src/hooks/useCardForm.js
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useApi } from '../context/ApiContext';
import { useNavigation } from '@react-navigation/native';

export const useCardForm = (initialCard) => {
  const [cardName, setCardName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [defaultRewardRate, setDefaultRewardRate] = useState('1');
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const api = useApi();
  const navigation = useNavigation();
  const isEdit = !!initialCard;

  useEffect(() => {
    if (initialCard) {
      setCardName(initialCard.cardName || '');
      setIssuer(initialCard.issuer || '');
      setDefaultRewardRate(initialCard.defaultRewardRate?.toString() || '1');
    }
  }, [initialCard]);

  const validate = () => {
    const newErrors = {};
    if (!cardName.trim()) {
      newErrors.cardName = 'Card name is required';
    }
    const rate = parseFloat(defaultRewardRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      newErrors.defaultRewardRate = 'Please enter a valid rate (0-100)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const save = async (finalImageUrl) => {
    if (!validate()) return;
    
    setIsSaving(true);
    const cardData = {
      cardName: cardName.trim(),
      issuer: issuer.trim(),
      defaultRewardRate: parseFloat(defaultRewardRate) || 1,
      imageUrl: finalImageUrl,
    };

    try {
      if (isEdit) {
        await api.updateCard(initialCard.id, cardData);
      } else {
        await api.createCard(cardData);
      }
      Alert.alert('Success', `Card successfully ${isEdit ? 'updated' : 'added'}.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', `Failed to save card. Please try again.`);
      console.error('Save card error:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return {
    state: { cardName, issuer, defaultRewardRate, errors, isSaving },
    setters: { setCardName, setIssuer, setDefaultRewardRate, setErrors },
    actions: { save, validate },
    isEdit,
  };
};