import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/FirebaseConfig';
import { Alert } from 'react-native';

export const pickImage = async () => {
  try {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10], // Credit card aspect ratio
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image');
    return null;
  }
};

export const uploadCardImage = async (imageUri, cardId) => {
  try {
    // Fetch the image
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create a reference to the storage location
    const filename = `card-images/${cardId}-${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);

    // Upload the image
    const snapshot = await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

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
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - we don't want to prevent card deletion if image deletion fails
  }
};