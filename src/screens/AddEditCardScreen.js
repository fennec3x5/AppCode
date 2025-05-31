import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApi } from '../context/ApiContext';

export default function AddEditCardScreen({ navigation, route }) {
  const card = route.params?.card;
  const isEdit = !!card;
  
  const [cardName, setCardName] = useState(card?.cardName || '');
  const [issuer, setIssuer] = useState(card?.issuer || '');
  const [defaultRewardRate, setDefaultRewardRate] = useState(
    card?.defaultRewardRate?.toString() || '1'
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const api = useApi();

  const validateForm = () => {
    const newErrors = {};
    
    if (!cardName.trim()) {
      newErrors.cardName = 'Card name is required';
    }
    
    const rate = parseFloat(defaultRewardRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      newErrors.defaultRewardRate = 'Please enter a valid rate between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const cardData = {
      cardName: cardName.trim(),
      issuer: issuer.trim(),
      defaultRewardRate: parseFloat(defaultRewardRate) || 1,
    };

    try {
      setLoading(true);
      if (isEdit) {
        await api.updateCard(card.id, cardData);
        Alert.alert('Success', 'Card updated successfully');
      } else {
        await api.createCard(cardData);
        Alert.alert('Success', 'Card added successfully');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Error', 
        `Failed to ${isEdit ? 'update' : 'create'} card. Please try again.`
      );
      console.error('Save card error:', error);
    } finally {
      setLoading(false);
    }
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
          {/* Card Icon */}
          <View style={styles.iconContainer}>
            <Icon name="credit-card" size={64} color="#2196F3" />
          </View>

          {/* Card Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Card Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, errors.cardName && styles.inputError]}>
              <TextInput
                style={styles.input}
                value={cardName}
                onChangeText={(text) => {
                  setCardName(text);
                  if (errors.cardName) {
                    setErrors({ ...errors, cardName: null });
                  }
                }}
                placeholder="e.g., Chase Sapphire Preferred"
                placeholderTextColor="#999"
                autoFocus={!isEdit}
                maxLength={50}
              />
            </View>
            {errors.cardName && (
              <Text style={styles.errorText}>{errors.cardName}</Text>
            )}
          </View>

          {/* Issuer Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Issuer</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={issuer}
                onChangeText={setIssuer}
                placeholder="e.g., Chase"
                placeholderTextColor="#999"
                maxLength={30}
              />
            </View>
            <Text style={styles.helperText}>Optional - Bank or card issuer</Text>
          </View>

          {/* Default Reward Rate Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Default Reward Rate (%)</Text>
            <View style={[styles.inputContainer, errors.defaultRewardRate && styles.inputError]}>
              <TextInput
                style={styles.input}
                value={defaultRewardRate}
                onChangeText={(text) => {
                  setDefaultRewardRate(text);
                  if (errors.defaultRewardRate) {
                    setErrors({ ...errors, defaultRewardRate: null });
                  }
                }}
                placeholder="1"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                maxLength={5}
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
            {errors.defaultRewardRate ? (
              <Text style={styles.errorText}>{errors.defaultRewardRate}</Text>
            ) : (
              <Text style={styles.helperText}>
                Cashback rate for purchases without specific bonuses
              </Text>
            )}
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
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