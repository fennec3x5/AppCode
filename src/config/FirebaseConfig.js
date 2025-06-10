// src/config/FirebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_API_KEY } from './FirebaseSecrets';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "cc-cashback-tracker-402d1.firebaseapp.com",
  projectId: "cc-cashback-tracker-402d1",
  storageBucket: "cc-cashback-tracker-402d1.firebasestorage.app",
  messagingSenderId: "997274583552",
  appId: "1:997274583552:web:470498cda1cd18d2c50ee5",
  measurementId: "G-9LG4HFLWSY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firebase Auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Export the project ID for use in other services
export const EXPO_PROJECT_ID = "e5e984e4-7d5f-40ee-982e-0d02f45ded63";

export default app;