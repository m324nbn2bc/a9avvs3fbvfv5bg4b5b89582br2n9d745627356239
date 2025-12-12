'use client';

import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import ProfilePage from './ProfilePage';

function ProfilePageWrapper({ isOwnProfile = false }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If it's supposed to be own profile but user is not authenticated
  if (isOwnProfile && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6">
          <div className="mx-auto w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">You haven't created an account</h3>
          <p className="text-gray-600 mb-6">Create an account or sign in if you already have one to view and manage your profile.</p>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/signup')}
              className="btn-base btn-primary w-full px-6 py-3 font-medium"
            >
              Create Account
            </button>
            <button 
              onClick={() => router.push('/signin')}
              className="btn-base btn-secondary w-full px-6 py-3 font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated or viewing someone else's profile
  return <ProfilePage isOwnProfile={isOwnProfile} />;
}

ProfilePageWrapper.displayName = 'ProfilePageWrapper';
export default ProfilePageWrapper;