"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsCard from "@/components/settings/SettingsCard";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletionStatus, setDeletionStatus] = useState({
    requested: false,
    scheduledFor: null
  });
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const fetchDeletionStatus = async () => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/settings/account/delete', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDeletionStatus({
              requested: data.deletionRequested,
              scheduledFor: data.deletionScheduledFor
            });
          }
        }
      } catch (error) {
        console.error('Error fetching deletion status:', error);
      }
    };

    fetchDeletionStatus();
  }, [user]);

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

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/settings/account/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmation: 'DELETE' })
      });

      const data = await response.json();

      if (data.success) {
        setDeletionStatus({
          requested: true,
          scheduledFor: data.deletionDate
        });
        setDeleteModalOpen(false);
      } else {
        setDeleteError(data.error || 'Failed to request account deletion');
      }
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      setDeleteError('Failed to request account deletion. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!user) return;

    setCancelLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/settings/account/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setDeletionStatus({
          requested: false,
          scheduledFor: null
        });
      }
    } catch (error) {
      console.error('Error cancelling deletion:', error);
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDeletionDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {deleteError}
                </div>
              )}

              {deletionStatus.requested ? (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="font-medium text-red-800">Account Scheduled for Deletion</p>
                        <p className="text-sm text-red-700 mt-1">
                          Your account will be permanently deleted on{' '}
                          <strong>{formatDeletionDate(deletionStatus.scheduledFor)}</strong>.
                        </p>
                        <p className="text-sm text-red-600 mt-2">
                          You can cancel this request at any time before the deletion date.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelDeletion}
                    disabled={cancelLoading}
                    className="btn-base btn-secondary py-2 px-4"
                  >
                    {cancelLoading ? "Cancelling..." : "Cancel Deletion Request"}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Once you delete your account, there is no going back. Please be certain.
                    Your account will be scheduled for permanent deletion after 30 days.
                  </p>
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="btn-base btn-danger py-2 px-4"
                  >
                    Delete Account
                  </button>
                </>
              )}
            </div>
          </SettingsCard>
        </SettingsSection>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteError("");
        }}
        onConfirm={handleDeleteAccount}
        title="Delete Your Account?"
        message="This action will schedule your account for permanent deletion in 30 days. During this period, you can cancel the deletion request. After 30 days, all your data including campaigns, profile information, and activity will be permanently removed."
        confirmText={deleteLoading ? "Processing..." : "Delete Account"}
        cancelText="Cancel"
        type="danger"
        requireTypedConfirmation={true}
      />
    </div>
  );
}
