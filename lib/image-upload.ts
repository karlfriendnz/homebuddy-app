import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Simple image upload function
export const uploadImageToSupabase = async (
  uri: string,
  userId: string,
  bucketName: string = 'household-images',
  fileName?: string
): Promise<UploadResult> => {
  try {
    // Generate filename if not provided
    const finalFileName = fileName || `image_${Date.now()}.jpg`;

    // Convert URI to blob
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(finalFileName, blob, {
        contentType: blob.type,
        upsert: true
      });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(finalFileName);

    return {
      success: true,
      url: publicUrl
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Simple household image upload
export const uploadHouseholdImage = async (
  uri: string,
  userId: string,
  householdId: string,
  householdName: string
): Promise<UploadResult> => {
  try {
    // Upload image
    const uploadResult = await uploadImageToSupabase(
      uri,
      userId,
      'household-images',
      `household_${householdId}_${Date.now()}.jpg`
    );

    if (!uploadResult.success) {
      return uploadResult;
    }

    // Update household with image URL
    const { error: updateError } = await supabase
      .from('households')
      .update({ image_url: uploadResult.url })
      .eq('id', householdId);

    if (updateError) {
      return {
        success: false,
        error: `Failed to update household: ${updateError.message}`
      };
    }

    return uploadResult;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Simple image size check
export const checkImageSize = async (
  uri: string,
  maxSizeMB: number = 5
): Promise<{ valid: boolean; sizeMB: number; error?: string }> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const sizeMB = blob.size / (1024 * 1024);

    return {
      valid: sizeMB <= maxSizeMB,
      sizeMB,
      error: sizeMB > maxSizeMB ? `Image too large: ${sizeMB.toFixed(2)}MB (max: ${maxSizeMB}MB)` : undefined
    };
  } catch (error) {
    return {
      valid: false,
      sizeMB: 0,
      error: 'Failed to check image size'
    };
  }
}; 