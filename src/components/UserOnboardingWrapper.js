'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile } from '../lib/firestore';

export default function UserOnboardingWrapper({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user || loading) return;

      // For email/password users, check if email is verified first
      if (user.providerData[0]?.providerId === 'password' && !user.emailVerified) {
        return;
      }

      setCheckingProfile(true);
      
      // Add a small delay to ensure Firebase auth state has stabilized after verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        let userProfile = await getUserProfile(user.uid);
        
        // If profile doesn't exist, wait a bit and try again (profile creation might be in progress)
        if (!userProfile) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          userProfile = await getUserProfile(user.uid);
        }
        
        // If still no profile, this is unexpected
        if (!userProfile) {
          return;
        }
        
        
        // Navigate to onboarding page if user exists but hasn't completed profile setup
        if (userProfile && !userProfile.profileCompleted) {
          router.push('/onboarding');
        }
      } catch (error) {
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfileStatus();
  }, [user, loading, router]);


  // Don't render welcome popup if still loading or checking
  if (loading || checkingProfile) {
    return children;
  }

  return children;
}