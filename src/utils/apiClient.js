/**
 * Authenticated API Client Utility
 * Centralizes Firebase token-based API requests with consistent error handling
 */

/**
 * Make authenticated API calls with Firebase token
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options (method, body, etc.)
 * @param {Object} user - Firebase user object with getIdToken method
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} If user not authenticated or request fails
 */
export async function authenticatedFetch(url, options = {}, user) {
  if (!user) {
    throw new Error('User must be authenticated to make API requests');
  }

  try {
    const token = await user.getIdToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed to ${url}:`, error);
    throw error;
  }
}

/**
 * Make authenticated API calls and handle Firebase auth-specific errors
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {Object} user - Firebase user object
 * @param {Function} setErrorFn - State setter for error messages
 * @returns {Promise<any>} Parsed JSON response or null on error
 */
export async function authenticatedFetchWithErrorHandler(url, options = {}, user, setErrorFn) {
  try {
    return await authenticatedFetch(url, options, user);
  } catch (error) {
    const message = error.code === 'auth/requires-recent-login'
      ? 'Please sign out and sign back in before performing this action'
      : error.message || 'Request failed. Please try again.';
    
    if (setErrorFn) {
      setErrorFn(message);
    }
    return null;
  }
}
