// src/services/ImageUploadService.js
import ImageCropPicker from 'react-native-image-crop-picker';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/FirebaseConfig';
import { Alert, ActionSheetIOS, Platform } from 'react-native';

export const pickImage = async () => {
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

    if (choice === 2 || choice === undefined) {
      console.log('User cancelled image picker.');
      return null;
    }

    const cropOptions = {
      width: 856, // Standard credit card pixels (85.6mm * 10)
      height: 540, // Standard credit card pixels (54.0mm * 10)
      cropping: true,
      compressImageQuality: 0.8, // Good balance of quality and size
      mediaType: 'photo',
    };

    let image;
    if (choice === 0) { // Take Photo
      image = await ImageCropPicker.openCamera(cropOptions);
    } else { // Choose from Library
      image = await ImageCropPicker.openPicker(cropOptions);
    }

    // The result object contains the path to the cropped image
    return image.path;

  } catch (error) {
    // A common "error" is the user cancelling the picker.
    if (error.code === 'E_PICKER_CANCELLED') {
      console.log('User cancelled image picker.');
      return null;
    }
    console.error('Error during image picking process:', error);
    Alert.alert('Error', 'An unexpected error occurred while selecting the image.');
    return null;
  }
};

export const uploadCardImage = async (imageUri, cardId, userId) => {
  if (!userId) {
    throw new Error('User ID is required for image upload');
  }

  try {
    console.log('Starting upload for:', imageUri);
    const filename = `users/${userId}/card-images/${cardId}-${Date.now()}.jpg`;
    const response = await fetch(imageUri);
    if (!response.ok) throw new Error('Failed to fetch image for upload.');
    
    const blob = await response.blob();
    console.log('Blob created, size:', blob.size);
    
    const storageRef = ref(storage, filename);
    const metadata = { 
      contentType: 'image/jpeg',
      customMetadata: {
        userId: userId,
        cardId: cardId
      }
    };
    
    console.log('Uploading to:', filename);
    const snapshot = await uploadBytes(storageRef, blob, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    Alert.alert('Upload Failed', 'Could not upload the image. Please check your connection and try again.');
    throw error;
  }
};

export const deleteCardImage = async (imageUrl, userId) => {
  if (!imageUrl || !imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
    console.log("Not a Firebase Storage URL, skipping delete.");
    return;
  }

  if (!userId) {
    console.error('User ID is required for image deletion');
    return;
  }

  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    console.log('Image deleted successfully:', imageUrl);
  } catch (error)
 {
    if (error.code === 'storage/object-not-found') {
      console.log("Image to delete was not found, which is okay.");
    } else {
      console.error('Error deleting image:', error);
    }
  }
};