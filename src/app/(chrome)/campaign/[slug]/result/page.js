"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useCampaignSession } from '../../../../../contexts/CampaignSessionContext';
import { requireDownloadComplete } from '../../../../../utils/campaignRouteGuards';
import { composeImages } from '../../../../../utils/imageComposition';
import { getProfileAvatar, getCampaignPreview } from '../../../../../utils/imageTransform';
import LoadingSpinner from '../../../../../components/LoadingSpinner';
import CampaignStepIndicator from '../../../../../components/CampaignStepIndicator';

export default function CampaignResultPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;
  const campaignSession = useCampaignSession();

  // State
  const [session, setSession] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [creator, setCreator] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [composedImageUrl, setComposedImageUrl] = useState('');
  const [redownloading, setRedownloading] = useState(false);

  const canvasRef = useRef(null);
  const composedImageUrlRef = useRef(null);

  // Load session and check route guard
  useEffect(() => {
    const loadSession = async () => {
      const currentSession = campaignSession.getSession(slug);
      
      // Route guard: check if downloaded
      if (!requireDownloadComplete(currentSession, router, slug)) {
        return; // Will redirect
      }
      
      setSession(currentSession);
      setCampaign(currentSession.campaignData);
      setCreator(currentSession.creatorData);
      
      // Recreate File object from stored data
      if (currentSession.userPhotoPreview) {
        try {
          const response = await fetch(currentSession.userPhotoPreview);
          const blob = await response.blob();
          const file = new File([blob], currentSession.userPhoto?.name || 'photo.jpg', {
            type: currentSession.userPhoto?.type || 'image/jpeg'
          });
          setUserPhoto(file);
          
          // Compose image for display
          const { blob: composedBlob } = await composeImages(
            file,
            getCampaignPreview(currentSession.campaignData.imageUrl),
            currentSession.adjustments || { scale: 1.0, x: 0, y: 0 },
            currentSession.campaignData.type
          );
          
          const url = URL.createObjectURL(composedBlob);
          composedImageUrlRef.current = url;
          setComposedImageUrl(url);
        } catch (error) {
          console.error('Error loading result:', error);
        }
      }
      
      setLoading(false);
    };
    
    loadSession();
    
    // Cleanup composed image URL on unmount
    return () => {
      if (composedImageUrlRef.current) {
        URL.revokeObjectURL(composedImageUrlRef.current);
      }
    };
  }, [slug, router, campaignSession]);

  // Start Over - clear session and go to page 1
  const handleStartOver = () => {
    campaignSession.clearSession(slug);
    router.push(`/campaign/${slug}`);
  };

  // Re-download
  const handleRedownload = async () => {
    if (!userPhoto || !campaign || !session) return;
    
    setRedownloading(true);
    
    try {
      const { blob } = await composeImages(
        userPhoto,
        getCampaignPreview(campaign.imageUrl),
        session.adjustments || { scale: 1.0, x: 0, y: 0 },
        campaign.type
      );
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${campaign.slug}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error re-downloading:', error);
    } finally {
      setRedownloading(false);
    }
  };

  // Share functionality
  const handleShare = async (platform) => {
    const url = window.location.origin + `/campaign/${slug}`;
    const text = campaign ? `Check out ${campaign.title} on Frame Your Voice!` : 'Check out this campaign!';
    
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session || !campaign) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex">
        <div className="flex-1 w-full flex flex-col py-8 px-4 sm:px-6 lg:px-8 pt-20">
          <div className="mx-auto w-full max-w-5xl">
            
            <div className="text-center mb-6 bg-yellow-400 px-6 py-5 rounded-t-xl">
              <CampaignStepIndicator currentStep={3} />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                Your {campaign.type === 'frame' ? 'Frame' : 'Background'} is Ready!
              </h1>
              <p className="text-sm text-gray-800">
                Download complete! Share your creation with the world.
              </p>
            </div>
            
            <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm">
              
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-6 p-4 sm:p-6">
                
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">Your Final Image</h2>
                  {composedImageUrl && (
                    <div className="relative">
                      <img
                        src={composedImageUrl}
                        alt="Your final result"
                        className="w-full h-auto rounded-lg border-2 border-gray-300"
                        style={{ maxHeight: '500px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Actions</h2>
                    <button
                      onClick={handleRedownload}
                      disabled={redownloading}
                      className={`btn-base btn-secondary w-full py-3 font-medium ${
                        redownloading ? 'opacity-70 cursor-wait' : ''
                      }`}
                    >
                      {redownloading ? 'Downloading...' : 'Download Again'}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Share Your Creation</h3>
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

                  {creator && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 text-center mb-2">Campaign by</p>
                      <div className="flex items-center justify-center gap-3">
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
                        <div className="text-left">
                          <button
                            onClick={() => router.push(`/u/${creator.username}`)}
                            className="font-semibold text-gray-900 hover:underline text-sm"
                          >
                            {creator.displayName || creator.username}
                          </button>
                          <p className="text-xs text-gray-600">
                            {campaign.supportersCount || 0} {campaign.supportersCount === 1 ? 'support' : 'supports'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <button
                      onClick={handleStartOver}
                      className="btn-base bg-gray-600 hover:bg-gray-700 text-white w-full py-3 font-medium"
                    >
                      Create Another One
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Start over with a new photo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
