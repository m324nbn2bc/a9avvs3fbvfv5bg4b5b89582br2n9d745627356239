"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  reload,
  sendPasswordResetEmail
} from 'firebase/auth';
import { useFirebaseOptimized as useFirebase } from '../lib/firebase-optimized';
import { createUserProfile } from '../lib/firestore';
import { 
  handleSignInError, 
  handleSignUpError, 
  handlePasswordResetError, 
  handleEmailVerificationError,
  handleGoogleSignInError,
  getPasswordResetSuccessMessage 
} from '../utils/firebaseErrorHandler';

// Create Auth Context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingSignupUserId, setPendingSignupUserId] = useState(null);
  const [logoutInProgress, setLogoutInProgress] = useState(false);
  const firebase = useFirebase();
  const router = useRouter();

  useEffect(() => {
    // Don't set up auth listener until Firebase is loaded
    if (firebase.isLoading) return;
    
    // If Firebase is not configured, set loading to false and return
    if (!firebase.isConfigured || !firebase.auth) {
      setLoading(false);
      return;
    }
    
    // Set up auth listener with proper cleanup
    let unsubscribe = null;
    
    const setupAuthListener = async () => {
      try {
        // Listen for authentication state changes
        unsubscribe = onAuthStateChanged(firebase.auth, async (user) => {
          if (user) {
            // Create user profile in Firestore if it doesn't exist
            try {
              await createUserProfile(user);
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error('Error creating user profile:', error);
              }
            }
            
            // Clear pending signup flag if this user was pending (using functional update to always see latest value)
            setPendingSignupUserId(current => current === user.uid ? null : current);
          }
          
          // Clear logout in progress flag on any auth state change
          setLogoutInProgress(false);
          setUser(user);
          setLoading(false);
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to set up auth listener:', error);
        }
        setLoading(false);
      }
    };

    setupAuthListener();

    // Return cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [firebase.isLoading, firebase.isConfigured, firebase.auth]);

  // Show loading state while Firebase is initializing only
  if (firebase.isLoading) {
    const noopAsync = async () => ({ success: false });
    const noop = () => {};
    
    return (
      <AuthContext.Provider value={{ 
        user: null, 
        loading: true, 
        mounted: true,
        logoutInProgress: false,
        signInWithGoogle: noopAsync, 
        signUpWithEmail: noopAsync, 
        signInWithEmail: noopAsync, 
        sendVerificationEmail: noopAsync,
        checkEmailVerification: async () => ({ verified: false }),
        forgotPassword: noopAsync,
        logout: noop
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  const signInWithGoogle = async () => {
    if (!firebase.isConfigured || !firebase.auth) {
      return { success: false, error: 'Authentication is not properly configured.' };
    }
    
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebase.auth, googleProvider);
      
      // Check if user is banned by fetching their profile
      const { getUserProfile } = await import('../lib/firestore');
      const profile = await getUserProfile(result.user.uid);
      
      if (profile?.accountStatus?.includes('banned')) {
        // User is banned - sign them out immediately
        await signOut(firebase.auth);
        
        // Store ban info for the banned page
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('banInfo', JSON.stringify({
            reason: profile.banReason || 'Your account has been suspended.',
            bannedAt: profile.bannedAt || new Date().toISOString()
          }));
        }
        
        return { 
          success: false, 
          error: 'Your account has been suspended. Please contact support for more information.',
          banned: true 
        };
      }
      
      // User state will be automatically updated via onAuthStateChanged
      return { success: true };
    } catch (error) {
      // Use centralized error handling for Google sign-in
      return await handleGoogleSignInError(error);
    }
  };

  const signUpWithEmail = async (email, password, name) => {
    if (!firebase.isConfigured || !firebase.auth) {
      return { success: false, error: 'Authentication is not properly configured.' };
    }
    
    try {
      const result = await createUserWithEmailAndPassword(firebase.auth, email, password);
      
      // Set pending signup flag to prevent race condition in verify-email page
      setPendingSignupUserId(result.user.uid);
      
      // Update user profile with name
      if (name) {
        await updateProfile(result.user, {
          displayName: name
        });
      }
      
      // Send email verification
      await sendEmailVerification(result.user);

      return { success: true, requiresVerification: true };
    } catch (error) {
      // Clear pending signup flag on error
      setPendingSignupUserId(null);
      // Use centralized error handling for sign-up
      return await handleSignUpError(error);
    }
  };

  const signInWithEmail = async (email, password) => {
    if (!firebase.isConfigured || !firebase.auth) {
      return { success: false, error: 'Authentication is not properly configured.' };
    }
    
    try {
      const result = await signInWithEmailAndPassword(firebase.auth, email, password);
      
      // Check if user is banned by fetching their profile
      const { getUserProfile } = await import('../lib/firestore');
      const profile = await getUserProfile(result.user.uid);
      
      if (profile?.accountStatus?.includes('banned')) {
        // User is banned - sign them out immediately
        await signOut(firebase.auth);
        
        // Store ban info for the banned page
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('banInfo', JSON.stringify({
            reason: profile.banReason || 'Your account has been suspended.',
            bannedAt: profile.bannedAt || new Date().toISOString()
          }));
        }
        
        return { 
          success: false, 
          error: 'Your account has been suspended. Please contact support for more information.',
          banned: true 
        };
      }
      
      return { success: true };
    } catch (error) {
      // Use centralized error handling for sign-in
      return await handleSignInError(error);
    }
  };

  const logout = async () => {
    try {
      // Set logout in progress flag to prevent redirects
      setLogoutInProgress(true);
      // Clear any pending signup state before signing out
      setPendingSignupUserId(null);
      await signOut(firebase.auth);
      // Use replace instead of push to prevent back button issues
      router.replace('/');
    } catch (error) {
      console.error('Sign-out error:', error);
      // Clear logout flag on error
      setLogoutInProgress(false);
    }
  };

  // Send email verification
  const sendVerificationEmail = async () => {
    try {
      if (firebase.auth?.currentUser) {
        await sendEmailVerification(firebase.auth.currentUser);
        return { success: true };
      }
      return { success: false, error: 'No user signed in' };
    } catch (error) {
      console.error('Error sending verification email:', error);
      
      // Use centralized error handling for email verification
      return await handleEmailVerificationError(error);
    }
  };

  // Check email verification status (reload user)
  const checkEmailVerification = async () => {
    try {
      if (firebase.auth?.currentUser) {
        await reload(firebase.auth.currentUser);
        // Update the user state so components re-render with new verification status
        setUser(firebase.auth.currentUser);
        return { verified: firebase.auth.currentUser.emailVerified };
      }
      return { verified: false };
    } catch (error) {
      console.error('Error checking verification status:', error);
      return { verified: false };
    }
  };

  const forgotPassword = async (email) => {
    if (!firebase.isConfigured || !firebase.auth) {
      return { success: false, error: 'Authentication is not properly configured.' };
    }
    
    try {
      await sendPasswordResetEmail(firebase.auth, email);
      
      // Return success with appropriate message
      return { 
        success: true, 
        type: 'success',
        message: getPasswordResetSuccessMessage()
      };
      
    } catch (error) {
      // Use centralized error handling for password reset
      const result = await handlePasswordResetError(error);
      
      // If centralized handler treats this as success (security mode), return it
      if (result.success) {
        return result;
      }
      
      // Otherwise return the error
      return result;
    }
  };

  // Note: Using centralized Firebase error handling from utils/firebaseErrorHandler.js

  const value = {
    user,
    loading,
    pendingSignupUserId,
    logoutInProgress,
    mounted: true,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendVerificationEmail,
    checkEmailVerification,
    forgotPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Optional auth hook that doesn't crash if no provider
export const useOptionalAuth = () => {
  const context = useContext(AuthContext);
  return context;
};