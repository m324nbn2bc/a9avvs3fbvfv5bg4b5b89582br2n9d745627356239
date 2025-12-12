"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function ReportDetailsPanel({ report, onClose, onUpdate, isGrouped = false }) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const actionReasons = [
    { value: 'inappropriate_content', label: 'Inappropriate content' },
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'misinformation', label: 'Misinformation' },
    { value: 'copyright_violation', label: 'Copyright violation' },
    { value: 'other', label: 'Other' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonText = (reason) => {
    switch (reason) {
      case 'inappropriate':
        return 'Inappropriate Content';
      case 'spam':
        return 'Spam';
      case 'copyright':
        return 'Copyright Violation';
      case 'inappropriate_avatar':
        return 'Inappropriate Profile Picture';
      case 'offensive_username':
        return 'Offensive Username';
      case 'spam_bio':
        return 'Spam in Bio';
      case 'impersonation':
        return 'Impersonation';
      case 'other':
        return 'Other';
      default:
        return reason;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const openConfirmation = (status, action, actionLabel) => {
    if (action === 'warned' || action === 'removed') {
      setPendingAction({ status, action, actionLabel });
      setShowReasonDropdown(true);
      setSelectedReason('');
    } else {
      setConfirmAction({ status, action, actionLabel });
    }
  };

  const handleReasonSubmit = () => {
    if (!selectedReason) {
      alert('Please select a reason for this action.');
      return;
    }

    setShowReasonDropdown(false);
    setConfirmAction({ ...pendingAction, reason: selectedReason });
    setPendingAction(null);
  };

  const handleConfirmedAction = async () => {
    if (!user || !confirmAction) return;

    const { status, action, reason } = confirmAction;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const token = await user.getIdToken();
      
      const endpoint = isGrouped 
        ? `/api/admin/reports/summary/${report.id}`
        : `/api/admin/reports/${report.id}`;
      
      const requestBody = { status, action };
      
      if (reason) {
        requestBody.reason = reason;
      }
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update report');
      }

      alert(`✅ Action completed successfully! ${action === 'no-action' ? 'Report dismissed' : action === 'warned' ? 'Warning issued' : 'Content removed'}`);

      if (onUpdate) {
        onUpdate(data.data);
      }
    } catch (error) {
      setUpdateError(error.message);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getConfirmationMessage = (action) => {
    const targetName = (isGrouped ? report.targetType === 'user' : report.type === 'profile')
      ? (isGrouped ? report.displayName || report.username : report.reportedUser?.displayName)
      : (isGrouped ? report.campaignTitle : report.campaign?.title);

    switch (action) {
      case 'no-action':
        return `Are you sure you want to dismiss this report? The ${isGrouped ? report.targetType : (report.type === 'profile' ? 'user' : 'campaign')} will be restored to active status.`;
      case 'warned':
        return `Are you sure you want to issue a warning to this ${(isGrouped ? report.targetType === 'user' : report.type === 'profile') ? 'user' : 'creator'}? They will receive a notification with the selected reason.`;
      case 'removed':
        return `Are you sure you want to ${(isGrouped ? report.targetType === 'user' : report.type === 'profile') ? 'ban this user' : 'remove this campaign'}? This action will hide the content and notify the ${(isGrouped ? report.targetType === 'user' : report.type === 'profile') ? 'user' : 'creator'} with the selected reason and appeal deadline.`;
      default:
        return 'Are you sure you want to proceed with this action?';
    }
  };

  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-2xl">
          <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
            <div className="px-6 py-4 bg-emerald-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">Report Details</h2>
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

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
              </div>

              {(isGrouped ? report.targetType === 'user' : report.type === 'profile') ? (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Reported User</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {(isGrouped ? report.profileImage : report.reportedUser?.avatarUrl) && (
                      <img
                        src={isGrouped ? report.profileImage : report.reportedUser.avatarUrl}
                        alt={isGrouped ? report.displayName : report.reportedUser.displayName}
                        className="w-20 h-20 rounded-full mb-3 object-cover"
                        loading="lazy"
                      />
                    )}
                    <h4 className="font-medium text-gray-900">
                      {isGrouped 
                        ? (report.displayName || report.username || 'Unknown User')
                        : (report.reportedUser?.displayName || report.reportedUsername || 'Unknown User')
                      }
                    </h4>
                    {(isGrouped ? report.username : report.reportedUser?.username) && (
                      <p className="text-sm text-gray-600 mt-1">
                        @{isGrouped ? report.username : report.reportedUser.username}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Status: <span className="capitalize">{isGrouped ? report.accountStatus : (report.reportedUser?.accountStatus || 'Unknown')}</span>
                    </p>
                    {isGrouped && (
                      <p className="text-sm text-gray-600">
                        Reports: {report.reportsCount || 0}
                      </p>
                    )}
                    {!isGrouped && report.reportedUser?.reportsCount > 0 && (
                      <p className="text-sm text-gray-600">
                        Total Reports: {report.reportedUser.reportsCount}
                      </p>
                    )}
                    {(isGrouped ? report.username : report.reportedUsername) && (
                      <a
                        href={`/u/${isGrouped ? report.username : report.reportedUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-600 hover:text-emerald-700 mt-2 inline-block"
                      >
                        View Profile →
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Campaign</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {(isGrouped ? report.campaignImage : report.campaign?.imageUrl) && (
                      <img
                        src={isGrouped ? report.campaignImage : report.campaign.imageUrl}
                        alt={isGrouped ? report.campaignTitle : report.campaign.title}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                        loading="lazy"
                      />
                    )}
                    <h4 className="font-medium text-gray-900">
                      {isGrouped ? (report.campaignTitle || 'Unknown Campaign') : (report.campaign?.title || 'Unknown Campaign')}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Type: <span className="capitalize">{isGrouped ? report.campaignType : (report.campaign?.type || 'Unknown')}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: <span className="capitalize">{isGrouped ? report.moderationStatus : (report.campaign?.moderationStatus || 'Unknown')}</span>
                    </p>
                    {isGrouped && (
                      <p className="text-sm text-gray-600">
                        Reports: {report.reportsCount || 0}
                      </p>
                    )}
                    {!isGrouped && report.campaign?.creator && (
                      <p className="text-sm text-gray-600">
                        Creator: {report.campaign.creator.displayName}
                      </p>
                    )}
                    {(isGrouped ? report.campaignSlug : report.campaign?.slug) && (
                      <a
                        href={`/campaign/${isGrouped ? report.campaignSlug : report.campaign.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-600 hover:text-emerald-700 mt-2 inline-block"
                      >
                        View Campaign →
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Report Details</h3>
                <dl className="space-y-2">
                  {!isGrouped && (
                    <>
                      <div>
                        <dt className="text-xs text-gray-500">Reason</dt>
                        <dd className="text-sm text-gray-900">{getReasonText(report.reason)}</dd>
                      </div>
                      {report.details && (
                        <div>
                          <dt className="text-xs text-gray-500">Additional Details</dt>
                          <dd className="text-sm text-gray-900">{report.details}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-xs text-gray-500">Reported By</dt>
                        <dd className="text-sm text-gray-900">
                          {report.reporter?.displayName || 'Anonymous'}
                          {report.reporter?.username && (
                            <span className="text-gray-500"> (@{report.reporter.username})</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Reported At</dt>
                        <dd className="text-sm text-gray-900">{formatDate(report.createdAt)}</dd>
                      </div>
                      {report.reviewedAt && (
                        <div>
                          <dt className="text-xs text-gray-500">Reviewed At</dt>
                          <dd className="text-sm text-gray-900">{formatDate(report.reviewedAt)}</dd>
                        </div>
                      )}
                      {report.action && (
                        <div>
                          <dt className="text-xs text-gray-500">Action Taken</dt>
                          <dd className="text-sm text-gray-900 capitalize">{report.action.replace('-', ' ')}</dd>
                        </div>
                      )}
                    </>
                  )}
                  {isGrouped && (
                    <>
                      <div>
                        <dt className="text-xs text-gray-500">Reports Count</dt>
                        <dd className="text-sm text-gray-900">{report.reportsCount || 0}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">First Reported</dt>
                        <dd className="text-sm text-gray-900">{formatDate(report.firstReportedAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Last Reported</dt>
                        <dd className="text-sm text-gray-900">{formatDate(report.lastReportedAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Summary Status</dt>
                        <dd className="text-sm text-gray-900 capitalize">{report.status}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => openConfirmation('dismissed', 'no-action', 'Dismiss Report')}
                    disabled={isUpdating || report.status === 'dismissed'}
                    className="w-full btn-base btn-secondary px-5 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Processing...' : 'Dismiss Report'}
                  </button>
                  
                  <button
                    onClick={() => openConfirmation('resolved', 'warned', (isGrouped ? report.targetType === 'user' : report.type === 'profile') ? 'Warn User' : 'Warn Creator')}
                    disabled={isUpdating || report.status === 'resolved' || report.status === 'dismissed'}
                    className="w-full btn-base btn-warning px-5 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Processing...' : ((isGrouped ? report.targetType === 'user' : report.type === 'profile') ? 'Warn User' : 'Warn Creator')}
                  </button>
                  
                  <button
                    onClick={() => openConfirmation('resolved', 'removed', (isGrouped ? report.targetType === 'user' : report.type === 'profile') ? 'Ban User' : 'Remove Campaign')}
                    disabled={isUpdating || report.status === 'resolved' || report.status === 'dismissed'}
                    className="w-full btn-base btn-danger px-5 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Processing...' : ((isGrouped ? report.targetType === 'user' : report.type === 'profile') ? 'Ban User' : 'Remove Campaign')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reason Selection Modal */}
      {showReasonDropdown && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowReasonDropdown(false)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select Reason for {pendingAction?.action === 'warned' ? 'Warning' : 'Removal/Ban'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select a reason --</option>
                  {actionReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReasonDropdown(false);
                    setPendingAction(null);
                    setSelectedReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReasonSubmit}
                  disabled={!selectedReason}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmedAction}
        title={confirmAction?.actionLabel || 'Confirm Action'}
        message={confirmAction ? getConfirmationMessage(confirmAction.action) : ''}
        confirmText={confirmAction?.actionLabel || 'Confirm'}
        cancelText="Cancel"
        type={confirmAction?.action === 'removed' ? 'danger' : confirmAction?.action === 'warned' ? 'warning' : 'danger'}
        requireTypedConfirmation={confirmAction?.action === 'warned' || confirmAction?.action === 'removed'}
      />
    </div>
  );
}
