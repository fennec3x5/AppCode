// src/hooks/useCardList.js
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert } from 'react-native';
import { useApi } from '../context/ApiContext';
import { PushNotificationService } from '../services/PushNotificationService';

export const useCardList = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const api = useApi();

  const loadCards = useCallback(async () => {
    // Only show the full-screen loader on initial load, not on pull-to-refresh
    if (!refreshing) {
        setLoading(true);
    }
    
    try {
      const data = await api.getCards();
      
      const sortedData = [...data].sort((a, b) => 
        a.cardName.toLowerCase().localeCompare(b.cardName.toLowerCase())
      );
      
      setCards(sortedData);
      
      if (PushNotificationService.isExpoGo()) {
        const notificationCount = await PushNotificationService.checkExpiringBonusesLocally(sortedData);
        if (notificationCount > 0) {
          console.log(`Scheduled ${notificationCount} expiry notifications`);
        }
      }
    } catch (error) {
      Alert.alert(
        'Error', 
        'Failed to load cards. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      console.error('Load cards error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, refreshing]);

  // Load cards when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [loadCards]) // Dependency on loadCards ensures it runs when needed
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The useEffect will re-trigger loadCards because `refreshing` state changes
    // and is a dependency of `loadCards`. We can call it directly for snappiness.
    loadCards();
  }, [loadCards]);

  return { cards, loading, refreshing, onRefresh };
};