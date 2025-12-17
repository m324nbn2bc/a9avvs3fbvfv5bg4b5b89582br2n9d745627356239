"use client";

import { useState } from "react";
import { useOptionalAuth } from "@/hooks/useAuth";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsCard from "@/components/settings/SettingsCard";

export default function AccountSettingsPage() {
  const authContext = useOptionalAuth();
  const user = authContext?.user || null;
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      const { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } = await import("firebase/auth");
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser || !currentUser.email) {
        throw new Error("No user signed in");
      }

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordForm.currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordForm.newPassword);

      setPasswordSuccess("Password updated successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("New password is too weak. Please use a stronger password.");
      } else if (error.code === "auth/requires-recent-login") {
        setPasswordError("Please sign out and sign back in before changing your password");
      } else {
        setPasswordError(error.message || "Failed to update password");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8 bg-yellow-400 px-6 py-6 rounded-t-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">Account & Security</h1>
        <p className="text-base sm:text-lg text-gray-700 mt-2">Manage your account security settings</p>
      </div>

      <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 px-6 py-8 shadow-sm space-y-8">
        <SettingsSection title="Email Address" description="Your account email address">
          <SettingsCard title="Email">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-medium">{user?.email || "No email"}</p>
                <p className="text-sm text-gray-500 mt-1">Email changes are not currently supported</p>
              </div>
            </div>
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Password" description="Change your account password">
          <SettingsCard title="Change Password">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="btn-base btn-primary py-2 px-4"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Active Sessions" description="Manage your logged in devices">
          <SettingsCard title="Sessions">
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="font-medium">Session management coming soon</p>
              <p className="text-sm mt-1">You'll be able to view and manage active sessions</p>
            </div>
          </SettingsCard>
        </SettingsSection>

        <SettingsSection title="Danger Zone" description="Irreversible actions">
          <SettingsCard title="Delete Account" danger>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Once you delete your account, there is no going back. Please be certain.
                Your account will be scheduled for permanent deletion after 30 days.
              </p>
              <button className="btn-base btn-danger py-2 px-4">
                Delete Account
              </button>
            </div>
          </SettingsCard>
        </SettingsSection>
      </div>
    </div>
  );
}
