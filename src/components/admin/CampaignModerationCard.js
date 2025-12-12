"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getModerationStatusColor } from "@/utils/admin/adminHelpers";
import { abbreviateNumber } from "@/utils/validation";

export default function CampaignModerationCard({ campaign, onUpdate }) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [updateError, setUpdateError] = useState(null);

  const handleModerationChange = async (newStatus, reason = '') => {
    if (!user) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          moderationStatus: newStatus,
          removeReason: reason 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update campaign');
      }

      if (onUpdate) {
        onUpdate(data.data);
      }
      
      setShowActions(false);
    } catch (error) {
      console.error('Error updating campaign:', error);
      setUpdateError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/admin/campaigns/${campaign.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          confirmed: true,
          deleteReason: deleteReason || 'Deleted by admin'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete campaign');
      }

      if (onUpdate) {
        onUpdate(null, true);
      }
      
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      setUpdateError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getModerationStatusColor(campaign.moderationStatus)}`}>
              {campaign.moderationStatus}
            </span>
          </div>
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
              {campaign.type}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
            {campaign.title}
          </h3>
          
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <span>by {campaign.creator?.displayName || 'Unknown'}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {abbreviateNumber(campaign.supportersCount || 0)}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
                {campaign.reportsCount || 0}
              </span>
            </div>
          </div>

          {updateError && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 p-2 rounded">
              {updateError}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              disabled={isUpdating}
              className="w-full btn-base bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 text-sm py-2"
            >
              {isUpdating ? 'Processing...' : 'Actions'}
            </button>

            {showActions && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {campaign.reportsCount > 0 && (
                    <a
                      href={`/admin/reports?campaignId=${campaign.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Reports ({campaign.reportsCount})
                    </a>
                  )}
                  
                  {campaign.moderationStatus !== 'active' && (
                    <button
                      onClick={() => handleModerationChange('active')}
                      className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                    >
                      Restore to Active
                    </button>
                  )}
                  
                  {campaign.moderationStatus !== 'under-review-hidden' && (
                    <button
                      onClick={() => handleModerationChange('under-review-hidden')}
                      className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                    >
                      Mark Under Review (Hide)
                    </button>
                  )}
                  
                  {campaign.moderationStatus !== 'removed-temporary' && (
                    <button
                      onClick={() => handleModerationChange('removed-temporary', 'Removed by admin')}
                      className="w-full text-left px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
                    >
                      Remove Campaign (Temporary)
                    </button>
                  )}
                  
                  {campaign.moderationStatus !== 'removed-permanent' && (
                    <button
                      onClick={() => handleModerationChange('removed-permanent', 'Permanently removed by admin')}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      Remove Campaign (Permanent)
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowActions(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 border-t border-gray-200"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            )}
          </div>

          <a
            href={`/campaign/${campaign.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-sm text-emerald-600 hover:text-emerald-700"
          >
            View Campaign →
          </a>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Campaign Permanently?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. The campaign and its image will be permanently deleted.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for deletion (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows="3"
                placeholder="Enter reason..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-base bg-gray-600 text-white hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isUpdating}
                className="flex-1 btn-base bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isUpdating ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
