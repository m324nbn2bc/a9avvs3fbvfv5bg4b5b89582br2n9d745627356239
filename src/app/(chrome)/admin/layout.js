"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/components/UserProfileProvider";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import PageLoader from "@/components/PageLoader";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading || profileLoading) return;

    if (!user) {
      router.replace("/signin");
      return;
    }

    if (!userProfile || userProfile.role !== "admin") {
      router.replace("/");
      return;
    }

    setIsAuthorized(true);
  }, [user, userProfile, authLoading, profileLoading, router]);

  const handleSignOut = async () => {
    await logout();
    router.replace("/");
  };

  if (authLoading || profileLoading) {
    return <PageLoader message="Loading admin panel..." />;
  }

  if (!user) {
    return <PageLoader message="Redirecting to sign in..." />;
  }

  if (!isAuthorized) {
    if (!userProfile) {
      return <PageLoader message="Loading profile..." />;
    }

    if (userProfile.role !== "admin") {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center px-6">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h3>
            <p className="text-gray-600 mb-6">You don't have permission to access the admin panel.</p>
            <button
              onClick={() => router.replace("/")}
              className="btn-base btn-primary px-6 py-3 font-medium"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return <PageLoader message="Verifying admin access..." />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <AdminSidebar user={{ ...user, ...userProfile }} onSignOut={handleSignOut} />
      
      <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden relative">
        <AdminHeader user={{ ...user, ...userProfile }} />
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
