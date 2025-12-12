"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import { generateSlug } from '../../../../utils/slugGenerator';
import { getCampaignUploadUrl } from '../../../../utils/campaignStorage';
import { createCampaign } from '../../../../lib/firestore';
import CampaignStepIndicator from '../../../../components/CampaignStepIndicator';

export default function CreateBackgroundPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1); // 1 = upload image, 2 = fill details
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const imageInputRef = useRef();

  // Form data state
  const [formData, setFormData] = useState({
    campaignImage: null,
    campaignImagePreview: '',
    title: '',
    description: '',
    captionTemplate: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageSelect = (file) => {
    if (!file) return;

    // Clear previous errors
    setErrors({});

    // File size validation (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors({ campaignImage: `Image must be smaller than 5MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB` });
      return;
    }

    // File type validation
    if (!file.type.startsWith('image/')) {
      setErrors({ campaignImage: 'Please select a valid image file (PNG, JPG, or WEBP)' });
      return;
    }

    // Valid image - show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({
        ...prev,
        campaignImage: file,
        campaignImagePreview: e.target.result
      }));
      // Automatically move to step 2
      setStep(2);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      campaignImage: null,
      campaignImagePreview: ''
    }));
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    setStep(1);
    setErrors({});
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = async () => {
    // Check if user is authenticated
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Validate form
    if (!validateStep2()) return;

    setLoading(true);
    try {
      // Generate slug
      const slug = generateSlug(formData.title);
      const campaignId = slug; // Use slug as campaign ID

      // Get auth token
      const token = await user.getIdToken();

      // Get upload URL from API
      const { uploadUrl, path } = await getCampaignUploadUrl(campaignId, formData.campaignImage.size, formData.campaignImage.type, token);

      // Upload image to Supabase
      await fetch(uploadUrl, {
        method: 'PUT',
        body: formData.campaignImage,
        headers: {
          'Content-Type': formData.campaignImage.type
        }
      });

      // Build image URL
      const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${path}`;

      // Create campaign in Firestore
      const campaignData = {
        type: 'background',
        title: formData.title.trim(),
        description: formData.description.trim(),
        slug: slug,
        storagePath: path,
        imageUrl: imageUrl,
        captionTemplate: formData.captionTemplate.trim()
      };

      const result = await createCampaign(campaignData, user.uid);

      if (result.success) {
        router.push(`/campaign/${slug}`);
      } else {
        throw new Error(result.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setErrors({ general: 'Failed to create campaign. Please try again.' });
      setLoading(false);
    }
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
  };

  const handleSignIn = () => {
    // Redirect to sign in page
    router.push('/signin?redirect=/create/background');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex">
        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-16 xl:px-20 pt-20">
          <div className="mx-auto w-full max-w-4xl">
            {/* Header */}
            <div className="text-center bg-yellow-400 px-6 py-6 rounded-t-xl">
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">Create Background Campaign</h1>
              <p className="text-base sm:text-lg text-gray-700 mt-2">
                Upload a background image for photos to sit on top
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="bg-yellow-400 px-6 pb-4">
              <CampaignStepIndicator
                currentStep={step}
                totalSteps={2}
                labels={['Upload Image', 'Campaign Details']}
              />
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 px-6 py-8 shadow-sm">
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                  {errors.general}
                </div>
              )}

              {/* Step 1: Upload Image */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Background Image *
                    </label>
                    <div className="space-y-3">
                      {/* Upload Area */}
                      <div 
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full h-80 max-w-md mx-auto rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-emerald-500 cursor-pointer transition-colors"
                      >
                        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center p-6">
                          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-gray-600 font-medium mb-1">Click to upload background</p>
                          <p className="text-gray-500 text-sm">PNG, JPG, or WEBP</p>
                          <p className="text-gray-400 text-xs mt-2">Max 5MB • No transparency required</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={(e) => handleImageSelect(e.target.files[0])}
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                      />
                      {errors.campaignImage && (
                        <p className="text-red-600 text-sm text-center">{errors.campaignImage}</p>
                      )}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      What is a background?
                    </h3>
                    <ul className="space-y-1 text-sm text-emerald-800">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 mt-1">•</span>
                        <span>Solid image that appears behind visitor photos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 mt-1">•</span>
                        <span>Visitor photo sits on top of the background</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 mt-1">•</span>
                        <span>Square images recommended but all sizes accepted (no cropping)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 mt-1">•</span>
                        <span>No transparency required</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 2: Fill Details */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Image Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Background Preview
                    </label>
                    <div className="w-full h-80 max-w-md mx-auto rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                      {formData.campaignImagePreview && (
                        <img
                          src={formData.campaignImagePreview}
                          alt="Background preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="flex justify-center mt-3">
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="btn-base btn-secondary px-3 py-1.5 text-sm"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Campaign Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Beautiful Nature Background"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900"
                    />
                    {errors.title && (
                      <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your campaign..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none text-gray-900"
                    />
                  </div>

                  {/* Caption Template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Share Caption Template (optional)
                    </label>
                    <textarea
                      value={formData.captionTemplate}
                      onChange={(e) => handleInputChange('captionTemplate', e.target.value)}
                      placeholder="e.g., Beautiful nature background for my photo! 🌿"
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none text-gray-900"
                    />
                    <p className="text-gray-500 text-xs mt-1">This text will be pre-filled when visitors share their photos</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn-base btn-secondary flex-1 py-3"
                      disabled={loading}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handlePublish}
                      className="btn-base btn-primary flex-1 py-3"
                      disabled={loading}
                    >
                      {loading ? 'Publishing...' : 'Publish Campaign'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleAuthModalClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in to publish</h3>
              <p className="text-gray-600 mb-6">
                You need to sign in to publish your campaign. Your work will be saved.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleAuthModalClose}
                  className="btn-base btn-secondary flex-1"
                >
                  Go Back
                </button>
                <button
                  onClick={handleSignIn}
                  className="btn-base btn-primary flex-1"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
