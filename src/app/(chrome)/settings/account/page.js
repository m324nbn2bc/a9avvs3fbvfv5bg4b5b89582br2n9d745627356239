"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsCard from "@/components/settings/SettingsCard";
import ConfirmationModal from "@/components/ConfirmationModal";
import { getStoredSessionId } from "@/utils/sessionManager";

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

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [revokingSessionId, setRevokingSessionId] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const [emailForm, setEmailForm] = useState({
    currentPassword: "",
    newEmail: "",
    confirmEmail: ""
  });
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    if (user) {
      const providerData = user.providerData || [];
      const hasGoogleProvider = providerData.some(p => p.providerId === 'google.com');
      const hasPasswordProvider = providerData.some(p => p.providerId === 'password');
      setIsGoogleUser(hasGoogleProvider && !hasPasswordProvider);
    }
  }, [user]);

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

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;

      setSessionsLoading(true);
      setSessionsError("");

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/settings/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          const currentSessionId = getStoredSessionId();
          const sessionsWithCurrent = data.sessions.map(session => ({
            ...session,
            isCurrent: session.id === currentSessionId || session.isCurrent
          }));
          setSessions(sessionsWithCurrent);
        } else {
          setSessionsError(data.error || 'Failed to load sessions');
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setSessionsError('Failed to load sessions');
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  const handleRevokeSession = async (sessionId) => {
    if (!user) return;

    setRevokingSessionId(sessionId);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/settings/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } else {
        setSessionsError(data.error || 'Failed to revoke session');
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      setSessionsError('Failed to revoke session');
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!user) return;

    setRevokingAll(true);

    try {
      const token = await user.getIdToken();
      const currentSessionId = getStoredSessionId();
      const response = await fetch(`/api/settings/sessions?all=true&currentSessionId=${currentSessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSessions(prev => prev.filter(s => s.isCurrent));
      } else {
        setSessionsError(data.error || 'Failed to revoke sessions');
      }
    } catch (error) {
      console.error('Error revoking sessions:', error);
      setSessionsError('Failed to revoke sessions');
    } finally {
      setRevokingAll(false);
    }
  };

  const formatSessionDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'tablet':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

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

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");

    if (emailForm.newEmail !== emailForm.confirmEmail) {
      setEmailError("Email addresses do not match");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.newEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (emailForm.newEmail === user?.email) {
      setEmailError("New email must be different from your current email");
      return;
    }

    setEmailLoading(true);

    try {
      const { getAuth, verifyBeforeUpdateEmail, reauthenticateWithCredential, EmailAuthProvider } = await import("firebase/auth");
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser || !currentUser.email) {
        throw new Error("No user signed in");
      }

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        emailForm.currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      await verifyBeforeUpdateEmail(currentUser, emailForm.newEmail);

      setEmailSuccess("A verification email has been sent to your new email address. Please click the link in that email to complete the change. Your email will only be updated after verification.");
      setEmailForm({
        currentPassword: "",
        newEmail: "",
        confirmEmail: ""
      });
      setShowEmailForm(false);
    } catch (error) {
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        setEmailError("Current password is incorrect");
      } else if (error.code === "auth/email-already-in-use") {
        setEmailError("This email is already registered to another account");
      } else if (error.code === "auth/invalid-email") {
        setEmailError("Please enter a valid email address");
      } else if (error.code === "auth/requires-recent-login") {
        setEmailError("Please sign out and sign back in before changing your email");
      } else if (error.code === "auth/operation-not-allowed") {
        setEmailError("Email change is not allowed. Please contact support.");
      } else {
        setEmailError(error.message || "Failed to update email");
      }
    } finally {
      setEmailLoading(false);
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
            {emailError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                {emailError}
              </div>
            )}
            {emailSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm mb-4">
                {emailSuccess}
              </div>
            )}

            {!showEmailForm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 font-medium">{user?.email || "No email"}</p>
                  {isGoogleUser ? (
                    <p className="text-sm text-gray-500 mt-1">Email is managed by Google and cannot be changed here</p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">You can change your email address below</p>
                  )}
                </div>
                {!isGoogleUser && (
                  <button
                    onClick={() => {
                      setShowEmailForm(true);
                      setEmailError("");
                      setEmailSuccess("");
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Change
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    placeholder="Enter your current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Email Address
                  </label>
                  <input
                    type="email"
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    placeholder="Enter new email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Email
                  </label>
                  <input
                    type="email"
                    value={emailForm.confirmEmail}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, confirmEmail: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    placeholder="Confirm new email address"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  A verification email will be sent to your new address. You must verify it to complete the change.
                </p>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="btn-base btn-primary py-2 px-4"
                  >
                    {emailLoading ? "Updating..." : "Update Email"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailForm(false);
                      setEmailForm({ currentPassword: "", newEmail: "", confirmEmail: "" });
                      setEmailError("");
                    }}
                    className="btn-base btn-secondary py-2 px-4"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
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
            {sessionsError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                {sessionsError}
              </div>
            )}

            {sessionsLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-sm">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="font-medium">No active sessions</p>
                <p className="text-sm mt-1">Your session history will appear here after signing in</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-gray-100">
                  {sessions.map((session) => (
                    <div key={session.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${session.isCurrent ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                            {getDeviceIcon(session.deviceType)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">
                                {session.browser} on {session.os}
                              </p>
                              {session.isCurrent && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {session.deviceType} • Last active {formatSessionDate(session.lastActiveAt)}
                            </p>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            disabled={revokingSessionId === session.id}
                            className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                          >
                            {revokingSessionId === session.id ? 'Revoking...' : 'Sign out'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {sessions.filter(s => !s.isCurrent).length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={handleRevokeAllSessions}
                      disabled={revokingAll}
                      className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {revokingAll ? 'Signing out...' : 'Sign out all other devices'}
                    </button>
                  </div>
                )}
              </div>
            )}
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
