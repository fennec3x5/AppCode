// src/hooks/useCardDetail.js
import { useState, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { useApi } from '../context/ApiContext';

export const useCardDetail = (cardId) => {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      let isActive = true; // Prevent state updates on an unmounted component

      const fetchCard = async () => {
        if (!cardId) return;
        setLoading(true);
        try {
          const data = await api.getCard(cardId);
          if (isActive) {
            setCard(data);
          }
        } catch (error) {
          console.error("Failed to fetch card details:", error);
          Alert.alert("Error", "Could not load card details.", [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchCard();

      return () => {
        isActive = false;
      };
    }, [api, cardId, navigation])
  );

  const deleteBonus = async (bonusId) => {
    Alert.alert(
      'Delete Bonus', `Are you sure you want to delete this bonus?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteBonus(card.id, bonusId);
              // Re-fetch card data to update the list
              const data = await api.getCard(cardId);
              setCard(data);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bonus.');
            }
          },
        },
      ]
    );
  };

  const deleteCard = async () => {
    Alert.alert(
      'Delete Card', `Are you sure you want to delete "${card.cardName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteCard(card.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete card.');
            }
          },
        },
      ]
    );
  };

  return { card, loading, deleteBonus, deleteCard };
};