// Firebase configuration
// Replace these values with your actual Firebase config from Firebase Console
// Get your config from: Firebase Console → Project Settings → Your apps → Web app

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For GitHub Pages, we need to hardcode the config since .env files aren't available in the build
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAxkta8Xpcm0_itZl5guCXeFrgIWZJjZjg",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "poker-tournament-dapp.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "poker-tournament-dapp",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "poker-tournament-dapp.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "712334625837",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:712334625837:web:e702d190869adfa1373ca4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

