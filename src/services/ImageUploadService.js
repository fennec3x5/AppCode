import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/FirebaseConfig';
import { Alert, ActionSheetIOS, Platform } from 'react-native';

export const pickImage = async () => {
  try {
    // Request permissions
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (libraryStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
      return null;
    }

    // Show options for image source
    return new Promise((resolve) => {
      const options = ['Take Photo', 'Choose from Library', 'Cancel'];
      const cancelButtonIndex = 2;

      const showPicker = (index) => {
        if (index === cancelButtonIndex) {
          resolve(null);
          return;
        }

        const pickerOptions = {
          mediaTypes: ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : ['images'],
          allowsEditing: false,
          quality: 0.8,
          base64: false,
          exif: false,
        };

        const launchPicker = index === 0 
          ? (cameraStatus === 'granted' ? ImagePicker.launchCameraAsync : null)
          : ImagePicker.launchImageLibraryAsync;

        if (!launchPicker) {
          Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
          resolve(null);
          return;
        }

        launchPicker(pickerOptions).then((result) => {
          if (!result.canceled && result.assets && result.assets[0]) {
            resolve(result.assets[0].uri);
          } else {
            resolve(null);
          }
        }).catch((error) => {
          console.error('Error picking image:', error);
          Alert.alert('Error', 'Failed to pick image');
          resolve(null);
        });
      };

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex,
          },
          showPicker
        );
      } else {
        // For Android, use Alert
        Alert.alert(
          'Select Image',
          'Choose image source',
          [
            { text: 'Take Photo', onPress: () => showPicker(0) },
            { text: 'Choose from Library', onPress: () => showPicker(1) },
            { text: 'Cancel', onPress: () => showPicker(2), style: 'cancel' },
          ],
          { cancelable: true }
        );
      }
    });
  } catch (error) {
    console.error('Error in pickImage:', error);
    Alert.alert('Error', 'Failed to pick image');
    return null;
  }
};

export const uploadCardImage = async (imageUri, cardId) => {
  try {
    console.log('Starting upload for:', imageUri);
    
    // Create a unique filename
    const filename = `card-images/${cardId}-${Date.now()}.jpg`;
    
    // Convert image to blob
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    
    const blob = await response.blob();
    console.log('Blob created, size:', blob.size);
    
    // Create storage reference
    const storageRef = ref(storage, filename);
    
    // Upload with metadata
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        cardId: cardId,
        uploadedAt: new Date().toISOString(),
      }
    };
    
    console.log('Uploading to:', filename);
    const snapshot = await uploadBytes(storageRef, blob, metadata);
    console.log('Upload complete');
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteCardImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    // Extract the file path from the URL
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
    const startIndex = imageUrl.indexOf(baseUrl);
    
    if (startIndex === -1) return;

    const pathStart = imageUrl.indexOf('/o/') + 3;
    const pathEnd = imageUrl.indexOf('?');
    const filePath = decodeURIComponent(imageUrl.substring(pathStart, pathEnd));

    // Create a reference and delete
    const imageRef = ref(storage, filePath);
    await deleteObject(imageRef);
    console.log('Image deleted successfully:', filePath);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - we don't want to prevent card deletion if image deletion fails
  }
};