"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOptionalAuth } from '../hooks/useAuth';
import { getUserProfile } from '../lib/firestore';

// Create User Profile Context
const UserProfileContext = createContext(null);

export function UserProfileProvider({ children }) {
  const { user, loading: authLoading, logout } = useOptionalAuth() || { user: null, loading: false, logout: async () => {} };
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user profile data from Firestore when user changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const profile = await getUserProfile(user.uid);
        
        // CHECK FOR BAN STATUS - Enforce ban immediately
        if (profile?.accountStatus?.includes('banned')) {
          if (process.env.NODE_ENV === 'development') {
            console.log('User is banned, logging out...');
          }
          
          // Store ban info in sessionStorage for ban page to display
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('banInfo', JSON.stringify({
              reason: profile.banReason || 'Your account has been suspended.',
              bannedAt: profile.bannedAt || new Date().toISOString()
            }));
          }
          
          // Logout and redirect to banned page
          await logout();
          router.replace('/banned');
          return;
        }
        
        setUserProfile(profile);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching user profile:', error);
        }
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserProfile();
    }
  }, [user, authLoading, logout, router]);

  // Function to update the user profile in context (called after profile updates)
  const updateUserProfile = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };

  // Function to refresh user profile from Firestore
  const refreshUserProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  const value = {
    userProfile,
    loading: authLoading || loading,
    updateUserProfile,
    refreshUserProfile
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

// Optional hook that doesn't crash if no provider
export const useOptionalUserProfile = () => {
  const context = useContext(UserProfileContext);
  return context;
};