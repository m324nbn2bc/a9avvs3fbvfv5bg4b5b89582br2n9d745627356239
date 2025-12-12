// Polyfills for browser compatibility and to prevent hanging
// Only run in browser environment

if (typeof window !== 'undefined') {
  // Add timeout to fetch requests to prevent hanging
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    const timeout = options.timeout || 10000; // 10 second default timeout
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    return originalFetch(url, {
      ...options,
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutId);
    });
  };

  // Add error handling for unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    console.warn('Unhandled promise rejection:', event.reason);
    // Only prevent default in production to avoid masking dev errors
    if (process.env.NODE_ENV === 'production') {
      event.preventDefault();
    }
  });
}