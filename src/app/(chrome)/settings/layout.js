"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOptionalAuth } from "@/hooks/useAuth";
import { useOptionalUserProfile } from "@/components/UserProfileProvider";
import SettingsSidebar from "@/components/settings/SettingsSidebar";

export default function SettingsLayout({ children }) {
  const router = useRouter();
  const authContext = useOptionalAuth();
  const user = authContext?.user || null;
  const authLoading = authContext?.loading || false;
  const profileContext = useOptionalUserProfile();
  const userProfile = profileContext?.userProfile || null;
  const profileLoading = profileContext?.loading || false;
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
  }, [user, authLoading, router]);
  
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <div className="flex flex-col lg:flex-row gap-8">
          <SettingsSidebar user={{ ...user, ...userProfile }} />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
