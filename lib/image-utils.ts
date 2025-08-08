import { Platform } from 'react-native';

// Try to import ImageManipulator, with fallback if not available
let ImageManipulator: any = null;
let isImageManipulatorAvailable = false;

try {
  if (Platform.OS === 'web') {
    // For web, we might not have the native module
    console.log('Web platform detected, checking ImageManipulator availability...');
  }
  
  ImageManipulator = require('expo-image-manipulator');
  isImageManipulatorAvailable = true;
  console.log('✅ expo-image-manipulator loaded successfully');
} catch (error) {
  console.warn('⚠️ expo-image-manipulator not available, using fallback implementation:', error);
  // Fallback implementation
  ImageManipulator = {
    manipulateAsync: async (uri: string, operations: any[], options: any) => {
      console.warn('ImageManipulator fallback: returning original image');
      return { uri };
    },
    SaveFormat: {
      JPEG: 'jpeg',
      PNG: 'png',
    }
  };
  isImageManipulatorAvailable = false;
}

/**
 * Safely manipulate an image using expo-image-manipulator with fallback
 * @param uri - The image URI to manipulate
 * @param operations - Array of manipulation operations
 * @param options - Options for the manipulation
 * @returns Promise<{uri: string}> - The manipulated image URI
 */
export const safeImageManipulate = async (
  uri: string,
  operations: any[],
  options: any = {}
): Promise<{ uri: string }> => {
  try {
    if (!isImageManipulatorAvailable) {
      console.log('ImageManipulator not available, returning original image');
      return { uri };
    }

    return await ImageManipulator.manipulateAsync(uri, operations, options);
  } catch (error) {
    console.error('Error manipulating image:', error);
    // Return original image as fallback
    return { uri };
  }
};

/**
 * Check if ImageManipulator is available
 * @returns boolean
 */
export const isImageManipulatorReady = (): boolean => {
  return isImageManipulatorAvailable;
};

/**
 * Get the SaveFormat enum from ImageManipulator
 * @returns Object with JPEG and PNG formats
 */
export const getSaveFormat = () => {
  return ImageManipulator?.SaveFormat || {
    JPEG: 'jpeg',
    PNG: 'png',
  };
};

export default {
  safeImageManipulate,
  isImageManipulatorReady,
  getSaveFormat,
};
