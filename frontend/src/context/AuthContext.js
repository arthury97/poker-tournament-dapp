import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userData?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            emailVerified: firebaseUser.emailVerified,
            createdAt: userData?.createdAt || firebaseUser.metadata.creationTime,
            walletAddress: userData?.walletAddress || null,
            ...userData
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic user info if Firestore fails
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            emailVerified: firebaseUser.emailVerified,
            createdAt: firebaseUser.metadata.creationTime,
            walletAddress: null
          });
        }
      } else {
        // User is signed out - clear user state
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signUp = async (name, email, password) => {
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, {
        displayName: name
      });

      // Create user document in Firestore
      const userData = {
        name,
        email,
        createdAt: new Date().toISOString(),
        emailVerified: false
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      // Return user object (will be set by onAuthStateChanged)
      return {
        success: true,
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name,
          emailVerified: false,
          createdAt: userData.createdAt
        }
      };
    } catch (error) {
      console.error('Sign up error:', error);
      
      // Convert Firebase errors to user-friendly messages
      let errorMessage = 'Failed to create account';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support';
          break;
        default:
          errorMessage = error.message || 'Failed to create account';
      }
      
      throw new Error(errorMessage);
    }
  };

  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.data();

      // Return user object (will be set by onAuthStateChanged)
      return {
        success: true,
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          emailVerified: firebaseUser.emailVerified,
          createdAt: userData?.createdAt || firebaseUser.metadata.creationTime,
          ...userData
        }
      };
    } catch (error) {
      console.error('Sign in error:', error);
      
      // Convert Firebase errors to user-friendly messages
      let errorMessage = 'Failed to sign in';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        default:
          errorMessage = error.message || 'Failed to sign in';
      }
      
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // User state will be cleared by onAuthStateChanged
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  };

  // Function to save wallet address to user's Firestore document
  const saveWalletAddress = async (walletAddress) => {
    if (!user || !user.uid) {
      throw new Error('User must be signed in to save wallet address');
    }
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        walletAddress: walletAddress.toLowerCase(), // Store lowercase for consistency
        walletConnectedAt: new Date().toISOString()
      });
      
      // Update local user state
      setUser(prev => ({
        ...prev,
        walletAddress: walletAddress.toLowerCase()
      }));
    } catch (error) {
      console.error('Error saving wallet address:', error);
      throw error;
    }
  };

  // Function to check if user can purchase a token (prevent self-purchase)
  const canPurchaseToken = async (tokenCreatorAddress) => {
    if (!user || !user.uid) {
      return false; // Must be signed in to purchase
    }
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return true; // New user without saved data, allow purchase
      }
      
      const userData = userDoc.data();
      const userWallet = userData.walletAddress?.toLowerCase();
      const creatorWallet = tokenCreatorAddress?.toLowerCase();
      
      // Check if user's linked wallet matches the token creator's wallet
      if (userWallet && creatorWallet && userWallet === creatorWallet) {
        console.log('❌ Self-purchase prevented: User wallet matches token creator');
        return false; // Same wallet, prevent purchase
      }
      
      console.log('✅ Purchase allowed: Different wallets');
      return true;
    } catch (error) {
      console.error('Error checking purchase eligibility:', error);
      return true; // Allow on error to not block legitimate users
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signUp,
    signIn,
    signOut,
    saveWalletAddress,
    canPurchaseToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
