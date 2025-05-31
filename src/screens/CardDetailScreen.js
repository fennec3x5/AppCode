import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApi } from '../context/ApiContext';

// Main component for displaying card details and managing bonuses
export default function CardDetailScreen({ navigation, route }) {
  // Extracts the initial card data passed via navigation route parameters
  const { card: initialCardFromRoute } = route.params;
  // State to hold the card data, initialized with data from route, can be updated
  const [currentCard, setCurrentCard] = useState(initialCardFromRoute);
  // Hook to access API functions
  const api = useApi();

  // Effect to update the screen title dynamically based on the current card's name
  React.useEffect(() => {
    if (currentCard) {
      navigation.setOptions({
        title: currentCard.cardName,
      });
    }
  }, [navigation, currentCard]);

  // Function to fetch and update the details of the current card
  const loadCardDetails = useCallback(async () => {
    const cardIdToLoad = initialCardFromRoute.id;

    if (!cardIdToLoad) {
      return;
    }

    try {
      const allCards = await api.getCards();
      const updatedCardFromServer = allCards.find(c => c.id === cardIdToLoad);

      if (updatedCardFromServer) {
        setCurrentCard(updatedCardFromServer);
      } else {
        Alert.alert('Card not found', 'This card may no longer exist.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Failed to refresh card details:', error);
      Alert.alert('Error', 'Could not load updated card details. Please try again.');
    }
  }, [api, initialCardFromRoute.id, navigation]);

  // Effect to load card details when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCardDetails();
      // Optional cleanup function when the screen goes out of focus
      return () => {};
    }, [loadCardDetails])
  );

  // Function to handle the deletion of the current card
  const handleDeleteCard = () => {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete "${currentCard.cardName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteCard(currentCard.id);
              navigation.navigate('CardList');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete card. Please try again.');
              console.error('Delete card error:', error);
            }
          },
        },
      ]
    );
  };

  // Function to handle the deletion of a specific bonus category
  const handleDeleteBonus = (bonus) => {
    Alert.alert(
      'Delete Bonus Category',
      `Are you sure you want to delete the "${bonus.categoryName}" bonus?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteBonus(currentCard.id, bonus.id);
              loadCardDetails();
              Alert.alert('Success', 'Bonus category deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bonus. Please try again.');
              console.error('Delete bonus error:', error);
            }
          },
        },
      ]
    );
  };

  // Utility function to format date strings for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Utility function to check if a bonus is currently active based on its dates
  const isActiveBonus = (bonus) => {
    const now = new Date();
    if (bonus.startDate && new Date(bonus.startDate) > now) return false;
    if (bonus.endDate && new Date(bonus.endDate) < now) return false;
    return true;
  };

  // Memoized calculation for sorting bonuses to display
  const sortedBonuses = React.useMemo(() => {
    return [...(currentCard?.bonuses || [])].sort((a, b) => {
      const aActive = isActiveBonus(a);
      const bActive = isActiveBonus(b);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return (b.rewardRate || 0) - (a.rewardRate || 0);
    });
  }, [currentCard?.bonuses]);

  // Main render method for the screen
  return (
    <ScrollView style={styles.container}>
      {/* Section displaying general card information */}
      <View style={styles.cardHeader}>
        <View style={styles.cardIconLarge}>
          <Icon name="credit-card" size={48} color="#2196F3" />
        </View>
        <Text style={styles.cardName}>{currentCard.cardName}</Text>
        {currentCard.issuer && <Text style={styles.issuer}>{currentCard.issuer}</Text>}
        {currentCard.defaultRewardRate != null && (
          <View style={styles.defaultRateContainer}>
            <Icon name="info-outline" size={16} color="#666" />
            <Text style={styles.defaultRate}>
              Default: {currentCard.defaultRewardRate}% on all purchases
            </Text>
          </View>
        )}
      </View>

      {/* Section for action buttons like Edit and Delete card */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddEditCard', { card: currentCard })}
          activeOpacity={0.7}
        >
          <Icon name="edit" size={20} color="#2196F3" />
          <Text style={styles.actionText}>Edit Card</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeleteCard}
          activeOpacity={0.7}
        >
          <Icon name="delete" size={20} color="#f44336" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete Card</Text>
        </TouchableOpacity>
      </View>

      {/* Section for displaying and managing bonus categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bonus Categories</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEditBonus', { cardId: currentCard.id })}
            activeOpacity={0.7}
          >
            <Icon name="add-circle" size={28} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {sortedBonuses.length === 0 ? (
          // Displayed when there are no bonus categories
          <View style={styles.emptyBonuses}>
            <Icon name="category" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>No bonus categories added yet</Text>
            <TouchableOpacity
              style={styles.addBonusButton}
              onPress={() => navigation.navigate('AddEditBonus', { cardId: currentCard.id })}
              activeOpacity={0.7}
            >
              <Text style={styles.addBonusButtonText}>Add First Bonus</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Maps through and displays each bonus category
          sortedBonuses.map((bonus) => {
            const isActive = isActiveBonus(bonus);
            return (
              <View
                key={bonus.id}
                style={[styles.bonusItem, !isActive && styles.inactiveBonus]}
              >
                <View style={styles.bonusContent}>
                  <View style={styles.bonusInfo}>
                    <View style={styles.bonusHeader}>
                      <Text style={styles.categoryName}>{bonus.categoryName}</Text>
                      {!isActive && (
                        <View style={styles.inactiveBadge}>
                          <Text style={styles.inactiveBadgeText}>Inactive</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rewardRate}>
                      {bonus.rewardRate}{bonus.rewardType === 'percentage' ? '%' : 'x points'}
                    </Text>
                    {(bonus.startDate || bonus.endDate) && (
                      <View style={styles.dateContainer}>
                        <Icon name="schedule" size={14} color="#666" />
                        <Text style={styles.dateRange}>
                          {bonus.startDate && `From ${formatDate(bonus.startDate)}`}
                          {bonus.startDate && bonus.endDate && ' • '}
                          {bonus.endDate && `Until ${formatDate(bonus.endDate)}`}
                        </Text>
                      </View>
                    )}
                    {bonus.notes && (
                      <View style={styles.notesContainer}>
                        <Icon name="info-outline" size={14} color="#999" />
                        <Text style={styles.notes}>{bonus.notes}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.bonusActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => navigation.navigate('AddEditBonus', {
                        cardId: currentCard.id,
                        bonus
                      })}
                      activeOpacity={0.7}
                    >
                      <Icon name="edit" size={20} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.deleteIconButton]}
                      onPress={() => handleDeleteBonus(bonus)}
                      activeOpacity={0.7}
                    >
                      <Icon name="delete" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

// Stylesheet for the CardDetailScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cardHeader: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cardIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  issuer: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  defaultRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  defaultRate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    justifyContent: 'space-evenly',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    backgroundColor: '#fff',
  },
  deleteButton: {
    borderColor: '#f44336',
  },
  actionText: {
    marginLeft: 8,
    color: '#2196F3',
    fontWeight: '500',
    fontSize: 16,
  },
  deleteText: {
    color: '#f44336',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  emptyBonuses: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 20,
  },
  addBonusButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  addBonusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  bonusItem: {
    backgroundColor: '#f8f8f8',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inactiveBonus: {
    opacity: 0.6,
  },
  bonusContent: {
    flexDirection: 'row',
    padding: 16,
  },
  bonusInfo: {
    flex: 1,
  },
  bonusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  inactiveBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#999',
    borderRadius: 12,
  },
  inactiveBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  rewardRate: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  notes: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 6,
    flex: 1,
  },
  bonusActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginVertical: 4,
  },
  deleteIconButton: {
    marginTop: 8,
  },
});