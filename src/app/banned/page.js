"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BannedPage() {
  const [banInfo, setBanInfo] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBanInfo = sessionStorage.getItem('banInfo');
      
      if (storedBanInfo) {
        try {
          const info = JSON.parse(storedBanInfo);
          setBanInfo(info);
        } catch (error) {
          console.error('Error parsing ban info:', error);
        }
      } else {
        router.replace('/');
      }
    }
  }, [router]);

  if (!banInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Account Suspended
          </h1>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 font-medium mb-2">Reason for suspension:</p>
            <p className="text-sm text-red-700">
              {banInfo.reason || 'Your account has been suspended by an administrator.'}
            </p>
          </div>

          {banInfo.bannedAt && (
            <p className="text-sm text-gray-500 text-center mb-6">
              Suspended on: {new Date(banInfo.bannedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              If you believe this was a mistake, please contact our support team for assistance.
            </p>
          </div>

          <div className="space-y-3">
            <Link 
              href="/"
              className="block w-full text-center py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Return to Home
            </Link>
            
            <button
              onClick={() => {
                sessionStorage.removeItem('banInfo');
                router.push('/');
              }}
              className="btn-base btn-neutral block w-full text-center py-3 px-4"
            >
              Clear and Return
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Your account will remain suspended until reviewed by our moderation team.
          </p>
        </div>
      </div>
    </div>
  );
}
