import { isLikelyNetworkError, getContextualErrorMessage } from './networkUtils';

/**
 * Centralized Firebase Authentication Error Handler
 * Based on latest Firebase v9+ documentation and modern security practices
 */

/**
 * Modern Firebase error codes mapping to simple, user-friendly messages
 * Updated for Firebase v9+ behavior where specific error codes are replaced with generic ones for security
 */
const ERROR_MESSAGES = {
  // Authentication Errors (Core)
  'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
  'auth/user-disabled': 'Your account has been disabled. Please contact support for assistance.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'This sign-in method is not available. Please contact support.',
  'auth/too-many-requests': 'Too many failed attempts. Please wait a few minutes before trying again.',
  
  // Legacy errors (may still occur in some Firebase configurations)
  'auth/user-not-found': 'Invalid email or password. Please check your credentials and try again.',
  'auth/wrong-password': 'Invalid email or password. Please check your credentials and try again.',
  
  // Account Creation Errors
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Please choose a stronger password (at least 6 characters).',
  
  // Session & Token Errors
  'auth/invalid-user-token': 'Your session has expired. Please sign in again.',
  'auth/user-token-expired': 'Your session has expired. Please sign in again.',
  'auth/requires-recent-login': 'For security, please sign in again to continue.',
  
  // Network & Connection Errors
  'auth/network-request-failed': 'Connection failed. Please check your internet and try again.',
  'auth/timeout': 'Request timed out. Please check your connection and try again.',
  
  // Email Verification Errors
  'auth/invalid-verification-code': 'Invalid verification code. Please check and try again.',
  'auth/invalid-verification-id': 'Verification failed. Please try again.',
  'auth/code-expired': 'Verification code has expired. Please request a new one.',
  'auth/missing-verification-code': 'Please enter the verification code.',
  
  // Password Reset Errors
  'auth/invalid-action-code': 'This reset link is invalid or has expired. Please request a new one.',
  'auth/expired-action-code': 'This reset link has expired. Please request a new one.',
  
  // Google Sign-in Errors
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups and try again.',
  'auth/account-exists-with-different-credential': 'An account with this email exists. Try signing in with a different method.',
  
  // Configuration & API Errors
  'auth/invalid-api-key': 'Configuration error. Please contact support.',
  'auth/app-not-authorized': 'App configuration error. Please contact support.',
  'auth/invalid-continue-uri': 'Invalid redirect URL. Please contact support.',
  'auth/unauthorized-continue-uri': 'Unauthorized redirect URL. Please contact support.',
  
  // Rate Limiting
  'auth/quota-exceeded': 'Service temporarily unavailable. Please try again later.',
  
  // Multi-factor Authentication
  'auth/multi-factor-auth-required': 'Additional verification required. Please follow the prompts.',
  'auth/maximum-second-factor-count-exceeded': 'Too many verification methods. Please contact support.',
  
  // Generic fallback
  'default': 'Something went wrong. Please try again.'
};

/**
 * Security vs Verbose mode messages
 * In security mode, we provide generic messages to prevent user enumeration attacks
 */
const SECURITY_MODE_MESSAGES = {
  // Generic authentication failure (prevents user enumeration)
  'auth-failure': 'Invalid email or password. Please check your credentials and try again.',
  'password-reset-sent': 'If this email is associated with an account, we\'ve sent a password reset link.',
  'verification-sent': 'If this email is associated with an account, we\'ve sent a verification email.',
};

/**
 * Check if verbose error messages are enabled
 * Always returns false to use security mode for better maintainability
 */
const isVerboseModeEnabled = () => {
  // Always use security mode for better maintainability and consistent behavior
  return false;
};

/**
 * Get appropriate error message based on error code and context
 * @param {string} errorCode - Firebase error code
 * @param {string} context - Context of the error (signin, signup, password-reset, etc.)
 * @param {boolean} useVerboseMode - Whether to use verbose or security mode
 * @returns {string} User-friendly error message
 */
