"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { countries } from '../../data/countries';
import { useAuth } from '../../hooks/useAuth';
import { getUserProfile, checkUsernameExists, completeUserProfile } from '../../lib/firestore';
import { useOptionalUserProfile } from '../../components/UserProfileProvider';
import ConfirmationModal from '../../components/ConfirmationModal';
import { uploadFile } from '../../lib/supabase';
import { getProfileAvatar, getProfileBanner } from '../../utils/imageTransform';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const profileContext = useOptionalUserProfile();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking', 'available', 'taken', 'unchanged'
  const [originalUsername, setOriginalUsername] = useState('');
  const [userData, setUserData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, field: null, previewField: null, imageType: '' });
  const [leaveConfirmModal, setLeaveConfirmModal] = useState({ isOpen: false, actionType: null, action: null });
  const usernameCheckTimeoutRef = useRef(null);
  const usernameRequestIdRef = useRef(0);
  
  // Form data state
  const [formData, setFormData] = useState({
    username: '',
    displayName: user?.displayName || '',
    country: '',
    profilePic: null,
    profilePicPreview: user?.photoURL || '',
    profileBanner: null,
    profileBannerPreview: '',
    bio: ''
  });

  const profilePicRef = useRef();
  const profileBannerRef = useRef();
  
  // Refs for form validation scrolling
  const usernameRef = useRef();
  const displayNameRef = useRef();
  const countryRef = useRef();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, []);

  // Track initial URL for proper back button handling
  const [currentUrl, setCurrentUrl] = useState('');
  
  useEffect(() => {
    setCurrentUrl(window.location.pathname);
  }, []);

  // Prevent navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    const handlePopState = (e) => {
      if (hasChanges) {
        // Prevent the navigation temporarily
        window.history.pushState(null, '', currentUrl);
        // Show custom confirmation modal
        setLeaveConfirmModal({
          isOpen: true,
          actionType: 'navigation',
          action: () => {
            // User confirmed they want to leave - allow navigation
            setHasChanges(false);
            window.history.back();
          }
        });
      }
    };

    const handleLinkClick = (e) => {
      if (hasChanges) {
        // Check if it's a navigation link
        const target = e.target.closest('a');
        if (target && target.href && target.href !== window.location.href) {
          e.preventDefault();
          // Show custom confirmation modal
          setLeaveConfirmModal({
            isOpen: true,
            actionType: 'link',
            action: () => {
              // User confirmed they want to leave - navigate to the link
              setHasChanges(false);
              window.location.href = target.href;
            }
          });
        }
      }
    };

    if (hasChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      document.addEventListener('click', handleLinkClick, true);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
        document.removeEventListener('click', handleLinkClick, true);
      };
    }
  }, [hasChanges, currentUrl]);

  // Function to check username availability with debouncing
  const checkUsernameAvailability = useCallback(async (username) => {
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }

    // If username is unchanged from original, mark as unchanged
    if (username === originalUsername) {
      setUsernameStatus('unchanged');
      return;
    }

    // Clear existing timeout
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    setUsernameStatus('checking');
    
    // Increment request ID to handle race conditions
    const currentRequestId = ++usernameRequestIdRef.current;

    // Set new timeout for debouncing
    usernameCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const exists = await checkUsernameExists(username);
        
        // Only update if this is still the latest request
        if (currentRequestId === usernameRequestIdRef.current) {
          const newStatus = exists ? 'taken' : 'available';
          setUsernameStatus(newStatus);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error checking username:', error);
        }
        if (currentRequestId === usernameRequestIdRef.current) {
          setUsernameStatus(null); // Show neutral state on error
        }
      }
    }, 500); // 500ms debounce
  }, [originalUsername]);

  // Load user data when component mounts - same as profile/edit page
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          // User has existing profile data, prefill everything
          setUserData(userProfile);
          const initialData = {
            username: userProfile.username || '',
            displayName: userProfile.displayName || user?.displayName || '',
            country: userProfile.country || '',
            profilePic: null,
            profilePicPreview: userProfile.profileImage ? getProfileAvatar(userProfile.profileImage) : (user?.photoURL || ''),
            profileBanner: null,
            profileBannerPreview: userProfile.bannerImage ? getProfileBanner(userProfile.bannerImage) : '',
            bio: userProfile.bio || ''
          };
          setFormData(initialData);
          setInitialFormData(initialData); // Set baseline for change detection
          setOriginalUsername(userProfile.username || '');
          setUsernameStatus('unchanged');
        } else {
          // No existing profile, use auth data as fallback
          const initialUsername = user?.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                                user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                                'user123';
          const initialData = {
            username: initialUsername,
            displayName: user?.displayName || '',
            country: '',
            profilePic: null,
            profilePicPreview: user?.photoURL || '',
            profileBanner: null,
            profileBannerPreview: '',
            bio: ''
          };
          setFormData(initialData);
          setInitialFormData(initialData); // Set baseline for change detection
          // Check if this initial username is available
          checkUsernameAvailability(initialUsername);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading user data:', error);
        }
        // Fallback to auth data
        const fallbackUsername = user?.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                                user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
                                'user123';
        const fallbackData = {
          username: fallbackUsername,
          displayName: user?.displayName || '',
          country: '',
          profilePic: null,
          profilePicPreview: user?.photoURL || '',
          profileBanner: null,
          profileBannerPreview: '',
          bio: ''
        };
        setFormData(fallbackData);
        setInitialFormData(fallbackData); // Set baseline for change detection
        checkUsernameAvailability(fallbackUsername);
      }
    };

    loadUserData();
  }, [user, checkUsernameAvailability]);

  // Track if user has made any edits (not just has content)
  const [userHasEdited, setUserHasEdited] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);

  // Check if form has changes compared to original data
  const checkForChanges = (currentFormData) => {
    if (!initialFormData) {
      setHasChanges(false);
      return;
    }
    
    // Compare with initial form data
    const hasChanged = currentFormData.username !== initialFormData.username ||
                      currentFormData.displayName !== initialFormData.displayName ||
                      currentFormData.country !== initialFormData.country ||
                      currentFormData.profilePicPreview !== initialFormData.profilePicPreview ||
                      currentFormData.profileBannerPreview !== initialFormData.profileBannerPreview ||
                      currentFormData.bio !== initialFormData.bio;
    
    setHasChanges(hasChanged);
  };

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setUserHasEdited(true); // Mark that user has made edits
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Check username availability in real-time
    if (field === 'username') {
      checkUsernameAvailability(value);
    }
    
    // Check for changes
    checkForChanges(newFormData);
  };

  const handleFileChange = (field, file, previewField) => {
    if (!file) return;
    
    // Clear any previous file-related errors
    const fileErrorKey = field === 'profilePic' ? 'profilePic' : 'profileBanner';
    if (errors[fileErrorKey]) {
      setErrors(prev => ({ ...prev, [fileErrorKey]: '' }));
    }
    
    // File size validation (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      const fileName = field === 'profilePic' ? 'Profile picture' : 'Banner image';
      setErrors(prev => ({
        ...prev,
        [fileErrorKey]: `${fileName} must be smaller than 5MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`
      }));
      return;
    }
    
    // File type validation
    if (!file.type.startsWith('image/')) {
      const fileName = field === 'profilePic' ? 'Profile picture' : 'Banner image';
      setErrors(prev => ({
        ...prev,
        [fileErrorKey]: `${fileName} must be an image file (JPG, PNG, GIF, etc.)`
      }));
      return;
    }
    
    // File is valid, proceed with reading
    const reader = new FileReader();
    reader.onload = (e) => {
      const newFormData = {
        ...formData,
        [field]: file,
        [previewField]: e.target.result
      };
      setFormData(newFormData);
      setUserHasEdited(true); // Mark that user has made edits
      // Check for changes
      checkForChanges(newFormData);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (field, previewField) => {
    const imageType = field === 'profilePic' ? 'profile photo' : 'banner';
    setConfirmModal({
      isOpen: true,
      field,
      previewField,
      imageType
    });
  };

  const confirmRemoveImage = () => {
    const { field, previewField } = confirmModal;
    
    const newFormData = {
      ...formData,
      [field]: null,
      [previewField]: ''
    };
    setFormData(newFormData);
    setUserHasEdited(true); // Mark that user has made edits
    
    // Clear the file input value to allow re-uploading the same file
    const inputRef = field === 'profilePic' ? profilePicRef : profileBannerRef;
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    
    // Clear any file-related errors
    const fileErrorKey = field === 'profilePic' ? 'profilePic' : 'profileBanner';
    if (errors[fileErrorKey]) {
      setErrors(prev => ({ ...prev, [fileErrorKey]: '' }));
    }
    
    // Check for changes
    checkForChanges(newFormData);
  };

  const handleLeaveConfirm = () => {
    if (leaveConfirmModal.action) {
      leaveConfirmModal.action();
    }
    setLeaveConfirmModal({ isOpen: false, actionType: null, action: null });
  };

  const handleLeaveCancel = () => {
    setLeaveConfirmModal({ isOpen: false, actionType: null, action: null });
  };

  const scrollToField = (fieldName) => {
    const fieldRefs = {
      username: usernameRef,
      displayName: displayNameRef,
      country: countryRef
    };
    
    const fieldRef = fieldRefs[fieldName];
    if (fieldRef?.current) {
      fieldRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      // Focus the field after scrolling
      setTimeout(() => {
        fieldRef.current.focus();
      }, 300);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let firstErrorField = null;

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      if (!firstErrorField) firstErrorField = 'username';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      if (!firstErrorField) firstErrorField = 'username';
    } else if (!/^[a-z0-9]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain lowercase letters and numbers';
      if (!firstErrorField) firstErrorField = 'username';
    } else if (usernameStatus === 'taken') {
      newErrors.username = 'This username is already taken';
      if (!firstErrorField) firstErrorField = 'username';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
      if (!firstErrorField) firstErrorField = 'displayName';
    }

    if (!formData.country) {
      newErrors.country = 'Please select your country';
      if (!firstErrorField) firstErrorField = 'country';
    }

    setErrors(newErrors);
    
    // If there are errors, scroll to the first error field
    if (firstErrorField) {
      setTimeout(() => scrollToField(firstErrorField), 100);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare profile data
      const profileData = {
        username: formData.username,
        displayName: formData.displayName,
        country: formData.country,
        bio: formData.bio,
      };

      // Handle profile image upload to Supabase
      if (formData.profilePic) {
        // User selected a new profile image - upload to Supabase
        const uploadResult = await uploadFile(formData.profilePic, 'profile-images');
        // Get public URL from Supabase
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${uploadResult.path}`;
        profileData.profileImage = publicUrl;
      } else if (formData.profilePicPreview === '' && (userData?.profileImage || user?.photoURL)) {
        // User removed the image
        profileData.profileImage = null;
      }

      // Handle banner image upload to Supabase
      if (formData.profileBanner) {
        // User selected a new banner image - upload to Supabase
        const uploadResult = await uploadFile(formData.profileBanner, 'profile-images');
        // Get public URL from Supabase
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${uploadResult.path}`;
        profileData.bannerImage = publicUrl;
      } else if (formData.profileBannerPreview === '' && userData?.bannerImage) {
        // User removed the image
        profileData.bannerImage = null;
      }

      const result = await completeUserProfile(user.uid, profileData);
      
      if (result.success) {
        // Clear hasChanges before navigation to prevent warnings
        setHasChanges(false);
        setUserHasEdited(false);
        
        // Refresh the user profile context to update sidebar
        if (profileContext?.refreshUserProfile) {
          await profileContext.refreshUserProfile();
        }
        // Navigate to home page
        router.push('/');
      } else {
        throw new Error(result.error || 'Failed to complete profile');
      }
    } catch (error) {
      console.error('Error completing profile setup:', error);
      setErrors({ general: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };


  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated (redirect will handle this)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      
      <div className="min-h-screen flex">
        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-16 xl:px-20 pt-20">
          <div className="mx-auto w-full max-w-4xl">
            {/* Header */}
            <div className="text-center mb-8 bg-yellow-400 px-6 py-6 rounded-t-xl">
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">Welcome to Frame!</h1>
              <p className="text-base sm:text-lg text-gray-700 mt-2">Let's set up your profile to get started</p>
            </div>
            
            {/* Content Card with Shadow Border */}
            <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 px-6 py-8 shadow-sm">
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Banner - moved to top */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Profile Banner
                  </label>
                  <div className="space-y-3">
                    <div className="w-full aspect-[4/1] rounded-lg overflow-hidden border-2 border-gray-200">
                      {formData.profileBannerPreview ? (
                        <img
                          src={formData.profileBannerPreview}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-emerald-600 flex flex-col items-center justify-center">
                          <svg className="w-12 h-12 text-white/70 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-white/70 text-sm font-medium">Recommended: 800x200px</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={profileBannerRef}
                      onChange={(e) => handleFileChange('profileBanner', e.target.files[0], 'profileBannerPreview')}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => profileBannerRef.current?.click()}
                        className="btn-base btn-secondary px-2 py-1 text-sm"
                      >
                        {formData.profileBannerPreview ? 'Change Banner Photo' : 'Choose Banner Photo'}
                      </button>
                      {formData.profileBannerPreview && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('profileBanner', 'profileBannerPreview')}
                          className="btn-base btn-danger px-2 py-1 text-sm"
                        >
                          Remove Banner
                        </button>
                      )}
                    </div>
                    {errors.profileBanner && (
                      <p className="text-red-600 text-sm mt-1">{errors.profileBanner}</p>
                    )}
                  </div>
                </div>

                {/* Profile Picture */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Profile Picture
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                      {formData.profilePicPreview ? (
                        <img
                          src={formData.profilePicPreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={profilePicRef}
                        onChange={(e) => handleFileChange('profilePic', e.target.files[0], 'profilePicPreview')}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex gap-2 flex-col">
                        <button
                          type="button"
                          onClick={() => profilePicRef.current?.click()}
                          className="btn-base btn-secondary px-2 py-1 text-sm"
                        >
                          {formData.profilePicPreview ? 'Change Photo' : 'Choose Photo'}
                        </button>
                        {formData.profilePicPreview && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage('profilePic', 'profilePicPreview')}
                            className="btn-base btn-danger px-2 py-1 text-sm"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {errors.profilePic && (
                    <p className="text-red-600 text-sm mt-1">{errors.profilePic}</p>
                  )}
                </div>

                {/* Display Name */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Display Name *
                  </label>
                  <input
                    ref={displayNameRef}
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
                      errors.displayName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your name"
                  />
                  <p className="text-sm text-gray-700 mt-1">
                    This appears as your profile name
                  </p>
                  {errors.displayName && <p className="text-red-600 text-sm mt-1">{errors.displayName}</p>}
                </div>

                {/* Username */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Username *
                  </label>
                  <div className="relative">
                    <input
                      ref={usernameRef}
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
                        errors.username ? 'border-red-300 bg-red-50' : 
                        usernameStatus === 'taken' ? 'border-red-300 bg-red-50' :
                        usernameStatus === 'available' ? 'border-emerald-300 bg-emerald-50' :
                        'border-gray-300'
                      }`}
                      placeholder="username"
                    />
                    {/* Username status indicator */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {usernameStatus === 'checking' && (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
                      )}
                      {(usernameStatus === 'available' || usernameStatus === 'unchanged') && (
                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {usernameStatus === 'taken' && (
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    Your profile URL: frame.com/u/{formData.username || 'username'}
                  </p>
                  {/* Username status message */}
                  {usernameStatus === 'taken' && (
                    <p className="text-red-600 text-sm mt-1">This username is already taken</p>
                  )}
                  {usernameStatus === 'available' && formData.username.length >= 3 && (
                    <p className="text-emerald-600 text-sm mt-1">Username is available</p>
                  )}
                  {usernameStatus === 'unchanged' && (
                    <p className="text-gray-600 text-sm mt-1">Current username</p>
                  )}
                  {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username}</p>}
                </div>

                {/* Country */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Country *
                  </label>
                  <select
                    ref={countryRef}
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 cursor-pointer ${
                      errors.country ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select your country</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.country && <p className="text-red-600 text-sm mt-1">{errors.country}</p>}
                </div>

                {/* Bio */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none text-gray-900 placeholder:text-gray-400"
                    rows="4"
                    placeholder="Tell others about yourself..."
                    maxLength="500"
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-sm text-gray-400">{formData.bio.length}/500</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={loading || usernameStatus === 'checking' || !hasChanges}
                  className={`btn-base px-8 py-3 ${
                    !hasChanges 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : loading || usernameStatus === 'checking'
                        ? 'bg-emerald-600 text-white opacity-50 cursor-not-allowed'
                        : 'btn-primary'
                  }`}
                >
                  {loading ? 'Setting up...' : usernameStatus === 'checking' ? 'Checking username...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, field: null, previewField: null, imageType: '' })}
        onConfirm={confirmRemoveImage}
        title="Remove Image"
        message={`Are you sure you want to remove your ${confirmModal.imageType}?`}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
      />

      {/* Leave Confirmation Modal */}
      <ConfirmationModal
        isOpen={leaveConfirmModal.isOpen}
        onClose={handleLeaveCancel}
        onConfirm={handleLeaveConfirm}
        title="Unsaved Changes"
        message="You have unsaved changes. Do you want to save them before leaving?"
        confirmText="Leave Without Saving"
        cancelText="Stay & Keep Changes"
        type="warning"
      />
    </div>
  );
}