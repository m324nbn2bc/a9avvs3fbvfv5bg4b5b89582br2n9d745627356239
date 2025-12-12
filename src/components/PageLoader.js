'use client';

import LoadingSpinner from './LoadingSpinner';

export default function PageLoader({ message = 'Loading...', className = '' }) {
  return (
    <div className={`min-h-screen bg-white flex items-center justify-center ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
}