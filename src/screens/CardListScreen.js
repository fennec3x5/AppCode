import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApi } from '../context/ApiContext';
import { useFocusEffect } from '@react-navigation/native';
import { PushNotificationService } from '../services/PushNotificationService';

export default function CardListScreen({ navigation }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const api = useApi();

  // Load cards when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [])
  );

  const loadCards = async () => {
    try {
      setLoading(true);
      const data = await api.getCards();
      setCards(data);
      
      // Check for expiring bonuses locally (for Expo Go)
      if (PushNotificationService.isExpoGo()) {
        const notificationCount = await PushNotificationService.checkExpiringBonusesLocally(data);
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
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCards();
  };

  const getActiveBonusCount = (card) => {
    if (!card.bonuses || !Array.isArray(card.bonuses)) return 0;
    const now = new Date();
    return card.bonuses.filter(bonus => {
      if (!bonus.startDate && !bonus.endDate) return true;
      if (bonus.startDate && new Date(bonus.startDate) > now) return false;
      if (bonus.endDate && new Date(bonus.endDate) < now) return false;
      return true;
    }).length;
  };

  const renderCard = ({ item }) => {
    const activeBonuses = getActiveBonusCount(item);
    
    return (
      <TouchableOpacity
        style={styles.cardItem}
        onPress={() => navigation.navigate('CardDetail', { card: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
          ) : (
            <View style={styles.cardIconPlaceholder}>
              <Icon name="credit-card" size={32} color="#2196F3" />
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.cardName}
          </Text>
          {item.issuer ? (
            <Text style={styles.issuer} numberOfLines={1}>
              {item.issuer}
            </Text>
          ) : null}
          <View style={styles.bonusContainer}>
            <Icon name="star" size={14} color="#FFB800" style={styles.starIcon} />
            <Text style={styles.bonusCount}>
              {activeBonuses} active bonus{activeBonuses !== 1 ? 'es' : ''}
            </Text>
          </View>
        </View>
        <Icon name="chevron-right" size={24} color="#999" />
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading your cards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="credit-card" size={80} color="#E0E0E0" />
            <Text style={styles.emptyText}>No cards added yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first card
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditCard')}
        activeOpacity={0.8}
      >
        <Icon name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImageContainer: {
    width: 80,
    height: 50,
    marginRight: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  cardIconPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  issuer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 4,
  },
  bonusCount: {
    fontSize: 14,
    color: '#2196F3',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 48,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});