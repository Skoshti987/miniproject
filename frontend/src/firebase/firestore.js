import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  serverTimestamp,
  setDoc 
} from 'firebase/firestore';
import { db } from './config';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  QUERIES: 'queries',
  IMAGES: 'images',
  WEATHER: 'weather',
  FEEDBACK: 'feedback',
  ESCALATIONS: 'escalations',
  ADVISORIES: 'advisories',
  CROPS: 'crops',
  DISEASES: 'diseases',
  NOTIFICATIONS: 'notifications'
};

// User Management
export const userService = {
  // Create or update user profile
  async createOrUpdateUser(userId, userData) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const existing = await getDoc(userRef);
      const baseData = {
        ...userData,
        updatedAt: serverTimestamp()
      };
      if (!existing.exists()) {
        await setDoc(userRef, { ...baseData, createdAt: serverTimestamp() }, { merge: true });
      } else {
        await setDoc(userRef, baseData, { merge: true });
      }
      return { success: true, id: userId };
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  },

  // Get user profile
  async getUser(userId) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Update user preferences
  async updateUserPreferences(userId, preferences) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        preferences,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
};

// Query Management
export const queryService = {
  // Save user query
  async saveQuery(queryData) {
    try {
      const queryRef = await addDoc(collection(db, COLLECTIONS.QUERIES), {
        ...queryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: queryRef.id };
    } catch (error) {
      console.error('Error saving query:', error);
      throw error;
    }
  },

  // Get user queries
  async getUserQueries(userId, limitCount = 20) {
    try {
      const q = query(
        collection(db, COLLECTIONS.QUERIES),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user queries:', error);
      throw error;
    }
  },

  // Update query with response
  async updateQueryResponse(queryId, response) {
    try {
      const queryRef = doc(db, COLLECTIONS.QUERIES, queryId);
      await updateDoc(queryRef, {
        response,
        respondedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating query response:', error);
      throw error;
    }
  }
};

// Image Management
export const imageService = {
  // Save image analysis result
  async saveImageAnalysis(imageData) {
    try {
      const imageRef = await addDoc(collection(db, COLLECTIONS.IMAGES), {
        ...imageData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: imageRef.id };
    } catch (error) {
      console.error('Error saving image analysis:', error);
      throw error;
    }
  },

  // Get user images
  async getUserImages(userId, limitCount = 20) {
    try {
      const q = query(
        collection(db, COLLECTIONS.IMAGES),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user images:', error);
      throw error;
    }
  }
};

// Weather Management
export const weatherService = {
  // Save weather data
  async saveWeatherData(weatherData) {
    try {
      const weatherRef = await addDoc(collection(db, COLLECTIONS.WEATHER), {
        ...weatherData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      return { success: true, id: weatherRef.id };
    } catch (error) {
      console.error('Error saving weather data:', error);
      throw error;
    }
  },

  // Get weather data for location
  async getWeatherData(location, limitCount = 7) {
    try {
      const q = query(
        collection(db, COLLECTIONS.WEATHER),
        where('location', '==', location),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting weather data:', error);
      throw error;
    }
  }
};

// Feedback Management
export const feedbackService = {
  // Save user feedback
  async saveFeedback(feedbackData) {
    try {
      const feedbackRef = await addDoc(collection(db, COLLECTIONS.FEEDBACK), {
        ...feedbackData,
        createdAt: serverTimestamp()
      });
      return { success: true, id: feedbackRef.id };
    } catch (error) {
      console.error('Error saving feedback:', error);
      throw error;
    }
  },

  // Get feedback for query
  async getQueryFeedback(queryId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.FEEDBACK),
        where('queryId', '==', queryId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting query feedback:', error);
      throw error;
    }
  }
};

// Escalation Management
export const escalationService = {
  // Create escalation
  async createEscalation(escalationData) {
    try {
      const escalationRef = await addDoc(collection(db, COLLECTIONS.ESCALATIONS), {
        ...escalationData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: escalationRef.id };
    } catch (error) {
      console.error('Error creating escalation:', error);
      throw error;
    }
  },

  // Get escalations
  async getEscalations(status = 'pending', limitCount = 50) {
    try {
      const q = query(
        collection(db, COLLECTIONS.ESCALATIONS),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting escalations:', error);
      throw error;
    }
  },

  // Update escalation status
  async updateEscalationStatus(escalationId, status, response) {
    try {
      const escalationRef = doc(db, COLLECTIONS.ESCALATIONS, escalationId);
      await updateDoc(escalationRef, {
        status,
        response,
        respondedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating escalation status:', error);
      throw error;
    }
  }
};

// Advisory Management
export const advisoryService = {
  // Get agricultural advisories
  async getAdvisories(crop = null, location = null, limitCount = 20) {
    try {
      let q = query(
        collection(db, COLLECTIONS.ADVISORIES),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (crop) {
        q = query(q, where('crops', 'array-contains', crop));
      }
      if (location) {
        q = query(q, where('locations', 'array-contains', location));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting advisories:', error);
      throw error;
    }
  },

  // Save new advisory
  async saveAdvisory(advisoryData) {
    try {
      const advisoryRef = await addDoc(collection(db, COLLECTIONS.ADVISORIES), {
        ...advisoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: advisoryRef.id };
    } catch (error) {
      console.error('Error saving advisory:', error);
      throw error;
    }
  }
};
