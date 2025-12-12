'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import EmailVerification from '../../components/EmailVerification';
import PageLoader from '../../components/PageLoader';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading, pendingSignupUserId, logoutInProgress } = useAuth();
  const safetyTimeoutRef = useRef(null);

  useEffect(() => {
    // Redirect to homepage if user is verified
    if (user && !loading && user.emailVerified) {
      router.replace('/');
      return;
    }
    
    // Clear any existing safety timeout
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    
    // Only redirect to signin if auth is done loading, there's no user, no pending signup,
    // AND logout is not in progress (prevents redirect override on intentional logout)
    if (!loading && !user && !pendingSignupUserId && !logoutInProgress) {
      // Add safety fallback with debounce to avoid stuck loader state
      safetyTimeoutRef.current = setTimeout(() => {
        router.replace('/signin');
      }, 500);
    }
  }, [user, loading, pendingSignupUserId, logoutInProgress, router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
    };
  }, []);

  // Show loader while auth is loading
  if (loading) {
    return <PageLoader message="Loading..." />;
  }

  // Show loader while pending signup (waiting for auth state to update)
  if (pendingSignupUserId) {
    return <PageLoader message="Setting up your account..." />;
  }

  // Show loader while redirecting if no user
  if (!user) {
    return <PageLoader message="Redirecting..." />;
  }

  // Show email verification if user exists but is not verified
  if (user && !user.emailVerified) {
    return <EmailVerification />;
  }

  // Fallback - shouldn't reach here but just in case
  return <PageLoader message="Redirecting..." />;
}