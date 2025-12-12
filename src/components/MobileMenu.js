"use client";

import { useOptionalAuth } from "../hooks/useAuth";
import { useOptionalUserProfile } from "./UserProfileProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import CreateCampaignModal from "./CreateCampaignModal";

export default function MobileMenu({ 
  isMenuOpen, 
  setIsMenuOpen
}) {
  const authContext = useOptionalAuth();
  const profileContext = useOptionalUserProfile();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useBodyScrollLock(isMenuOpen);
  
  const { user, loading, mounted, logout } = authContext || {
    user: null,
    loading: false,
    mounted: true,
    logout: async () => ({ success: false })
  };

  const { userProfile, loading: profileLoading } = profileContext || {
    userProfile: null,
    loading: false
  };
  const router = useRouter();

  const handleCreateClick = (e) => {
    e.preventDefault();
    setIsCreateModalOpen(true);
  };

  const handleModalClose = (navigated) => {
    setIsCreateModalOpen(false);
    if (navigated) {
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div className={`fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex-shrink-0 flex justify-end p-4">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="btn-base btn-secondary p-2 rounded-full"
          >
            <svg 
              className="w-6 h-6 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-6 pb-6">
            {(!mounted || loading || profileLoading) ? (
              <div className="mb-6 pb-4 border-b border-gray-100">
                <div className="h-7 bg-gray-200 rounded animate-pulse w-48"></div>
              </div>
            ) : user ? (
              <div className="mb-6 pb-4 border-b border-gray-100">
                <div className="text-lg font-medium text-gray-800">
                  Welcome {userProfile?.displayName || userProfile?.username || user.displayName || user.email}
                </div>
              </div>
            ) : null}
            <nav className="space-y-1">
              {(!mounted || loading) ? (
                <div className="py-2 px-4">
                  <div className="inline-flex items-center gap-3 py-2 px-3 text-base font-normal rounded-lg">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                </div>
              ) : user ? (
                <>
                  <div className="py-2 px-4">
                    <a 
                      href="/profile"
                      className="flex items-center gap-3 py-2 px-3 text-base font-normal text-gray-800 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </a>
                  </div>
                </>
              ) : null}
              
              <div className="py-2 px-4">
                <a 
                  href="#"
                  onClick={handleCreateClick}
                  className="flex items-center gap-3 py-2 px-3 text-base font-normal text-gray-800 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Create Campaign
                </a>
              </div>
              
              <div className="py-2 px-4">
                <a 
                  href="/campaigns" 
                  className="flex items-center gap-3 py-2 px-3 text-base font-normal text-gray-800 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Campaigns
                </a>
              </div>
              
              <div className="py-2 px-4">
                <a 
                  href="/creators" 
                  className="flex items-center gap-3 py-2 px-3 text-base font-normal text-gray-800 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Top Creators
                </a>
              </div>
              
              <div className="py-2 px-4">
                <a 
                  href="#" 
                  className="flex items-center gap-3 py-2 px-3 text-base font-normal text-gray-800 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L12 12m6.364 6.364L12 12m0 0L5.636 5.636M12 12l6.364 6.364M12 12L5.636 5.636" />
                  </svg>
                  Remove Ads
                </a>
              </div>
              
              <div className="py-2 px-4">
                <a 
                  href="#" 
                  className="flex items-center gap-3 py-2 px-3 text-base font-normal text-gray-800 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Help Center
                </a>
              </div>
            </nav>
            
            <div className="mt-8 mb-4">
              <div className="flex gap-3">
                {!mounted || loading ? (
                  <div className="flex gap-3 w-full">
                    <div className="flex-1 py-2 px-4 text-sm text-center text-gray-400 border border-gray-300 rounded-full">
                      Sign In
                    </div>
                    <div className="flex-1 py-2 px-4 text-sm text-center text-white bg-gray-400 rounded-full">
                      Sign Up
                    </div>
                  </div>
                ) : user ? (
                  <>
                    <button 
                      onClick={logout}
                      className="w-full btn-base btn-secondary py-3 px-4 text-sm font-medium"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        router.push('/signin');
                        setIsMenuOpen(false);
                      }}
                      className="flex-1 btn-base btn-secondary py-3 px-4 text-sm font-medium"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => {
                        router.push('/signup');
                        setIsMenuOpen(false);
                      }}
                      className="flex-1 btn-base btn-primary py-3 px-4 text-sm font-medium"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateCampaignModal 
        isOpen={isCreateModalOpen} 
        onClose={handleModalClose} 
      />
    </>
  );
}
