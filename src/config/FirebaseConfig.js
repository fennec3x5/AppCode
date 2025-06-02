// src/config/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_zQxsOi9MBbiwASEaZe0yhp7Jo_qHSbk",
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

export default app;