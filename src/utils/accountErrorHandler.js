/**
 * Account Settings Firebase Error Handler
 * Handles password and email change error messages
 */
import { ERROR_MESSAGES } from './firebaseErrorHandler';

export function getAccountErrorMessage(errorCode, context) {
  // Specific mappings for password context
  if (context === 'password') {
    if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
      return 'Current password is incorrect';
    } else if (errorCode === 'auth/weak-password') {
      return 'New password is too weak. Please use a stronger password.';
    } else if (errorCode === 'auth/requires-recent-login') {
      return 'Please sign out and sign back in before changing your password';
    }
  }

  // Specific mappings for email context
  if (context === 'email') {
    if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
      return 'Current password is incorrect';
    } else if (errorCode === 'auth/email-already-in-use') {
      return 'This email is already registered to another account';
    } else if (errorCode === 'auth/invalid-email') {
      return 'Please enter a valid email address';
    } else if (errorCode === 'auth/requires-recent-login') {
      return 'Please sign out and sign back in before changing your email';
    } else if (errorCode === 'auth/operation-not-allowed') {
      return 'Email change is not allowed. Please contact support.';
    }
  }

  // Fallback to general messages
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['default'];
}

export function handleAccountError(error, context, setErrorFn) {
  const message = getAccountErrorMessage(error.code, context);
  setErrorFn(message);
}
