"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateEmail, validatePassword, validateForm } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { Caveat } from "next/font/google";
import Link from "next/link";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

export default function SignInPage() {
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle, signInWithEmail } = useAuth();
  
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldValidation, setFieldValidation] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Refs for form validation scrolling
  const emailRef = useRef();
  const passwordRef = useRef();

  // Redirect if already signed in
  useEffect(() => {
    if (user && !authLoading) {
      router.replace(user.emailVerified ? '/' : '/verify-email');
    }
  }, [user, authLoading, router]);

  const scrollToField = (fieldName) => {
    const fieldRefs = {
      email: emailRef,
      password: passwordRef
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
    const validation = validateForm(formData, 'signin');
    
    setValidationErrors(validation.errors);
    
    // If there are errors, scroll to the first error field
    if (validation.firstErrorField) {
      setTimeout(() => scrollToField(validation.firstErrorField), 100);
    }
    
    return validation.isValid;
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (!validateFormFields(formData)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signInWithEmail(formData.get('email'), formData.get('password'));
      if (result.success) {
        // Will be handled by useEffect redirect based on email verification status
      } else if (result.banned) {
        // User is banned - redirect to banned page
        router.push('/banned');
      } else {
        setError(result.error || 'Failed to sign in');
      }
    } catch (err) {
      setError('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInWithGoogle();
      if (result.success) {
        // Will be handled by useEffect redirect based on email verification status
      } else if (result.banned) {
        // User is banned - redirect to banned page
        router.push('/banned');
      } else {
        setError(result.error || 'Failed to sign in with Google');
      }
    } catch (err) {
      setError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
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
    } else if (field === 'password' && value.trim()) {
      validationError = validatePassword(value, true);
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

  // Don't show loading overlay during auth actions - keep form visible

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
        {/* Left Side - Form */}
        <div className="flex-1 w-full flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-16 xl:px-20 pt-20">
          <div className="mx-auto w-full max-w-sm lg:max-w-md">
            <div className="text-center mb-6 bg-yellow-400 px-4 py-3 rounded-t-lg">
              <h2 className="text-2xl font-bold text-emerald-700">Sign in to your account</h2>
              <p className="mt-1 text-black text-sm">Welcome back! Please enter your details.</p>
            </div>
            
            {/* Content Card with Shadow Border */}
            <div className="bg-white rounded-b-lg border border-t-0 border-gray-200 px-6 py-6 shadow-sm">
            {/* Email Sign In Form */}
            <form className="space-y-3 mb-4" onSubmit={handleEmailSignIn} noValidate>
              {error && (
                <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-lg" role="alert">
                  <div>{error}</div>
                  {error.toLowerCase().includes('invalid') && (error.toLowerCase().includes('email') || error.toLowerCase().includes('password')) && (
                    <div className="mt-2 text-gray-600">
                      <span className="text-xs">
                        Forgot your password? Click on "
                        <button
                          type="button"
                          onClick={() => router.push('/forgot-password')}
                          className="btn-link font-medium"
                        >
                          Forgot Password?
                        </button>
                        " to reset it.
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div>
                <label htmlFor="signin-email" className="block text-sm font-medium text-gray-800 mb-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    ref={emailRef}
                    id="signin-email"
                    type="email"
                    name="email"
                    required
                    placeholder="Enter your email"
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
              </div>
              <div>
                <label htmlFor="signin-password" className="block text-sm font-medium text-gray-800 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="Enter your password"
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all duration-300 text-gray-900 placeholder-gray-500 text-sm ${
                      validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {/* Password visibility toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 rounded"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.password}</p>
                )}
                <div className="text-right mt-2">
                  <a
                    href="/forgot-password"
                    className="btn-link text-sm font-medium"
                  >
                    Forgot Password?
                  </a>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-base btn-primary py-2 px-4 text-sm"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">or</span>
              </div>
            </div>

            {/* Google Sign In */}
            <div className="text-center mb-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full btn-base btn-google py-2 px-4 gap-3 text-sm"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Signing In...' : 'Continue with Google'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Don't have an account? 
                <a 
                  href="/signup"
                  className="btn-link font-medium ml-1"
                >
                  Sign Up
                </a>
              </p>
            </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}