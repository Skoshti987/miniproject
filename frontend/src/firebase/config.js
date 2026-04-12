import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your_firebase_api_key_here",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your_project_id.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your_project_id_here",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your_project_id.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "your_messaging_sender_id_here",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "your_app_id_here",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "your_measurement_id_here",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://your_project_id-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : null;

export default app;
