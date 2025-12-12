"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { getCampaignBySlug } from '../../../../lib/firestore';
import { useCampaignSession } from '../../../../contexts/CampaignSessionContext';
import { useAuth } from '../../../../hooks/useAuth';
import { getCampaignPreview, getProfileAvatar } from '../../../../utils/imageTransform';
import { abbreviateNumber } from '../../../../utils/validation';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import CampaignStepIndicator from '../../../../components/CampaignStepIndicator';
import ReportModal from '../../../../components/ReportModal';
import ErrorBoundary from '../../../../components/ErrorBoundary';

export default function CampaignUploadPage() {
  return (
    <ErrorBoundary>
      <CampaignUploadContent />
    </ErrorBoundary>
  );
}

function CampaignUploadContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug;
  const campaignSession = useCampaignSession();

  // State
  const [campaign, setCampaign] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);

  const fileInputRef = useRef();

  // Fetch campaign data
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const result = await getCampaignBySlug(slug);
        
        if (!result) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        
        setCampaign(result.campaign);
        setCreator(result.creator);
        
        // Store campaign and creator data in session
        campaignSession.setCampaignData(slug, result.campaign);
        campaignSession.setCreatorData(slug, result.creator);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching campaign:', error);
        setNotFound(true);
        setLoading(false);
      }
    };
    
    fetchCampaign();
  }, [slug, campaignSession]);

  // Handle photo selection
  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setError('');
    setUploading(true);
    
    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Photo must be smaller than 10MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
      setUploading(false);
      return;
    }
    
    // File type validation
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, or WEBP image');
      setUploading(false);
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      // Store in session
      campaignSession.setUserPhoto(slug, file, event.target.result);
      
      // Initialize adjustments
      campaignSession.setAdjustments(slug, { scale: 1.0, x: 0, y: 0 });
      
      // Redirect to adjust page
      router.push(`/campaign/${slug}/adjust`);
    };
    
    reader.onerror = () => {
      setError('Failed to read image file');
      setUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  // Share functionality
  const handleShare = async (platform) => {
    const url = window.location.href;
    const text = campaign.title + (campaign.description ? ` - ${campaign.description}` : '');
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      default:
        break;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Not found state
  if (notFound || !campaign) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Campaign Not Found</h1>
          <p className="text-gray-600 mb-8">This campaign doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/')}
            className="btn-base btn-primary px-6 py-3 font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex">
        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col py-8 px-4 sm:px-6 lg:px-8 pt-20">
          <div className="mx-auto w-full max-w-5xl">
            
            {/* Header */}
            <div className="text-center mb-6 bg-yellow-400 px-6 py-5 rounded-t-xl">
              <CampaignStepIndicator currentStep={1} />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{campaign.title}</h1>
              {campaign.description && (
                <p className="text-sm text-gray-800 mt-1">{campaign.description}</p>
              )}
            </div>
            
            {/* Content Card */}
            <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm">
              
              {error && (
                <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-6 p-4 sm:p-6">
                
                {/* Left: Campaign Preview */}
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">Campaign Preview</h2>
                  
                  <div className="relative w-full rounded-lg border-2 border-gray-300 overflow-hidden" style={{ maxHeight: '500px' }}>
                    <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                      <Image
                        src={getCampaignPreview(campaign.imageUrl)}
                        alt={campaign.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase">
                      {campaign.type === 'frame' ? 'Frame' : 'Background'}
                    </div>
                  </div>

                  {creator && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {creator.profileImage && (
                        <div className="relative w-10 h-10 rounded-full border-2 border-gray-300 overflow-hidden flex-shrink-0">
                          <Image
                            src={getProfileAvatar(creator.profileImage)}
                            alt={creator.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Created by</p>
                        <button
                          onClick={() => router.push(`/u/${creator.username}`)}
                          className="font-semibold text-gray-900 hover:underline text-sm"
                        >
                          {creator.displayName || creator.username}
                        </button>
                        <p className="text-xs text-gray-600">
                          {abbreviateNumber(campaign.supportersCount || 0)} {campaign.supportersCount === 1 ? 'support' : 'supports'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Upload & Actions */}
                <div className="space-y-5">
                  
                  {/* Upload Section */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Add Your Photo</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload your photo to create your personalized {campaign.type === 'frame' ? 'frame' : 'background'}
                    </p>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handlePhotoSelect}
                      disabled={uploading}
                      className="hidden"
                      id="user-photo-input"
                    />
                    
                    <label
                      htmlFor="user-photo-input"
                      className={`btn-base btn-primary w-full text-center py-4 cursor-pointer font-bold text-lg ${
                        uploading ? 'opacity-70 cursor-wait' : ''
                      }`}
                    >
                      {uploading ? 'Loading...' : 'Choose Your Photo'}
                    </label>
                    
                    <p className="text-xs text-gray-600 mt-2 text-center">
                      PNG, JPG, or WEBP (max 10MB)
                    </p>
                  </div>

                  {/* Share Campaign */}
                  <div className="pt-3 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Share Campaign</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleShare('twitter')}
                        className="btn-base btn-twitter py-3 text-sm"
                      >
                        Twitter
                      </button>
                      <button
                        onClick={() => handleShare('facebook')}
                        className="btn-base btn-facebook py-3 text-sm"
                      >
                        Facebook
                      </button>
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="btn-base btn-whatsapp py-3 text-sm"
                      >
                        WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* Report Button */}
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="btn-base bg-red-100 hover:bg-red-200 text-red-700 w-full py-2 text-sm font-medium"
                  >
                    Report Campaign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="campaign"
        campaignId={campaign?.id}
        campaignSlug={campaign?.slug}
      />
    </div>
  );
}
