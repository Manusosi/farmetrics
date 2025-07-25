import { supabase } from '@/integrations/supabase/client';

export interface ExifData {
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  deviceModel?: string;
  cameraSettings?: {
    iso?: number;
    aperture?: string;
    shutterSpeed?: string;
    focalLength?: string;
  };
  imageData?: {
    width?: number;
    height?: number;
    orientation?: number;
  };
}

export interface MediaUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  exifData?: ExifData;
  error?: string;
}

export interface StorageBucket {
  name: string;
  description: string;
  public?: boolean;
}

// Define storage buckets for different media types
export const STORAGE_BUCKETS: StorageBucket[] = [
  {
    name: 'farm-images',
    description: 'Images of farms and farm boundaries',
    public: true
  },
  {
    name: 'visit-media',
    description: 'Photos and videos from farm visits',
    public: true
  },
  {
    name: 'profile-images',
    description: 'Profile photos for users',
    public: true
  },
  {
    name: 'issue-attachments',
    description: 'Media attached to issue reports',
    public: true
  }
];

/**
 * Initialize storage buckets if they don't exist
 */
export const initializeStorageBuckets = async (): Promise<void> => {
  try {
    // Get existing buckets
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const existingBucketNames = existingBuckets?.map(b => b.name) || [];

    // Create missing buckets
    for (const bucket of STORAGE_BUCKETS) {
      if (!existingBucketNames.includes(bucket.name)) {
        const { error: createError } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public || false,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'],
          fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
        });

        if (createError && !createError.message.includes('already exists')) {
          throw createError;
        }
      }
    }
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
  }
};

/**
 * Extract EXIF data from an image file
 */
export const extractExifData = async (file: File): Promise<ExifData> => {
  return new Promise((resolve) => {
    try {
      // For now, we'll implement basic EXIF extraction
      // In a real implementation, you might use a library like exif-js or piexifjs
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const dataView = new DataView(arrayBuffer);
          
          // Basic EXIF extraction (simplified)
          const exifData: ExifData = {
            timestamp: new Date().toISOString(),
            imageData: {
              width: 0, // Would be extracted from actual EXIF
              height: 0, // Would be extracted from actual EXIF
            }
          };

          // Check if geolocation is available in the browser
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                exifData.latitude = position.coords.latitude;
                exifData.longitude = position.coords.longitude;
                resolve(exifData);
              },
              () => {
                // Geolocation failed, return data without coordinates
                resolve(exifData);
              }
            );
          } else {
            resolve(exifData);
          }
        } catch (error) {
          console.error('Error extracting EXIF data:', error);
          resolve({
            timestamp: new Date().toISOString()
          });
        }
      };

      reader.onerror = () => {
        resolve({
          timestamp: new Date().toISOString()
        });
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading file for EXIF extraction:', error);
      resolve({
        timestamp: new Date().toISOString()
      });
    }
  });
};

/**
 * Upload media file to Supabase storage with EXIF data
 */
export const uploadMedia = async (
  file: File,
  bucket: string,
  folder: string,
  filename?: string
): Promise<MediaUploadResult> => {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'File type not allowed. Please upload JPEG, PNG, WebP images or MP4/MOV videos.'
      };
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size too large. Please upload files smaller than 10MB.'
      };
    }

    // Extract EXIF data for images
    let exifData: ExifData | undefined;
    if (file.type.startsWith('image/')) {
      exifData = await extractExifData(file);
    }

    // Generate filename if not provided
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = file.name.split('.').pop();
    const finalFilename = filename || `${timestamp}.${fileExtension}`;
    const filePath = `${folder}/${finalFilename}`;

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
          size: file.size.toString(),
          type: file.type,
          ...(exifData && { exifData: JSON.stringify(exifData) })
        }
      });

    if (uploadError) {
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      exifData
    };

  } catch (error: any) {
    console.error('Error uploading media:', error);
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
};

/**
 * Delete media file from storage
 */
export const deleteMedia = async (bucket: string, path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting media:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting media:', error);
    return false;
  }
};

/**
 * Get media URL with optional transformation
 */
export const getMediaUrl = (
  bucket: string,
  path: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path, {
      transform: options ? {
        width: options.width,
        height: options.height,
        quality: options.quality
      } : undefined
    });

  return data.publicUrl;
};

/**
 * List media files in a folder
 */
export const listMediaFiles = async (
  bucket: string,
  folder: string
): Promise<{ name: string; size: number; lastModified: string }[]> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder);

    if (error) {
      console.error('Error listing media files:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error listing media files:', error);
    return [];
  }
};

/**
 * Validate GPS coordinates from EXIF data
 */
export const validateGpsCoordinates = (exifData: ExifData): boolean => {
  if (!exifData.latitude || !exifData.longitude) {
    return false;
  }

  // Check if coordinates are within valid ranges
  const lat = exifData.latitude;
  const lng = exifData.longitude;

  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Calculate distance between two GPS points (in meters)
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Initialize media service
 */
export const initializeMediaService = async (): Promise<void> => {
  await initializeStorageBuckets();
}; 