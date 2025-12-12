"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function EmailVerification() {
  const { user, sendVerificationEmail, checkEmailVerification, logout } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');

  // Auto-check email verification status every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user && !user.emailVerified) {
        const result = await checkEmailVerification();
        if (result.verified) {
          // Page will refresh automatically when user is verified
          window.location.reload();
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, checkEmailVerification]);

  const handleResendVerification = async () => {
    setIsResending(true);
    setMessage('');
    
    const result = await sendVerificationEmail();
    if (result.success) {
      setMessage('Verification email sent!');
    } else {
      setMessage(`Error: ${result.error}`);
    }
    
    setIsResending(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-emerald-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto border-2 border-emerald-600">
        {/* Header */}
        <div className="bg-yellow-400 rounded-t-xl p-6 text-center">
          <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-700">Verify Your Email</h2>
          <p className="text-sm sm:text-base text-gray-700 mt-2">
            Almost there! Check your email to complete registration.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Main Text */}
          <p className="text-lg text-gray-800 mb-4 text-center">
            We sent a verification email to <span className="font-medium text-emerald-700">{user?.email}</span>, please verify yourself from there.
          </p>

          {/* Sub Text */}
          <p className="text-sm text-gray-600 mb-6 text-center">
            If you don't receive it, check your spam folder or 
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="btn-base btn-link ml-1"
            >
              {isResending ? 'sending...' : 'click to resend'}
            </button>
          </p>

          {/* Message Display */}
          {message && (
            <div className={`text-sm text-center p-3 rounded-lg mb-4 ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700' 
                : 'bg-emerald-50 text-emerald-700'
            }`}>
              {message}
            </div>
          )}

          {/* Logout Option */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">
              Don't want to verify right now?
            </p>
            <p className="text-sm text-gray-600 text-center">
              <button
                onClick={logout}
                className="btn-base btn-link"
              >
                Sign out
              </button>
              {" "}and continue without account
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}