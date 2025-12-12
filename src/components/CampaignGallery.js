"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import CampaignCard from './CampaignCard';
import ShareModal from './ShareModal';
import ReportModal from './ReportModal';
import ConfirmationModal from './ConfirmationModal';

export default function CampaignGallery({ 
  campaigns, 
  loading = false, 
  isOwnProfile = false, 
  showReportOption = false,
  showCreatorInfo = false,
  onCampaignDeleted
}) {
  const { user } = useAuth();
  const [shareModalData, setShareModalData] = useState(null);
  const [reportModalData, setReportModalData] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [CampaignGallery] Render:', {
      campaignsCount: campaigns?.length || 0,
      loading,
      isOwnProfile,
      showCreatorInfo,
    });
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">
            {isOwnProfile ? "You haven't created any campaigns yet" : "No campaigns yet"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {isOwnProfile 
              ? "Start creating your first frame or background campaign to share with the world!"
              : "This user hasn't published any campaigns yet."}
          </p>
          {isOwnProfile && (
            <Link
              href="/create"
              className="btn-base btn-primary inline-block px-4 py-2 text-sm font-medium"
            >
              Create Campaign
            </Link>
          )}
        </div>
      </div>
    );
  }

  const handleShare = (campaign) => {
    const campaignUrl = `${window.location.origin}/campaign/${campaign.slug}`;
    setShareModalData({
      type: 'campaign',
      url: campaignUrl,
      title: campaign.title,
      subtitle: campaign.type === 'frame' ? 'Frame' : 'Background',
      image: campaign.imageUrl,
    });
  };

  const handleReport = (campaign) => {
    setReportModalData({
      campaignId: campaign.id,
      campaignSlug: campaign.slug,
    });
  };

  const handleDelete = (campaign) => {
    setDeleteConfirmation(campaign);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation || !user) return;

    setIsDeleting(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${deleteConfirmation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete campaign');
      }

      setDeleteSuccess(true);

      if (onCampaignDeleted) {
        onCampaignDeleted(deleteConfirmation.id);
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccessClose = () => {
    setDeleteSuccess(false);
    setDeleteConfirmation(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            isOwnProfile={isOwnProfile}
            showReportOption={showReportOption}
            showCreatorInfo={showCreatorInfo}
            onShare={handleShare}
            onReport={handleReport}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <ShareModal
        isOpen={!!shareModalData}
        onClose={() => setShareModalData(null)}
        type={shareModalData?.type}
        url={shareModalData?.url}
        title={shareModalData?.title}
        subtitle={shareModalData?.subtitle}
        image={shareModalData?.image}
      />

      <ReportModal
        isOpen={!!reportModalData}
        onClose={() => setReportModalData(null)}
        type="campaign"
        campaignId={reportModalData?.campaignId}
        campaignSlug={reportModalData?.campaignSlug}
      />

      <ConfirmationModal
        isOpen={!!deleteConfirmation && !deleteSuccess}
        onClose={() => !isDeleting && setDeleteConfirmation(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${deleteConfirmation?.title}"? This action cannot be undone. All related images and data will be permanently removed.`}
        confirmText={isDeleting ? "Deleting..." : "Delete Campaign"}
        cancelText="Cancel"
        type="danger"
      />

      {deleteSuccess && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
            onClick={handleSuccessClose}
          />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-white rounded-lg max-w-md w-full p-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center py-4">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Campaign Deleted</h3>
                <p className="text-gray-600 mb-6">
                  Your campaign has been successfully deleted.
                </p>
                <button
                  onClick={handleSuccessClose}
                  className="btn-base btn-primary px-8 py-2 font-medium"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
