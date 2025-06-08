import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// Removed LinearGradient import - using standard views instead
import * as Haptics from 'expo-haptics';
import { useApi } from '../context/ApiContext';
import { pickImage, uploadCardImage, deleteCardImage } from '../services/ImageUploadService';
import { colors, typography, spacing, borderRadius, shadows } from '../config/Theme';

const { width } = Dimensions.get('window');

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

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const imageScale = useRef(new Animated.Value(0.9)).current;
  const formScale = useRef(new Animated.Value(0.95)).current;
  const errorShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      Animated.spring(imageScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
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

  const handlePickImage = async () => {
    if (uploadingImage) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      Animated.timing(imageScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(imageScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const localUri = await pickImage();
    if (localUri) {
      setImageUri(localUri);
      setImageChanged(true);
    }
  };

  const handleRemoveImage = async () => {
    if (uploadingImage) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.timing(imageScale, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setImageUri(null);
      setImageChanged(true);
      Animated.spring(imageScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });
  };

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
    
    if (Object.keys(newErrors).length > 0) {
      shakeError();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || uploadingImage) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    let finalImageUrl = card?.imageUrl || null;

    try {
      // Handle image changes
      if (imageChanged) {
        // If we're removing the image
        if (!imageUri) {
          // Delete the old image if it exists
          if (card?.imageUrl) {
            setUploadingImage(true);
            await deleteCardImage(card.imageUrl);
            setUploadingImage(false);
          }
          finalImageUrl = null;
        } 
        // If we're adding or changing the image
        else if (imageUri && imageUri.startsWith('file://')) {
          // This is a new local image that needs to be uploaded
          setUploadingImage(true);
          
          // Delete old image first if it exists
          if (card?.imageUrl && card.imageUrl !== imageUri) {
            await deleteCardImage(card.imageUrl);
          }
          
          // Upload new image
          const uploadId = card?.id || `temp-${Date.now()}`;
          finalImageUrl = await uploadCardImage(imageUri, uploadId);
          setUploadingImage(false);
        }
        // If imageUri is a URL (not changing the existing image)
        else {
          finalImageUrl = imageUri;
        }
      }

      const cardData = {
        cardName: cardName.trim(),
        issuer: issuer.trim(),
        defaultRewardRate: parseFloat(defaultRewardRate) || 1,
        imageUrl: finalImageUrl,
      };

      if (isEdit) {
        await api.updateCard(card.id, cardData);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Card updated successfully');
      } else {
        const newCard = await api.createCard(cardData);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Card added successfully');
      }
      navigation.goBack();
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        `Failed to ${isEdit ? 'update' : 'create'} card. Please try again.`
      );
      console.error('Save card error:', error);
      
      // If image upload failed, clean up any partially uploaded images
      if (uploadingImage && finalImageUrl && finalImageUrl.startsWith('https://')) {
        try {
          await deleteCardImage(finalImageUrl);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
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
            <Icon name="credit-card" size={40} color="#FFF" />
            <Text style={styles.headerTitle}>
              {isEdit ? 'Edit Card' : 'Add New Card'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEdit ? 'Update your card details' : 'Track rewards for a new card'}
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
          {/* Card Image */}
          <View style={styles.imageSection}>
            <Text style={styles.label}>Card Image</Text>
            <Text style={styles.helperText}>Add a photo to easily identify your card</Text>
            
            <Animated.View
              style={[
                styles.imageContainer,
                {
                  transform: [{ scale: imageScale }],
                },
              ]}
            >
              <TouchableOpacity
                onPress={handlePickImage}
                activeOpacity={0.9}
                disabled={uploadingImage}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.cardImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <View style={styles.imagePlaceholderContent}>
                      <View style={styles.uploadIconContainer}>
                        <Icon name="add-a-photo" size={32} color="#1976D2" />
                      </View>
                      <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
                    </View>
                  </View>
                )}
                {uploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {imageUri && (
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}
                  activeOpacity={0.7}
                >
                  <Icon name="close" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>

          {/* Card Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Card Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputWrapper, errors.cardName && styles.inputError]}>
              <Icon name="credit-card" size={20} color="#9E9E9E" style={styles.inputIcon} />
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
                placeholderTextColor="#B0BEC5"
                autoFocus={!isEdit}
                maxLength={50}
              />
            </View>
            {errors.cardName && (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={14} color="#F44336" />
                <Text style={styles.errorText}>{errors.cardName}</Text>
              </View>
            )}
          </View>

          {/* Issuer Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Issuer</Text>
            <View style={styles.inputWrapper}>
              <Icon name="business" size={20} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={issuer}
                onChangeText={setIssuer}
                placeholder="e.g., Chase"
                placeholderTextColor="#B0BEC5"
                maxLength={30}
              />
            </View>
            <Text style={styles.helperText}>Optional - Bank or card issuer</Text>
          </View>

          {/* Default Reward Rate Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Default Reward Rate</Text>
            <View style={[styles.inputWrapper, styles.rateInputWrapper, errors.defaultRewardRate && styles.inputError]}>
              <Icon name="percent" size={20} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.rateInput]}
                value={defaultRewardRate}
                onChangeText={(text) => {
                  setDefaultRewardRate(text);
                  if (errors.defaultRewardRate) {
                    setErrors({ ...errors, defaultRewardRate: null });
                  }
                }}
                placeholder="1"
                placeholderTextColor="#B0BEC5"
                keyboardType="decimal-pad"
                maxLength={5}
              />
              <View style={styles.percentBadge}>
                <Text style={styles.percentText}>%</Text>
              </View>
            </View>
            {errors.defaultRewardRate ? (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={14} color="#F44336" />
                <Text style={styles.errorText}>{errors.defaultRewardRate}</Text>
              </View>
            ) : (
              <Text style={styles.helperText}>
                Cashback rate for purchases without specific bonuses
              </Text>
            )}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Icon name="info" size={20} color="#1976D2" />
            <Text style={styles.infoText}>
              After creating your card, you can add bonus categories to maximize your rewards!
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
              style={[styles.button, styles.saveButton, (loading || uploadingImage) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading || uploadingImage}
              activeOpacity={0.8}
            >
              {loading || uploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={styles.saveButtonContent}>
                  <Icon name="save" size={20} color="#FFF" style={styles.buttonIcon} />
                  <Text style={styles.saveButtonText}>
                    {isEdit ? 'Update Card' : 'Add Card'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.ScrollView>
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
  },
  form: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: -spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  imageSection: {
    marginBottom: spacing.xl,
  },
  imageContainer: {
    marginTop: spacing.md,
    position: 'relative',
    alignItems: 'center',
  },
  cardImage: {
    width: width - (spacing.md * 2) - (spacing.lg * 2),
    height: (width - (spacing.md * 2) - (spacing.lg * 2)) * 0.63,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
  },
  imagePlaceholder: {
    width: width - (spacing.md * 2) - (spacing.lg * 2),
    height: (width - (spacing.md * 2) - (spacing.lg * 2)) * 0.63,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryBackground,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderContent: {
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  imagePlaceholderText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    ...typography.body2,
    color: colors.surface,
    marginTop: spacing.sm,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body1,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  rateInputWrapper: {
    paddingRight: 0,
  },
  rateInput: {
    paddingRight: spacing.sm,
  },
  percentBadge: {
    backgroundColor: colors.primaryBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    height: 36,
    justifyContent: 'center',
  },
  percentText: {
    ...typography.h5,
    color: colors.primary,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  infoText: {
    ...typography.body2,
    color: colors.primary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
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
    marginLeft: spacing.sm,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
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
});