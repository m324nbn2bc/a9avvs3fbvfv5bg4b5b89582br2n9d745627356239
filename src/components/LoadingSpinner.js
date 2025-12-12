'use client';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`border-2 border-emerald-500 border-t-transparent rounded-full animate-spin ${sizeClasses[size]} ${className}`}></div>
  );
}