// Network connectivity and error detection utilities

/**
 * Check if the current error is likely due to network connectivity issues
 * @param {Error|Object} error - The error object from Firebase or other sources
 * @returns {boolean} - True if error appears to be network-related
 */
export const isNetworkError = (error) => {
  if (!error) return false;
  
  // Check Firebase specific network error codes
  const networkErrorCodes = [
    'auth/network-request-failed',
    'auth/timeout',
    'auth/internal-error',
    'auth/cors-unsupported'
  ];
  
  if (error.code && networkErrorCodes.includes(error.code)) {
    return true;
  }
  
  // Check error message patterns that indicate network issues
  const networkErrorPatterns = [
    /network/i,
    /connection/i,
    /timeout/i,
    /fetch/i,
    /cors/i,
    /offline/i,
    /no internet/i,
    /failed to fetch/i
  ];
  
  const errorMessage = error.message || error.toString() || '';
  return networkErrorPatterns.some(pattern => pattern.test(errorMessage));
};

/**
 * Check if the browser is currently online
 * @returns {boolean} - True if browser reports being online
 */
export const isOnline = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

/**
 * Test actual network connectivity by making a lightweight request
 * @returns {Promise<boolean>} - True if network is accessible
 */
export const testNetworkConnectivity = async () => {
  if (!isOnline()) {
    return false;
  }
  
  try {
    // Use a lightweight request to test connectivity
    // We'll try to fetch a tiny resource from a reliable CDN
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return true;
  } catch (error) {
    // If the fetch fails, we're likely offline or have connectivity issues
    return false;
  }
};

/**
 * Get appropriate error message based on network connectivity and error type
 * @param {Error|Object} error - The original error
 * @param {string} fallbackMessage - Message to show if not a network error
 * @returns {Promise<string>} - Appropriate error message for the user
 */
export const getContextualErrorMessage = async (error, fallbackMessage) => {
  // First check if it's obviously a network error
  if (isNetworkError(error)) {
    return 'Unable to connect to our services. Please check your internet connection and try again.';
  }
  
  // Check if browser reports being offline
  if (!isOnline()) {
    return 'You appear to be offline. Please check your internet connection and try again.';
  }
  
  // Test actual connectivity for ambiguous errors
  try {
    const hasConnectivity = await testNetworkConnectivity();
    if (!hasConnectivity) {
      return 'Unable to connect to our services. Please check your internet connection and try again.';
    }
  } catch (connectivityError) {
    // If we can't test connectivity, assume it's a network issue
    return 'Unable to connect to our services. Please check your internet connection and try again.';
  }
  
  // If we reach here, it's likely not a network error
  return fallbackMessage;
};

/**
 * Check if an authentication error should be treated as a network error
 * This is more conservative and used for authentication flows where security matters
 * @param {Error|Object} error - The error object
 * @returns {Promise<boolean>} - True if this should be treated as a network error
 */
export const isLikelyNetworkError = async (error) => {
  // More strict checking for auth errors
  if (isNetworkError(error) || !isOnline()) {
    return true;
  }
  
  // For authentication, only check connectivity for certain ambiguous error types
  const ambiguousErrors = [
    'auth/internal-error',
    'auth/timeout',
    'auth/invalid-credential' // This can sometimes be network-related
  ];
  
  if (error.code && ambiguousErrors.includes(error.code)) {
    try {
      const hasConnectivity = await testNetworkConnectivity();
      return !hasConnectivity;
    } catch {
      return true; // Assume network error if we can't test
    }
  }
  
  return false;
};

/**
 * Setup network status monitoring
 * @param {Function} onOnline - Callback when network comes online
 * @param {Function} onOffline - Callback when network goes offline
 * @returns {Function} - Cleanup function to remove listeners
 */
export const setupNetworkMonitoring = (onOnline, onOffline) => {
  if (typeof window === 'undefined') {
    // Return no-op cleanup function for server-side
    return () => {};
  }
  
  const handleOnline = () => onOnline && onOnline();
  const handleOffline = () => onOffline && onOffline();
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};