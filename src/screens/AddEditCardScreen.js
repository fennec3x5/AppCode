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
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useApi } from '../context/ApiContext';
import { pickImage, uploadCardImage, deleteCardImage } from '../services/ImageUploadService';

export default function AddEditCardScreen({ navigation, route }) {
  const card = route.params?.card;
  const isEdit = !!card;
  
  const [cardName, setCardName] = useState(card?.cardName || '');
  const [issuer, setIssuer] = useState(card?.issuer || '');
  const [defaultRewardRate, setDefaultRewardRate] = useState(
    card?.defaultRewardRate?.toString() || '1'
  );
  const [imageUri, setImageUri] = useState(card?.imageUrl || null);
  const [imageChanged, setImageChanged] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
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
          {/* Card Image */}
          <View style={styles.imageSection}>
            <Text style={styles.label}>Card Image</Text>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.cardImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon name="credit-card" size={48} color="#ccc" />
                  <Text style={styles.imagePlaceholderText}>Tap to add card image</Text>
                </View>
              )}
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            {imageUri && (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
                activeOpacity={0.7}
              >
                <Icon name="close" size={16} color="#f44336" />
                <Text style={styles.removeImageText}>Remove image</Text>
              </TouchableOpacity>
            )}
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
  imageSection: {
    marginBottom: 24,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 8,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
  },
  removeImageText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#f44336',
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