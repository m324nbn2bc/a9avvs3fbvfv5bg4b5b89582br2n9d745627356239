'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import PageLoader from '../../components/PageLoader';
import { Caveat } from 'next/font/google';
import Link from 'next/link';

const caveat = Caveat({ subsets: ['latin'], weight: ['700'] });

export default function VerifyEmailChangePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const pollIntervalRef = useRef(null);
  const safetyTimeoutRef = useRef(null);

  // Get new email from sessionStorage on mount
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('pendingEmailChange');
    if (storedEmail) {
      setNewEmail(storedEmail);
    } else if (!loading && user) {
      // If no pending email, redirect back to settings
      router.replace('/settings/account');
    }
  }, [loading, user, router]);

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Poll for email verification (Firebase doesn't push updates)
  useEffect(() => {
    if (!user || loading) return;

    const checkEmailVerification = async () => {
      try {
        // Reload user to get latest email verification status
        await user.reload();
        
        // If email was verified, Firebase will auto-logout the user
        // We detect this by checking onAuthStateChanged in useAuth hook
        // The user will be null when logged out
      } catch (error) {
        console.error('Error checking email verification:', error);
      }
    };

    // Check every 3 seconds
    pollIntervalRef.current = setInterval(checkEmailVerification, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [user, loading]);

  // Redirect to signin if user logs out (after email verification)
  useEffect(() => {
    if (!loading && !user) {
      // User has logged out (after email verification), redirect to signin
      sessionStorage.removeItem('pendingEmailChange');
      
      // Clear polling interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      
      router.replace('/signin');
    }
  }, [user, loading, router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage('');

    try {
      const { getAuth, verifyBeforeUpdateEmail } = await import("firebase/auth");
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setResendMessage('Error: No user signed in');
        setIsResending(false);
        return;
      }

      // Resend verification for the pending email change
      await verifyBeforeUpdateEmail(currentUser, newEmail);
      setResendMessage('Verification email sent!');
      setResendCooldown(60);
    } catch (error) {
      // Handle Firebase errors
      if (error.code === 'auth/too-many-requests') {
        setResendMessage('Too many requests. Please wait before trying again.');
      } else {
        setResendMessage(`Error: ${error.message || 'Failed to resend verification email'}`);
      }
      console.error('Error resending verification email:', error);
    }

    setIsResending(false);

    // Clear message after 3 seconds
    setTimeout(() => setResendMessage(''), 3000);
  };

  const handleBackToSettings = () => {
    sessionStorage.removeItem('pendingEmailChange');
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    router.push('/settings/account');
  };

  // Show loader while auth is loading
  if (loading) {
    return <PageLoader message="Loading..." />;
  }

  // Show loader while redirecting if no user
  if (!user) {
    return <PageLoader message="Redirecting..." />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Frame Logo */}
      <div className="absolute top-6 left-6 z-50 mb-8">
        <Link
          href="/"
          className={`${caveat.className} text-2xl md:text-3xl font-bold text-emerald-700 hover:text-emerald-800 transition-all duration-300 hover:scale-110`}
        >
          Frame
        </Link>
      </div>

      <div className="min-h-screen flex">
        {/* Left Side - Verification Instructions */}
        <div className="flex-1 w-full flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-16 xl:px-20 pt-20">
          <div className="mx-auto w-full max-w-sm lg:max-w-md">
            {/* Header with Yellow Background */}
            <div className="text-center mb-6 bg-yellow-400 px-4 py-3 rounded-t-lg">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-emerald-700">Verify Your New Email</h2>
              <p className="mt-1 text-black text-sm">Confirm your email address change</p>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-b-lg border border-t-0 border-gray-200 px-6 py-6 shadow-sm">
              {/* Main Instructions - Integrated with "if email is available..." message */}
              <p className="text-gray-600 text-sm mb-6 text-center">
                If this email is available, we've sent a verification link to <span className="font-medium text-emerald-700">{newEmail}</span>. 
                Click the link to complete your email change.
              </p>

              {/* CRITICAL WARNING BOX */}
              <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-yellow-800 mb-1">Important</h3>
                    <p className="text-xs text-yellow-700">
                      You will be automatically logged out once you verify your new email address. You'll need to sign in again using your new email.
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Instructions */}
              <div className="text-xs text-gray-500 space-y-1 mb-6 bg-gray-50 p-3 rounded-lg">
                <p>• Check your spam/promotions folder if you don't see it</p>
                <p>• The verification link will expire in 3 days</p>
                <p>• Verification emails may take up to 60 minutes to arrive</p>
              </div>

              {/* Resend Message */}
              {resendMessage && (
                <div
                  className={`text-sm text-center p-3 rounded-lg mb-4 ${
                    resendMessage.includes('Error')
                      ? 'bg-red-50 text-red-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {resendMessage}
                </div>
              )}

              {/* Resend Link - Text Pattern like signin page */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500">
                  Didn't receive the email?
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || resendCooldown > 0}
                    className={`btn-link font-medium ml-1 ${
                      resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {isResending
                      ? 'Sending...'
                      : resendCooldown > 0
                      ? `Resend (${resendCooldown}s)`
                      : 'Resend'}
                  </button>
                </p>
              </div>

              {/* Back to Settings Button */}
              <button
                onClick={handleBackToSettings}
                className="w-full btn-base btn-secondary py-2 px-4 text-sm"
              >
                Back to Account Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
