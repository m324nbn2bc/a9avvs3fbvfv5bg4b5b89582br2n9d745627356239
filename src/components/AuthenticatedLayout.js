'use client';

import { useFirebaseOptimized as useFirebase } from '../lib/firebase-optimized';
import { AuthProvider } from '../hooks/useAuth';
import UserOnboardingWrapper from './UserOnboardingWrapper';
import { UserProfileProvider } from './UserProfileProvider';

export default function AuthenticatedLayout({ children }) {
  const mountTime = typeof window !== 'undefined' ? performance.now() : 0;
  
  
  const { isLoading, isConfigured } = useFirebase();
  

  // Only show loading state when Firebase is configured and initializing
  // If Firebase is not configured, still provide UserProfileProvider wrapper
  // to avoid breaking components that use useOptionalUserProfile
  if (!isConfigured || isLoading) {
    return (
      <UserProfileProvider>
        {children}
      </UserProfileProvider>
    );
  }

  // Firebase is configured - provide user profile context and onboarding wrapper
  return (
    <UserProfileProvider>
      <UserOnboardingWrapper>
        {children}
      </UserOnboardingWrapper>
    </UserProfileProvider>
  );
}