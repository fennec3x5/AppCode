// src/services/ImageUploadService.js
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/FirebaseConfig';
import { Alert, ActionSheetIOS, Platform } from 'react-native';

// Helper function to get necessary permissions
const getPermissions = async () => {
  const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
  const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (libraryStatus !== 'granted' || cameraStatus !== 'granted') {
    Alert.alert(
      'Permission Required',
      'We need access to your camera and photo library to add images.'
    );
    return false;
  }
  return true;
};

export const pickImage = async () => {
  const hasPermissions = await getPermissions();
  if (!hasPermissions) return null;

  try {
    // Show options for image source using a Promise-based wrapper for the ActionSheet
    const choice = await new Promise((resolve) => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Take Photo', 'Choose from Library', 'Cancel'],
            cancelButtonIndex: 2,
          },
          buttonIndex => resolve(buttonIndex)
        );
      } else {
        Alert.alert(
          'Select Image Source', '',
          [
            { text: 'Take Photo', onPress: () => resolve(0) },
            { text: 'Choose from Library', onPress: () => resolve(1) },
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(2) },
          ],
          { onDismiss: () => resolve(2) }
        );
      }
    });

    // Handle user's choice
    if (choice === 2 || choice === undefined) { // 2 is Cancel, undefined if dismissed on Android
      return null;
    }

    const pickerOptions = {
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1.586, 1], // Credit card aspect ratio
      quality: 0.7,
    };

    let result;
    if (choice === 0) { // Take Photo
      result = await ImagePicker.launchCameraAsync(pickerOptions);
    } else { // Choose from Library
      result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;

  } catch (error) {
    console.error('Error during image picking process:', error);
    Alert.alert('Error', 'An unexpected error occurred while selecting the image.');
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
    if (!response.ok) throw new Error('Failed to fetch image for upload.');
    
    const blob = await response.blob();
    console.log('Blob created, size:', blob.size);
    
    const storageRef = ref(storage, filename);
    const metadata = { contentType: 'image/jpeg' };
    
    console.log('Uploading to:', filename);
    const snapshot = await uploadBytes(storageRef, blob, metadata);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    Alert.alert('Upload Failed', 'Could not upload the image. Please check your connection and try again.');
    throw error; // Re-throw to be caught by the calling function
  }
};

export const deleteCardImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
    console.log("Not a Firebase Storage URL, skipping delete.");
    return;
  }

  try {
    // The SDK can create a reference directly from the download URL.
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    console.log('Image deleted successfully:', imageUrl);
  } catch (error) {
    // It's often safe to ignore "object-not-found" errors during cleanup
    if (error.code === 'storage/object-not-found') {
      console.log("Image to delete was not found, which is okay.");
    } else {
      console.error('Error deleting image:', error);
      // We don't re-throw here because a failed image deletion shouldn't
      // prevent the parent operation (like deleting a card) from completing.
    }
  }
};