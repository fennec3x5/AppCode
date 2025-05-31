import React, { useState } from 'react';
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

export default function CardDetailScreen({ navigation, route }) {
  const { card } = route.params;
  const [bonuses, setBonuses] = useState(card.bonuses || []);
  const api = useApi();

  React.useEffect(() => {
    // Update navigation title with card name
    navigation.setOptions({
      title: card.cardName,
    });
  }, [navigation, card.cardName]);

  const handleDeleteCard = () => {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete "${card.cardName}"? This action cannot be undone.`,
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
              await api.deleteCard(card.id);
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
              await api.deleteBonus(card.id, bonus.id);
              setBonuses(bonuses.filter(b => b.id !== bonus.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bonus. Please try again.');
              console.error('Delete bonus error:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isActiveBonus = (bonus) => {
    const now = new Date();
    if (bonus.startDate && new Date(bonus.startDate) > now) return false;
    if (bonus.endDate && new Date(bonus.endDate) < now) return false;
    return true;
  };

  const sortedBonuses = [...bonuses].sort((a, b) => {
    // Active bonuses first
    const aActive = isActiveBonus(a);
    const bActive = isActiveBonus(b);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    // Then by reward rate
    return b.rewardRate - a.rewardRate;
  });

  return (
    <ScrollView style={styles.container}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardIconLarge}>
          <Icon name="credit-card" size={48} color="#2196F3" />
        </View>
        <Text style={styles.cardName}>{card.cardName}</Text>
        {card.issuer && <Text style={styles.issuer}>{card.issuer}</Text>}
        {card.defaultRewardRate && (
          <View style={styles.defaultRateContainer}>
            <Icon name="info-outline" size={16} color="#666" />
            <Text style={styles.defaultRate}>
              Default: {card.defaultRewardRate}% on all purchases
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddEditCard', { card })}
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

      {/* Bonus Categories Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bonus Categories</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEditBonus', { cardId: card.id })}
            activeOpacity={0.7}
          >
            <Icon name="add-circle" size={28} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {sortedBonuses.length === 0 ? (
          <View style={styles.emptyBonuses}>
            <Icon name="category" size={48} color="#E0E0E0" />
            <Text style={styles.emptyText}>No bonus categories added yet</Text>
            <TouchableOpacity
              style={styles.addBonusButton}
              onPress={() => navigation.navigate('AddEditBonus', { cardId: card.id })}
              activeOpacity={0.7}
            >
              <Text style={styles.addBonusButtonText}>Add First Bonus</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
                        cardId: card.id, 
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