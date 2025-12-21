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
  const { user, loading, sendVerificationEmail } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(true);
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
      const result = await sendVerificationEmail();
      if (result.success) {
        setResendMessage('Verification email sent!');
        setResendCooldown(60);
      } else {
        setResendMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setResendMessage('Error: Failed to resend verification email');
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
            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Verification email sent!</p>
                    <p className="text-xs text-emerald-700 mt-1">
                      If this email is available, we've sent a verification link to <span className="font-medium">{newEmail}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSuccessMessage(false)}
                    className="text-emerald-600 hover:text-emerald-700 ml-auto flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

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
              {/* Main Instructions */}
              <p className="text-gray-600 text-sm mb-6 text-center">
                We've sent a verification link to <span className="font-medium text-emerald-700">{newEmail}</span>. 
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

              {/* Action Buttons */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  Didn't receive the email?
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={isResending || resendCooldown > 0}
                  className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                    resendCooldown > 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'btn-base btn-primary'
                  }`}
                >
                  {isResending
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Verification Email'}
                </button>

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
    </div>
  );
}
