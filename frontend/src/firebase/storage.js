import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata 
} from 'firebase/storage';
import { storage } from './config';

// Storage paths
export const STORAGE_PATHS = {
  USER_IMAGES: 'user-images',
  PLANT_IMAGES: 'plant-images',
  PROFILE_PHOTOS: 'profile-photos',
  DOCUMENTS: 'documents',
  TEMP: 'temp'
};

// Image Upload Service
export const imageUploadService = {
  // Upload plant image
  async uploadPlantImage(file, userId, metadata = {}) {
    try {
      const timestamp = Date.now();
      const fileName = `plant_${userId}_${timestamp}.${file.name.split('.').pop()}`;
      const imageRef = ref(storage, `${STORAGE_PATHS.PLANT_IMAGES}/${userId}/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(imageRef, file, {
        customMetadata: {
          userId,
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      });
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        url: downloadURL,
        path: snapshot.ref.fullPath,
        metadata: {
          name: fileName,
          size: file.size,
          type: file.type,
          ...metadata
        }
      };
    } catch (error) {
      console.error('Error uploading plant image:', error);
      throw error;
    }
  },

  // Upload profile photo
  async uploadProfilePhoto(file, userId) {
    try {
      const timestamp = Date.now();
      const fileName = `profile_${userId}_${timestamp}.${file.name.split('.').pop()}`;
      const imageRef = ref(storage, `${STORAGE_PATHS.PROFILE_PHOTOS}/${userId}/${fileName}`);
      
      const snapshot = await uploadBytes(imageRef, file, {
        customMetadata: {
          userId,
          type: 'profile-photo',
          uploadedAt: new Date().toISOString()
        }
      });
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        url: downloadURL,
        path: snapshot.ref.fullPath
      };
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  },

  // Upload document
  async uploadDocument(file, userId, documentType) {
    try {
      const timestamp = Date.now();
      const fileName = `${documentType}_${userId}_${timestamp}.${file.name.split('.').pop()}`;
      const docRef = ref(storage, `${STORAGE_PATHS.DOCUMENTS}/${userId}/${fileName}`);
      
      const snapshot = await uploadBytes(docRef, file, {
        customMetadata: {
          userId,
          documentType,
          uploadedAt: new Date().toISOString()
        }
      });
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        url: downloadURL,
        path: snapshot.ref.fullPath
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Get user images
  async getUserImages(userId, path = STORAGE_PATHS.PLANT_IMAGES) {
    try {
      const userImagesRef = ref(storage, `${path}/${userId}`);
      const result = await listAll(userImagesRef);
      
      const images = await Promise.all(
        result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          return {
            name: itemRef.name,
            url,
            path: itemRef.fullPath,
            metadata: metadata.customMetadata,
            size: metadata.size,
            contentType: metadata.contentType,
            timeCreated: metadata.timeCreated
          };
        })
      );
      
      return images;
    } catch (error) {
      console.error('Error getting user images:', error);
      throw error;
    }
  },

  // Delete image
  async deleteImage(imagePath) {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // Get image metadata
  async getImageMetadata(imagePath) {
    try {
      const imageRef = ref(storage, imagePath);
      const metadata = await getMetadata(imageRef);
      return {
        name: metadata.name,
        size: metadata.size,
        contentType: metadata.contentType,
        timeCreated: metadata.timeCreated,
        customMetadata: metadata.customMetadata
      };
    } catch (error) {
      console.error('Error getting image metadata:', error);
      throw error;
    }
  }
};

// File Management Service
export const fileService = {
  // Upload multiple files
  async uploadMultipleFiles(files, userId, path = STORAGE_PATHS.TEMP) {
    try {
      const uploadPromises = files.map(file => 
        imageUploadService.uploadPlantImage(file, userId, { batch: true })
      );
      
      const results = await Promise.all(uploadPromises);
      return {
        success: true,
        files: results
      };
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  },

  // Clean up temporary files
  async cleanupTempFiles(userId) {
    try {
      const tempRef = ref(storage, `${STORAGE_PATHS.TEMP}/${userId}`);
      const result = await listAll(tempRef);
      
      const deletePromises = result.items.map(item => 
        deleteObject(item)
      );
      
      await Promise.all(deletePromises);
      return { success: true, deletedCount: result.items.length };
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
      throw error;
    }
  }
};
