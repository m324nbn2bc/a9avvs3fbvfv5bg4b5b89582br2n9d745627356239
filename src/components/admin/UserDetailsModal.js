"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import ConfirmationModal from "@/components/ConfirmationModal";
import { getRoleBadgeColor, formatTimestamp } from "@/utils/admin/adminHelpers";

export default function UserDetailsModal({ user, onClose, onUpdate }) {
  const { user: currentUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showBanConfirmation, setShowBanConfirmation] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState('temporary');

  // Lock body scroll when modal is open
  useBodyScrollLock(true);

  const handleRoleChange = async (newRole) => {
    if (!currentUser) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const token = await currentUser.getIdToken();
      
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setUpdateError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBanModalContinue = () => {
    const isBanned = user.accountStatus?.includes('banned');
    
    if (!isBanned && !banReason.trim()) {
      setUpdateError('Please provide a reason for banning this user');
      return;
    }

    // Close the ban details modal and open confirmation modal
    setShowBanModal(false);
    setShowBanConfirmation(true);
  };

  const handleBanToggle = async () => {
    if (!currentUser) return;

    const isBanned = user.accountStatus?.includes('banned');

    setIsUpdating(true);
    setUpdateError(null);
    setShowBanConfirmation(false);

    try {
      const token = await currentUser.getIdToken();
      
      const newAccountStatus = isBanned 
        ? 'active' 
        : (banType === 'permanent' ? 'banned-permanent' : 'banned-temporary');
      
      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          accountStatus: newAccountStatus,
          banReason: banReason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update ban status');
      }

      setBanReason('');
      setBanType('temporary');
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating ban status:', error);
      setUpdateError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="fixed inset-y-0 right-0 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
              <div className="px-6 py-4 bg-emerald-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white">User Details</h2>
                  <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 px-6 py-6 space-y-6">
                {updateError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {updateError}
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 flex-shrink-0">
                    {user.profileImage ? (
                      <img
                        className="h-20 w-20 rounded-full object-cover"
                        src={user.profileImage}
                        alt={user.displayName || 'User'}
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-700 font-medium text-2xl">
                          {(user.displayName || user.email || '?')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{user.displayName || 'Unnamed User'}</h3>
                    <p className="text-sm text-gray-500">@{user.username || 'no-username'}</p>
                    <span className={`mt-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role || 'user'}
                    </span>
                  </div>
                </div>

                {(user.accountStatus?.includes('banned')) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h4 className="text-sm font-medium text-red-800">
                        User is {user.accountStatus === 'banned-permanent' ? 'Permanently Banned' : 'Temporarily Banned'}
                      </h4>
                    </div>
                    {user.banReason && (
                      <p className="mt-2 text-sm text-red-700">Reason: {user.banReason}</p>
                    )}
                    {user.bannedAt && (
                      <p className="mt-1 text-xs text-red-600">Banned on: {formatTimestamp(user.bannedAt, true)}</p>
                    )}
                    {user.accountStatus === 'banned-temporary' && user.appealDeadline && (
                      <p className="mt-1 text-xs text-red-600">Appeal deadline: {formatTimestamp(user.appealDeadline, true)}</p>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Profile Information</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{user.email || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Bio</dt>
                      <dd className="text-sm text-gray-900">{user.bio || 'No bio'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Location</dt>
                      <dd className="text-sm text-gray-900">{user.location || 'Not specified'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Joined</dt>
                      <dd className="text-sm text-gray-900">{formatTimestamp(user.createdAt, true)}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Statistics</h3>
                  <dl className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <dt className="text-xs text-gray-500">Campaigns Created</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{user.campaignsCount || 0}</dd>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <dt className="text-xs text-gray-500">Total Supports</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{user.totalSupports || 0}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Admin Actions</h3>
                  <div className="space-y-2">
                    {user.role !== 'admin' ? (
                      <button
                        onClick={() => handleRoleChange('admin')}
                        disabled={isUpdating}
                        className="w-full btn-base bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? 'Processing...' : 'Make Admin'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange('user')}
                        disabled={isUpdating}
                        className="w-full btn-base bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? 'Processing...' : 'Revoke Admin'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowBanModal(true)}
                      disabled={isUpdating}
                      className={`w-full btn-base ${(user.accountStatus?.includes('banned')) ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isUpdating ? 'Processing...' : (user.accountStatus?.includes('banned')) ? 'Unban User' : 'Ban User'}
                    </button>

                    {user.username && (
                      <a
                        href={`/u/${user.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full btn-base bg-emerald-600 text-white hover:bg-emerald-700 text-center block"
                      >
                        View Public Profile
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBanModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowBanModal(false)}></div>
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 z-[70]">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {(user.accountStatus?.includes('banned')) ? 'Unban User' : 'Ban User'}
              </h3>
              
              {!(user.accountStatus?.includes('banned')) && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ban Type
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="temporary"
                          checked={banType === 'temporary'}
                          onChange={(e) => setBanType(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-900">Temporary (30-day appeal window)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="permanent"
                          checked={banType === 'permanent'}
                          onChange={(e) => setBanType(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-900">Permanent (no appeal)</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for ban
                    </label>
                    <textarea
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
                      placeholder="Enter reason for banning this user..."
                    />
                  </div>
                </>
              )}
              
              <p className="text-sm text-gray-600 mb-4">
                {(user.accountStatus?.includes('banned'))
                  ? 'This will unban the user and restore their access.' 
                  : 'This will prevent the user from accessing the platform.'}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setBanReason('');
                    setBanType('temporary');
                  }}
                  className="flex-1 btn-base bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={(user.accountStatus?.includes('banned')) ? handleBanToggle : handleBanModalContinue}
                  disabled={!(user.accountStatus?.includes('banned')) && !banReason.trim()}
                  className={`flex-1 btn-base ${(user.accountStatus?.includes('banned')) ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {(user.accountStatus?.includes('banned')) ? 'Confirm Unban' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Typed Confirmation Modal for Banning */}
      <ConfirmationModal
        isOpen={showBanConfirmation}
        onClose={() => {
          setShowBanConfirmation(false);
          // Reopen the ban modal so they can edit their inputs
          setShowBanModal(true);
        }}
        onConfirm={handleBanToggle}
        title={`Ban User - ${user.username || user.displayName}`}
        message={`You are about to ${banType === 'permanent' ? 'permanently ban' : 'temporarily ban (30-day appeal window)'} this user for: "${banReason}". This action will prevent them from accessing the platform. Type CONFIRM to proceed.`}
        confirmText="Ban User"
        cancelText="Go Back"
        type="danger"
        requireTypedConfirmation={true}
      />
    </>
  );
}
