// src/hooks/useCardImageHandler.js
import { useState } from 'react';
import { pickImage, uploadCardImage, deleteCardImage } from '../services/ImageUploadService';

export const useCardImageHandler = (initialImageUrl) => {
  const [imageUri, setImageUri] = useState(initialImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);

  const handlePickImage = async () => {
    const localUri = await pickImage();
    if (localUri) {
      setImageUri(localUri);
      setImageChanged(true);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
    setImageChanged(true);
  };
  
  // This function contains all the complex upload/delete logic
  const processImage = async (card) => {
    if (!imageChanged) {
      return card?.imageUrl || null;
    }

    setIsUploading(true);
    let finalImageUrl = card?.imageUrl || null;

    try {
      // Case 1: Image was removed
      if (!imageUri && card?.imageUrl) {
        await deleteCardImage(card.imageUrl);
        finalImageUrl = null;
      }
      // Case 2: A new local image was selected for upload
      else if (imageUri && imageUri.startsWith('file://')) {
        // Delete the old image first if it exists
        if (card?.imageUrl) {
          await deleteCardImage(card.imageUrl);
        }
        const uploadId = card?.id || `temp-${Date.now()}`;
        finalImageUrl = await uploadCardImage(imageUri, uploadId);
      }
      return finalImageUrl;
    } catch (error) {
      console.error("Image processing failed:", error);
      // Re-throw to be caught by the main save handler
      throw new Error("Image processing failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return {
    imageUri,
    isUploading,
    handlePickImage,
    handleRemoveImage,
    processImage,
  };
};