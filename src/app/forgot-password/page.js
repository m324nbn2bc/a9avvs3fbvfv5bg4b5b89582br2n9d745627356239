"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateEmail, validateForm } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { Caveat } from "next/font/google";
import Link from "next/link";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { user, loading: authLoading, forgotPassword } = useAuth();
  
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldValidation, setFieldValidation] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Refs for form validation scrolling
  const emailRef = useRef();

  // Redirect if already signed in
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const scrollToField = (fieldName) => {
    const fieldRefs = {
      email: emailRef
    };
    
    const fieldRef = fieldRefs[fieldName];
    if (fieldRef?.current) {
      fieldRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      // Focus the field after scrolling
      setTimeout(() => {
        fieldRef.current.focus();
      }, 300);
    }
  };

  const validateFormFields = (formData) => {
    const validation = validateForm(formData, 'forgot-password');
    
    setValidationErrors(validation.errors);
    
    // If there are errors, scroll to the first error field
    if (validation.firstErrorField) {
      setTimeout(() => scrollToField(validation.firstErrorField), 100);
    }
    
    return validation.isValid;
  };

  const handleInputChange = (field, value) => {
    // Clear form validation errors when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Perform real-time validation
    let validationError = null;
    let isValid = false;
    
    if (field === 'email' && value.trim()) {
      validationError = validateEmail(value);
      isValid = !validationError;
    }
    
    // Update field validation status
    setFieldValidation(prev => ({
      ...prev,
      [field]: {
        isValid,
        error: validationError,
        hasValue: value.trim().length > 0
      }
    }));
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (!validateFormFields(formData)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await forgotPassword(formData.get('email'));
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // Don't show loading overlay during auth actions - keep form visible

  // Show success message
  if (success) {
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
          {/* Left Side - Success Message */}
          <div className="flex-1 w-full flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-16 xl:px-20 pt-20">
            <div className="mx-auto w-full max-w-sm lg:max-w-md">
              {/* Header with Yellow Background */}
              <div className="text-center mb-6 bg-yellow-400 px-4 py-3 rounded-t-lg">
                <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-emerald-700">Check Your Email</h2>
                <p className="mt-1 text-black text-sm">Reset link sent successfully</p>
              </div>
              
              {/* Content Card */}
              <div className="bg-white rounded-b-lg border border-t-0 border-gray-200 px-6 py-6 shadow-sm">
                <p className="text-gray-600 text-sm mb-4 text-center">
                  We've sent a password reset link to your email address. Click the link to reset your password.
                </p>
                
                <div className="text-xs text-gray-500 space-y-1 mb-6 bg-gray-50 p-3 rounded-lg">
                  <p>• Check your spam/promotions folder if you don't see it</p>
                  <p>• The reset link will expire in 1 hour</p>
                  <p>• If you don't receive an email, you may not have an account yet</p>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => router.push('/signin')}
                    className="btn-base btn-primary w-full py-3 px-4 font-medium text-sm"
                  >
                    Back to Sign In
                  </button>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Didn't receive the email? 
                      <button 
                        onClick={() => setSuccess(false)}
                        className="btn-base btn-link font-medium ml-1"
                      >
                        Send another reset link
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Frame Logo - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <Link 
          href="/" 
          className={`${caveat.className} text-2xl md:text-3xl font-bold text-emerald-700 hover:text-emerald-800 transition-all duration-300 hover:scale-110`}
        >
          Frame
        </Link>
      </div>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-sm w-full space-y-6">
          {/* Header */}
          <div className="text-center bg-yellow-400 px-4 py-3 rounded-t-lg">
            <h2 className="text-2xl font-bold text-emerald-700">Reset Password</h2>
            <p className="mt-1 text-black text-sm">We'll send you a reset link</p>
          </div>

          {/* Content Card with Shadow Border */}
          <div className="bg-white rounded-b-lg border border-t-0 border-gray-200 px-6 py-6 shadow-sm">
            {/* Forgot Password Form */}
            <form className="space-y-4 mb-4" onSubmit={handleForgotPassword} noValidate>
              {error && (
                <div 
                  className="text-sm p-3 rounded-lg border text-red-800 bg-red-50 border-red-200"
                  role="alert"
                >
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="forgot-password-email" className="block text-sm font-medium text-gray-800 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    ref={emailRef}
                    id="forgot-password-email"
                    type="email"
                    name="email"
                    required
                    placeholder="Enter your email address"
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 text-gray-900 placeholder-gray-500 text-sm ${
                      validationErrors.email ? 'border-red-300 bg-red-50' : 
                      fieldValidation.email?.isValid ? 'border-emerald-300 bg-emerald-50' :
                      fieldValidation.email?.hasValue ? 'border-red-300 bg-red-50' :
                      'border-gray-300'
                    }`}
                  />
                  {/* Validation Icon */}
                  {(validationErrors.email || (fieldValidation.email?.hasValue && !fieldValidation.email?.isValid)) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {fieldValidation.email?.isValid && !validationErrors.email ? (
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg 
                          className="w-5 h-5 text-red-500" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                {validationErrors.email && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  <p>We'll send a secure password reset link to this email address.</p>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-base btn-primary py-2 px-4 text-sm"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Remember your password? 
                <button 
                  onClick={() => router.push('/signin')}
                  className="btn-base btn-link font-medium ml-1"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}