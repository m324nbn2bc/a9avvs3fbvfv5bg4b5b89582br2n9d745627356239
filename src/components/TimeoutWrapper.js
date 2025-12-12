'use client';

import { useState, useEffect } from 'react';

export default function TimeoutWrapper({ children, timeout = 10000 }) {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Set loaded state after a short delay to ensure components have rendered
    const loadTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    // Set timeout to prevent infinite loading
    const timeoutTimer = setTimeout(() => {
      if (!isLoaded) {
        setIsTimedOut(true);
      }
    }, timeout);

    return () => {
      clearTimeout(loadTimer);
      clearTimeout(timeoutTimer);
    };
  }, [timeout, isLoaded]);

  // Mark as loaded when component mounts
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (isTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-yellow-500 text-6xl mb-4">⏱️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading timeout</h1>
          <p className="text-gray-600 mb-4">
            The page is taking longer than expected to load. This might be due to a slow connection.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-base btn-info py-2 px-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return children;
}