const getErrorMessage = (errorCode, context = 'default', useVerboseMode = null) => {
  const verboseMode = useVerboseMode !== null ? useVerboseMode : isVerboseModeEnabled();
  
  // Handle security mode for sensitive operations
  if (!verboseMode) {
    switch (context) {
      case 'signin':
        // In security mode, always return generic message for auth failures
        if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(errorCode)) {
          return SECURITY_MODE_MESSAGES['auth-failure'];
        }
        break;
      case 'password-reset':
        // In security mode, always return success message for password reset
        if (['auth/user-not-found'].includes(errorCode)) {
          return SECURITY_MODE_MESSAGES['password-reset-sent'];
        }
        break;
    }
  }
  
  // Return specific error message or default
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['default'];
};

/**
 * Main Firebase error handler
 * @param {Error|Object} error - Firebase error object
 * @param {string} context - Context of the operation (signin, signup, password-reset, etc.)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Standardized error response
 */
export const handleFirebaseError = async (error, context = 'default', options = {}) => {
  const { 
    useVerboseMode = null,
    returnType = 'object', // 'object' or 'string'
    includeType = false // Include type field for certain contexts
  } = options;
  
  // Log error in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`Firebase ${context} error:`, error.code || error.message);
  }
  
  // Check for network connectivity issues first
  if (await isLikelyNetworkError(error)) {
    const networkMessage = await getContextualErrorMessage(
      error, 
      'Connection failed. Please check your internet and try again.'
    );
    
    return returnType === 'string' ? networkMessage : {
      success: false,
      error: networkMessage,
      ...(includeType && { type: 'error' })
    };
  }
  
  // Get appropriate error message
  const errorMessage = getErrorMessage(error.code, context, useVerboseMode);
  
  // Return formatted response
  if (returnType === 'string') {
    return errorMessage;
  }
  
  return {
    success: false,
    error: errorMessage,
    ...(includeType && { type: 'error' })
  };
};

/**
 * Specialized handlers for different Firebase operations
 */

/**
 * Handle sign-in errors with context-specific logic
 */
export const handleSignInError = async (error, options = {}) => {
  return handleFirebaseError(error, 'signin', options);
};

/**
 * Handle sign-up errors with context-specific logic
 */
export const handleSignUpError = async (error, options = {}) => {
  return handleFirebaseError(error, 'signup', options);
};

/**
 * Handle password reset errors with context-specific logic
 * In security mode, this may return success even for non-existent users
 */
export const handlePasswordResetError = async (error, options = {}) => {
  const verboseMode = options.useVerboseMode !== null ? options.useVerboseMode : isVerboseModeEnabled();
  
  // In security mode, treat user-not-found as success to prevent enumeration
  if (!verboseMode && error.code === 'auth/user-not-found') {
    return {
      success: true,
      type: 'success',
      message: SECURITY_MODE_MESSAGES['password-reset-sent']
    };
  }
  
  return handleFirebaseError(error, 'password-reset', { 
    ...options, 
    includeType: true 
  });
};

/**
 * Handle email verification errors
 */
export const handleEmailVerificationError = async (error, options = {}) => {
  return handleFirebaseError(error, 'email-verification', options);
};

/**
 * Handle Google sign-in specific errors
 */
export const handleGoogleSignInError = async (error, options = {}) => {
  return handleFirebaseError(error, 'google-signin', options);
};

/**
 * Handle password reset success (for consistency)
 */
export const getPasswordResetSuccessMessage = (verboseMode = null) => {
  const verbose = verboseMode !== null ? verboseMode : isVerboseModeEnabled();
  
  if (verbose) {
    return 'Password reset link sent! Check your email and spam folder.';
  } else {
    return SECURITY_MODE_MESSAGES['password-reset-sent'];
  }
};

/**
 * Utility function to check if an error should be treated as success in security mode
 */
export const shouldTreatAsSuccessInSecurityMode = (error, context) => {
  const verboseMode = isVerboseModeEnabled();
  if (verboseMode) return false;
  
  // In security mode, treat certain errors as success to prevent enumeration
  if (context === 'password-reset' && error.code === 'auth/user-not-found') {
    return true;
  }
  
  return false;
};

// Export constants for testing and consistency
export { ERROR_MESSAGES, SECURITY_MODE_MESSAGES, isVerboseModeEnabled };