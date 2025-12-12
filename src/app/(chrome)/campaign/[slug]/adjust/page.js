"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCampaignSession } from '../../../../../contexts/CampaignSessionContext';
import { requirePhotoUpload } from '../../../../../utils/campaignRouteGuards';
import { loadImage, composeImages } from '../../../../../utils/imageComposition';
import { getCampaignPreview } from '../../../../../utils/imageTransform';
import LoadingSpinner from '../../../../../components/LoadingSpinner';
import CampaignStepIndicator from '../../../../../components/CampaignStepIndicator';
import ErrorBoundary from '../../../../../components/ErrorBoundary';

export default function CampaignAdjustPage() {
  return (
    <ErrorBoundary>
      <CampaignAdjustContent />
    </ErrorBoundary>
  );
}

function CampaignAdjustContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;
  const campaignSession = useCampaignSession();

  const [session, setSession] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState({ scale: 1.0, x: 0, y: 0, rotation: 0 });
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [imagesReady, setImagesReady] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const userPhotoImgRef = useRef(null);
  const campaignImgRef = useRef(null);
  const rafRef = useRef(null);
  const canvasInitializedRef = useRef(false);
  
  const pointersRef = useRef(new Map());
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPinchDistanceRef = useRef(null);
  const lastRotationAngleRef = useRef(null);
  const isRotatingRef = useRef(false);
  const rotationStartRef = useRef(0);

  useEffect(() => {
    const loadSession = async () => {
      const currentSession = campaignSession.getSession(slug);
      
      if (!requirePhotoUpload(currentSession, router, slug)) {
        return;
      }
      
      setSession(currentSession);
      setCampaign(currentSession.campaignData);
      
      if (currentSession.adjustments) {
        setAdjustments(currentSession.adjustments);
      }
      
      if (currentSession.userPhotoPreview) {
        try {
          const response = await fetch(currentSession.userPhotoPreview);
          const blob = await response.blob();
          const file = new File([blob], currentSession.userPhoto?.name || 'photo.jpg', {
            type: currentSession.userPhoto?.type || 'image/jpeg'
          });
          setUserPhoto(file);
        } catch (error) {
          console.error('Error loading photo:', error);
          setError('Failed to load photo. Please go back and upload again.');
        }
      }
      
      setLoading(false);
    };
    
    loadSession();
  }, [slug, router, campaignSession]);

  const initializeCanvas = useCallback(async () => {
    if (!campaign || !canvasRef.current || canvasInitializedRef.current) {
      return;
    }
    
    const campaignImageUrl = getCampaignPreview(campaign.imageUrl);
    
    try {
      const img = await loadImage(campaignImageUrl);
      campaignImgRef.current = img;
      
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      
      const offscreen = document.createElement('canvas');
      offscreen.width = img.width;
      offscreen.height = img.height;
      offscreenCanvasRef.current = offscreen;
      
      canvasInitializedRef.current = true;
      
      if (userPhotoImgRef.current) {
        setImagesReady(true);
      }
    } catch (error) {
      console.error('Error initializing canvas:', error);
    }
  }, [campaign]);

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  useEffect(() => {
    if (!userPhoto) {
      return;
    }
    
    const loadUserImage = async () => {
      try {
        const img = await loadImage(userPhoto);
        userPhotoImgRef.current = img;
        
        if (campaignImgRef.current && offscreenCanvasRef.current) {
          setImagesReady(true);
        }
      } catch (error) {
        console.error('Error loading user photo:', error);
      }
    };
    
    loadUserImage();
  }, [userPhoto]);

  const renderPreview = useCallback(() => {
    if (!offscreenCanvasRef.current || !canvasRef.current || !userPhotoImgRef.current || !campaignImgRef.current) {
      return;
    }

    const offscreen = offscreenCanvasRef.current;
    const display = canvasRef.current;
    const ctx = offscreen.getContext('2d', { alpha: true });
    
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, offscreen.width, offscreen.height);

    const { scale, x, y, rotation } = adjustments;
    const userImg = userPhotoImgRef.current;
    const campaignImg = campaignImgRef.current;
    const campaignOpacity = isInteracting ? 0.5 : 1.0;

    ctx.save();
    const centerX = offscreen.width / 2;
    const centerY = offscreen.height / 2;
    
    ctx.translate(centerX + x, centerY + y);
    ctx.rotate((rotation * Math.PI) / 180);
    
    const scaledWidth = userImg.width * scale;
    const scaledHeight = userImg.height * scale;
    
    if (campaign.type === 'frame') {
      ctx.drawImage(userImg, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
      ctx.globalAlpha = campaignOpacity;
      ctx.drawImage(campaignImg, 0, 0, offscreen.width, offscreen.height);
      ctx.globalAlpha = 1.0;
    } else {
      ctx.restore();
      ctx.globalAlpha = campaignOpacity;
      ctx.drawImage(campaignImg, 0, 0, offscreen.width, offscreen.height);
      ctx.globalAlpha = 1.0;
      ctx.save();
      ctx.translate(centerX + x, centerY + y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(userImg, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();
    }

    const displayCtx = display.getContext('2d', { alpha: true });
    if (displayCtx) {
      displayCtx.clearRect(0, 0, display.width, display.height);
      displayCtx.drawImage(offscreen, 0, 0);
    }
  }, [adjustments, campaign, isInteracting]);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      renderPreview();
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [renderPreview]);

  useEffect(() => {
    if (!slug || !session) return;
    campaignSession.setAdjustments(slug, adjustments);
  }, [adjustments, slug, session, campaignSession]);

  const handleWheel = useCallback((e) => {
    if (!userPhoto) return;
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setAdjustments(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(10, prev.scale + delta))
    }));
  }, [userPhoto]);

  const getPointerDistance = (p1, p2) => {
    const dx = p2.clientX - p1.clientX;
    const dy = p2.clientY - p1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getPointerAngle = (p1, p2) => {
    const dx = p2.clientX - p1.clientX;
    const dy = p2.clientY - p1.clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const handlePointerDown = (e) => {
    if (!userPhoto) return;
    e.preventDefault();
    
    setIsInteracting(true);
    
    pointersRef.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
      button: e.button
    });

    if (pointersRef.current.size === 2) {
      const pointers = Array.from(pointersRef.current.values());
      lastPinchDistanceRef.current = getPointerDistance(pointers[0], pointers[1]);
      lastRotationAngleRef.current = getPointerAngle(pointers[0], pointers[1]);
      isDraggingRef.current = false;
    } else if (pointersRef.current.size === 1) {
      if (e.button === 2 || e.shiftKey) {
        isRotatingRef.current = true;
        rotationStartRef.current = e.clientX;
      } else {
        isDraggingRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const handlePointerMove = (e) => {
    e.preventDefault();
    
    if (!pointersRef.current.has(e.pointerId)) return;
    
    pointersRef.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
      button: e.button
    });

    if (pointersRef.current.size === 2) {
      const pointers = Array.from(pointersRef.current.values());
      const currentDistance = getPointerDistance(pointers[0], pointers[1]);
      const currentAngle = getPointerAngle(pointers[0], pointers[1]);

      if (lastPinchDistanceRef.current !== null) {
        const scaleDelta = (currentDistance - lastPinchDistanceRef.current) * 0.01;
        setAdjustments(prev => ({
          ...prev,
          scale: Math.max(0.1, Math.min(10, prev.scale + scaleDelta))
        }));
      }

      if (lastRotationAngleRef.current !== null) {
        const angleDelta = currentAngle - lastRotationAngleRef.current;
        setAdjustments(prev => ({
          ...prev,
          rotation: ((prev.rotation || 0) + angleDelta) % 360
        }));
      }

      lastPinchDistanceRef.current = currentDistance;
      lastRotationAngleRef.current = currentAngle;
      
    } else if (pointersRef.current.size === 1) {
      if (isRotatingRef.current) {
        const deltaX = e.clientX - rotationStartRef.current;
        const rotationDelta = deltaX * 0.5;
        setAdjustments(prev => ({
          ...prev,
          rotation: ((prev.rotation || 0) + rotationDelta) % 360
        }));
        rotationStartRef.current = e.clientX;
      } else if (isDraggingRef.current) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const deltaX = (e.clientX - dragStartRef.current.x) * scaleX;
        const deltaY = (e.clientY - dragStartRef.current.y) * scaleY;
        
        setAdjustments(prev => ({ ...prev, x: prev.x + deltaX, y: prev.y + deltaY }));
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const handlePointerUp = (e) => {
    pointersRef.current.delete(e.pointerId);
    
    if (pointersRef.current.size < 2) {
      lastPinchDistanceRef.current = null;
      lastRotationAngleRef.current = null;
    }
    
    if (pointersRef.current.size === 0) {
      isDraggingRef.current = false;
      isRotatingRef.current = false;
      setIsInteracting(false);
    }
  };

  const handleZoomChange = (e) => {
    const scale = parseFloat(e.target.value);
    setAdjustments(prev => ({ ...prev, scale }));
  };

  const handleRotationChange = (e) => {
    const rotation = parseInt(e.target.value);
    setAdjustments(prev => ({ ...prev, rotation }));
  };

  const handleChangePhoto = () => {
    router.push(`/campaign/${slug}`);
  };

  const handleDownload = async () => {
    if (!userPhoto || !campaign) return;
    
    setDownloading(true);
    setError('');
    
    try {
      const { blob } = await composeImages(
        userPhoto,
        getCampaignPreview(campaign.imageUrl),
        adjustments,
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
      
      try {
        await fetch('/api/campaigns/track-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: campaign.id })
        });
      } catch (trackError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to track download:', trackError);
        }
      }
      
      campaignSession.markDownloaded(slug);
      router.push(`/campaign/${slug}/result`);
    } catch (error) {
      console.error('Error downloading image:', error);
      setError('Failed to download image. Please try again.');
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session || !campaign || !userPhoto) {
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
              <CampaignStepIndicator currentStep={2} />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Adjust Your Photo</h1>
            </div>
            
            <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm">
              
              {error && (
                <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-6 p-4 sm:p-6">
                
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900">Preview</h2>
                  
                  <div className="relative bg-gray-100 rounded-lg border-2 border-gray-300">
                    <canvas
                      ref={(el) => {
                        canvasRef.current = el;
                        if (el && campaign) {
                          initializeCanvas();
                        }
                      }}
                      className="w-full h-auto cursor-move"
                      style={{
                        touchAction: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        display: 'block',
                        minHeight: '300px'
                      }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      onWheel={handleWheel}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>

                </div>

                <div className="space-y-5">
                  
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Transform</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Zoom
                          </label>
                          <span className="text-sm text-gray-600">{adjustments.scale.toFixed(1)}x</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAdjustments(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.1) }))}
                            className="btn-base btn-neutral flex-shrink-0 w-8 h-8 rounded-lg"
                            aria-label="Zoom out"
                          >
                            −
                          </button>
                          <input
                            type="range"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={adjustments.scale}
                            onChange={handleZoomChange}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                          <button
                            onClick={() => setAdjustments(prev => ({ ...prev, scale: Math.min(10, prev.scale + 0.1) }))}
                            className="btn-base btn-neutral flex-shrink-0 w-8 h-8 rounded-lg"
                            aria-label="Zoom in"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Rotation
                          </label>
                          <span className="text-sm text-gray-600">{(adjustments.rotation || 0).toFixed(1)}°</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAdjustments(prev => ({ ...prev, rotation: Math.max(-180, (prev.rotation || 0) - 0.1) }))}
                            className="btn-base btn-neutral flex-shrink-0 w-8 h-8 rounded-lg"
                            aria-label="Rotate counter-clockwise"
                          >
                            −
                          </button>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="0.1"
                            value={adjustments.rotation || 0}
                            onChange={handleRotationChange}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                          <button
                            onClick={() => setAdjustments(prev => ({ ...prev, rotation: Math.min(180, (prev.rotation || 0) + 0.1) }))}
                            className="btn-base btn-neutral flex-shrink-0 w-8 h-8 rounded-lg"
                            aria-label="Rotate clockwise"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePhoto}
                    className="btn-base btn-neutral w-full py-2 text-sm"
                  >
                    Change Photo
                  </button>

                  <div className="pt-3 border-t border-gray-200">
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className={`btn-base w-full py-4 font-bold text-lg transition-colors ${
                        downloading
                          ? 'btn-primary opacity-70 cursor-wait'
                          : 'btn-primary'
                      }`}
                    >
                      {downloading ? 'Downloading...' : 'Download Image'}
                    </button>
                    
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
