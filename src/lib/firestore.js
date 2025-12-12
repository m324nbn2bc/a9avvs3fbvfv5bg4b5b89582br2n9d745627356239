"use client";

// Firestore database operations for the Twibbonize app
import { db } from './firebase-optimized';
import { handleFirebaseError } from '../utils/firebaseErrorHandler';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp,
  updateDoc,
  increment,
  runTransaction,
  writeBatch
} from 'firebase/firestore';


// Get database instance - simplified since we have direct db import
const getDatabase = () => {
  return db;
};

// Generate unique username with max attempts to prevent infinite loops
export const generateUniqueUsername = async (baseUsername, maxAttempts = 100) => {
  let username = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Ensure username is at least 3 characters
  if (username.length < 3) {
    username = username + '123';
  }
  
  // Check if username exists with attempt limit
  let counter = 0;
  let finalUsername = username;
  let attempts = 0;
  
  while (await checkUsernameExists(finalUsername) && attempts < maxAttempts) {
    counter++;
    finalUsername = `${username}${counter}`;
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    // Fallback: use timestamp-based unique identifier
    finalUsername = `${username}${Date.now().toString().slice(-6)}`;

  }
  
  return finalUsername;
};

// Check if username already exists - using usernames collection for atomicity
export const checkUsernameExists = async (username) => {
  const normalizedUsername = username.toLowerCase().trim();
  
  // Check if database is initialized
  if (!db) {
    return true; // Assume exists on error to be safe
  }
  
  try {
    // Check usernames collection for atomicity (maintained for data integrity)
    const usernameDocRef = doc(db, 'usernames', normalizedUsername);
    const usernameDoc = await getDoc(usernameDocRef);
    const exists = usernameDoc.exists();
    
    return exists;
  } catch (error) {
    return true; // Assume exists on error to be safe
  }
};

// Atomic username reservation using usernames collection (maintained for data integrity)
const reserveUsernameAtomically = async (baseUsername, userUid, userProfile) => {
  const maxAttempts = 100;
  let username = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Ensure username is at least 3 characters
  if (username.length < 3) {
    username = username + '123';
  }

  return await runTransaction(db, async (transaction) => {
    let counter = 0;
    let finalUsername = username;
    let attempts = 0;
    
    // Try to find available username atomically using usernames collection
    while (attempts < maxAttempts) {
      const usernameDocRef = doc(db, 'usernames', finalUsername);
      const usernameDoc = await transaction.get(usernameDocRef);
      
      if (!usernameDoc.exists()) {
        // Username is available, reserve it atomically
        transaction.set(usernameDocRef, {
          userId: userUid,
          createdAt: serverTimestamp(),
        });
        
        const userDocRef = doc(db, 'users', userUid);
        transaction.set(userDocRef, {
          ...userProfile,
          username: finalUsername,
        });
        return { success: true, username: finalUsername, docRef: userDocRef };
      }
      
      // Username taken, try next variation
      counter++;
      finalUsername = `${username}${counter}`;
      attempts++;
    }
    
    // Fallback: use timestamp-based unique identifier
    finalUsername = `${username}${Date.now().toString().slice(-6)}`;
    
    const usernameDocRef = doc(db, 'usernames', finalUsername);
    transaction.set(usernameDocRef, {
      userId: userUid,
      createdAt: serverTimestamp(),
    });
    
    const userDocRef = doc(db, 'users', userUid);
    transaction.set(userDocRef, {
      ...userProfile,
      username: finalUsername,
    });
    return { success: true, username: finalUsername, docRef: userDocRef };
  });
};

// User Profile operations with atomic username reservation
export const createUserProfile = async (user) => {
  if (!user) return { success: false, error: 'No user provided' };
  
  const database = getDatabase();
  // Check if Firebase is configured
  if (!database) {

    return { success: false, error: 'Database not available' };
  }
  
  try {
      const userDocRef = doc(database, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      const { displayName, email, photoURL } = user;
      
      // Prepare user profile data
      const userProfile = {
        displayName,
        email,
        photoURL,
        bio: '',
        country: '',
        bannerImage: '',
        profileImage: photoURL || '',
        role: 'user', // Default role for new users (admin role assigned separately)
        supportersCount: 0,
        campaignsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        profileCompleted: false, // Track if user has completed welcome popup
      };
      
      // Generate base username and reserve atomically
      const baseUsername = displayName || email?.split('@')[0] || 'user';
      const result = await reserveUsernameAtomically(baseUsername, user.uid, userProfile);
      
      if (result.success) {
        return { success: true, docRef: result.docRef, username: result.username };
      } else {
        return { success: false, error: 'Failed to reserve username' };
      }
    }
    
    return { success: true, docRef: userDocRef, existing: true };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating user profile:', error);
    }
    const errorResponse = await handleFirebaseError(error, 'firestore', { returnType: 'string' });
    return { success: false, error: errorResponse || 'Failed to complete operation. Please try again.' };
  }
};

export const getUserProfile = async (userId) => {
  if (!userId) {
    return null;
  }
  
  const database = getDatabase();
  // Check if Firebase is configured
  if (!database) {

    return null;
  }
  
  try {
    const userDocRef = doc(database, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Ensure required fields exist with fallbacks
      return { 
        id: userDoc.id, 
        ...userData,
        supportersCount: userData.supportersCount || 0,
        campaignsCount: userData.campaignsCount || 0,
        bio: userData.bio || '',
        profileImage: userData.profileImage || '',
        bannerImage: userData.bannerImage || ''
      };
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

// Get user profile by username (for /[username] route) - using usernames collection for consistency
export const getUserProfileByUsername = async (username) => {
  if (!username || typeof username !== 'string') {
    return null;
  }
  
  // Normalize username
  const normalizedUsername = username.toLowerCase().trim();
  if (!normalizedUsername) {
    return null;
  }
  
  try {
    // Check if database is available
    if (!db) {
      return null;
    }

    // First, resolve username to userId using usernames collection
    const usernameDocRef = doc(db, 'usernames', normalizedUsername);
    const usernameDoc = await getDoc(usernameDocRef);
    
    if (!usernameDoc.exists()) {
      return null;
    }
    
    const { userId } = usernameDoc.data();
    
    // Then fetch user profile using the userId
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    
    // Ensure required fields exist with fallbacks
    return { 
      id: userDoc.id, 
      ...userData,
      supportersCount: userData.supportersCount || 0,
      campaignsCount: userData.campaignsCount || 0,
      bio: userData.bio || '',
      profileImage: userData.profileImage || '',
      bannerImage: userData.bannerImage || ''
    };
  } catch (error) {
    return null;
  }
};

// Update user profile with atomic username reservation
export const updateUserProfile = async (userId, updates) => {
  if (!userId) return { success: false, error: 'No user ID provided' };
  
  // Check if Firebase is configured
  if (!db) {

    return { success: false, error: 'Database not available' };
  }
  
  // Whitelist of safe fields that users can update
  const allowedFields = ['bio', 'bannerImage', 'profileImage', 'displayName', 'country', 'username', 'profileCompleted'];
  
  // Filter updates to only include allowed fields
  const filteredUpdates = {};
  for (const field of allowedFields) {
    if (updates.hasOwnProperty(field)) {
      filteredUpdates[field] = updates[field];
    }
  }
  
  // If no valid fields to update, return early
  if (Object.keys(filteredUpdates).length === 0) {
    return { success: false, error: 'No valid fields to update' };
  }

  try {
    return await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const currentData = userDoc.data();
      
      // If username is being changed, normalize and ensure it's unique atomically
      if (filteredUpdates.username && filteredUpdates.username !== currentData.username) {
        // Normalize username to ensure consistency
        const normalizedUsername = filteredUpdates.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Validate normalized username
        if (normalizedUsername.length < 3) {
          throw new Error('Username must be at least 3 characters long');
        }
        
        // If normalization changed the username, reject to avoid confusion
        if (normalizedUsername !== filteredUpdates.username) {
          throw new Error('Username can only contain lowercase letters and numbers');
        }
        
        // Reserve the new username atomically using usernames collection
        const usernameDocRef = doc(db, 'usernames', normalizedUsername);
        const usernameDoc = await transaction.get(usernameDocRef);
        
        if (usernameDoc.exists()) {
          throw new Error('Username already taken');
        }
        
        // Reserve the new username
        transaction.set(usernameDocRef, {
          userId: userId,
          createdAt: serverTimestamp(),
        });
        
        // Remove old username reservation if it exists
        if (currentData.username) {
          const oldUsernameDocRef = doc(db, 'usernames', currentData.username);
          transaction.delete(oldUsernameDocRef);
        }
        
        // Update the filtered updates with normalized username
        filteredUpdates.username = normalizedUsername;
      }

      // Update the user profile
      transaction.update(userDocRef, {
        ...filteredUpdates,
        updatedAt: serverTimestamp(),
      });
      
      // Sync denormalized creator data to campaigns if displayName, username, or profileImage changed
      const needsCampaignSync = 
        filteredUpdates.displayName !== undefined ||
        filteredUpdates.username !== undefined ||
        filteredUpdates.profileImage !== undefined;
      
      if (needsCampaignSync) {
        // Note: We do campaign sync outside transaction to avoid timeout
        // This is eventually consistent but prevents transaction failures
      }
      
      return { 
        success: true, 
        username: filteredUpdates.username || currentData.username,
        needsCampaignSync: needsCampaignSync,
        syncData: needsCampaignSync ? {
          creatorName: filteredUpdates.displayName ?? currentData.displayName,
          creatorUsername: filteredUpdates.username ?? currentData.username,
          creatorAvatar: filteredUpdates.profileImage ?? currentData.profileImage,
        } : null
      };
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating user profile:', error);
    }
    const errorResponse = await handleFirebaseError(error, 'firestore', { returnType: 'string' });
    return { success: false, error: errorResponse || 'Failed to complete operation. Please try again.' };
  }
};

// Sync denormalized creator data to all user's campaigns (call after profile update)
export const syncCreatorDataToCampaigns = async (userId, syncData) => {
  if (!userId || !syncData || !db) return { success: false, error: 'Missing required data' };
  
  try {
    // Find all campaigns by this user
    const campaignsQuery = query(
      collection(db, 'campaigns'),
      where('creatorId', '==', userId)
    );
    
    const snapshot = await getDocs(campaignsQuery);
    
    if (snapshot.empty) {
      return { success: true, updatedCount: 0 };
    }
    
    // Update each campaign with new creator data
    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.forEach((docSnapshot) => {
      batch.update(docSnapshot.ref, {
        creatorName: syncData.creatorName,
        creatorUsername: syncData.creatorUsername,
        creatorAvatar: syncData.creatorAvatar,
        updatedAt: serverTimestamp(),
      });
      count++;
    });
    
    await batch.commit();
    
    return { success: true, updatedCount: count };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error syncing creator data to campaigns:', error);
    }
    return { success: false, error: 'Failed to sync creator data' };
  }
};

// Get user statistics (returns stored counters for consistency and performance)
export const getUserStats = async (userId) => {
  if (!userId) return { supportersCount: 0, campaignsCount: 0 };
  
  try {
    // Get stored counters from user profile for consistency
    const userProfile = await getUserProfile(userId);
    if (userProfile) {
      return {
        supportersCount: userProfile.supportersCount || 0,
        campaignsCount: userProfile.campaignsCount || 0,
      };
    } else {
      return { supportersCount: 0, campaignsCount: 0 };
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting user stats:', error);
    }
    return { supportersCount: 0, campaignsCount: 0 };
  }
};

// Campaign operations with comprehensive error handling
export const createCampaign = async (campaignData, userId) => {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }
  
  if (!campaignData || typeof campaignData !== 'object') {
    return { success: false, error: 'Campaign data is required' };
  }
  
  // Validate required fields
  const requiredFields = ['type', 'title', 'slug', 'imageUrl'];
  const missingFields = requiredFields.filter(field => !campaignData[field]);
  if (missingFields.length > 0) {
    return { success: false, error: `Missing required fields: ${missingFields.join(', ')}` };
  }
  
  // Validate type is either 'frame' or 'background'
  if (!['frame', 'background'].includes(campaignData.type)) {
    return { success: false, error: 'Type must be either "frame" or "background"' };
  }
  
  try {
    return await runTransaction(db, async (transaction) => {
      // Fetch user data for denormalization (reduces N+1 queries when fetching campaigns)
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userDocRef);
      
      let creatorName = 'Anonymous';
      let creatorUsername = null;
      let creatorAvatar = null;
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        creatorName = userData.displayName || 'Anonymous';
        creatorUsername = userData.username || null;
        creatorAvatar = userData.profileImage || null;
      }
      
      // Create the campaign with explicit schema (no spread operator)
      const campaignRef = doc(collection(db, 'campaigns'));
      const campaignDoc = {
        // Required fields from CAMPAIGN_SYSTEM.md
        type: campaignData.type,                    // "frame" or "background"
        title: campaignData.title,                  // Campaign title
        slug: campaignData.slug,                    // URL-friendly slug
        imageUrl: campaignData.imageUrl,            // Supabase storage URL
        storagePath: campaignData.storagePath,      // Storage path for deletion operations
        creatorId: userId,                          // Renamed from createdBy
        
        // Denormalized creator data (avoids N+1 queries)
        creatorName: creatorName,                   // Creator's display name
        creatorUsername: creatorUsername,           // Creator's username for profile links
        creatorAvatar: creatorAvatar,               // Creator's profile image URL
        
        // Optional metadata fields
        description: campaignData.description || '',
        captionTemplate: campaignData.captionTemplate || '',
        
        // Counter fields (optimized: removed supporters object to reduce document size)
        supportersCount: 0,                         // Total downloads count
        reportsCount: 0,                            // Number of reports received
        
        // Status fields
        moderationStatus: 'active',                 // "active" | "under-review" | "removed"
        isPublic: campaignData.isPublic ?? true,    // Current feature (not in docs)
        
        // Timestamps
        createdAt: serverTimestamp(),               // When campaign was published
        updatedAt: serverTimestamp(),               // Last modification time
        // firstUsedAt - added later when first supporter downloads
      };
      
      transaction.set(campaignRef, campaignDoc);
      
      // Update user's campaign counters atomically (optimized: removed duplicate campaignsCreated field)
      transaction.update(userDocRef, {
        campaignsCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      
      return { success: true, campaignId: campaignRef.id };
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating campaign:', error, { userId, campaignData: { ...campaignData, imageData: '[redacted]' } });
    }
    const errorResponse = await handleFirebaseError(error, 'firestore', { returnType: 'string' });
    return { success: false, error: errorResponse || 'Failed to create campaign. Please try again.' };
  }
};

export const getPublicCampaigns = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'campaigns'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const campaigns = [];
    
    querySnapshot.forEach((doc) => {
      campaigns.push({ id: doc.id, ...doc.data() });
    });
    
    return campaigns;
  } catch (error) {
    return [];
  }
};

/**
 * Get user campaigns with pagination support
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @param {string} options.orderByField - Field to order by (default: 'createdAt')
 * @param {string} options.orderDirection - Order direction (default: 'desc')
 * @param {number} options.page - Page number (1-indexed, default: 1)
 * @param {number} options.pageSize - Number of campaigns per page (default: 10)
 * @returns {Promise<{campaigns: Array, totalCount: number, totalPages: number, currentPage: number}>} Paginated campaigns
 */
export const getUserCampaigns = async (userId, options = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [getUserCampaigns] Starting - userId:', userId);
  }
  
  if (!userId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔍 [getUserCampaigns] No userId provided');
    }
    return { campaigns: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
  
  // Check if database is initialized
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 [getUserCampaigns] Database not initialized (Firebase disabled)');
    }
    return { campaigns: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
  
  const {
    orderByField = 'createdAt',
    orderDirection = 'desc',
    page = 1,
    pageSize = 10
  } = options;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [getUserCampaigns] Query params:', {
      orderByField,
      orderDirection,
      page,
      pageSize,
      collection: 'campaigns',
      field: 'creatorId',
      value: userId
    });
  }
  
  try {
    // Query all user campaigns for count and pagination
    const q = query(
      collection(db, 'campaigns'),
      where('creatorId', '==', userId),
      where('moderationStatus', 'in', ['active', 'under-review']),
      orderBy(orderByField, orderDirection)
    );
    
    const querySnapshot = await getDocs(q);
    const allCampaigns = [];
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getUserCampaigns] Query result - docs count:', querySnapshot.size);
    }
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [getUserCampaigns] Document:', {
          id: doc.id,
          creatorId: data.creatorId,
          title: data.title,
          slug: data.slug,
          imageUrl: data.imageUrl
        });
      }
      
      allCampaigns.push({ 
        id: doc.id,
        slug: data.slug,
        title: data.title,
        type: data.type,
        imageUrl: data.imageUrl,
        supportersCount: data.supportersCount || 0,
        createdAt: data.createdAt,
        description: data.description || '',
        moderationStatus: data.moderationStatus || 'active'
      });
    });
    
    // Calculate pagination
    const totalCount = allCampaigns.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Get paginated slice
    const paginatedCampaigns = allCampaigns.slice(startIndex, endIndex);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getUserCampaigns] Returning campaigns:', paginatedCampaigns.length, 'of', totalCount);
    }
    
    return {
      campaigns: paginatedCampaigns,
      totalCount,
      totalPages,
      currentPage
    };
  } catch (error) {
    console.error('🔍 [getUserCampaigns] Error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    return { campaigns: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
};

/**
 * Get campaign by slug
 * @param {string} slug - Campaign slug from URL
 * @returns {Promise<{campaign: object, creator: object}|null>} Campaign with creator info or null if not found
 */
export const getCampaignBySlug = async (slug) => {
  if (!slug) return null;
  
  // Check if database is initialized
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Database not initialized - cannot get campaign by slug');
    }
    return null;
  }
  
  try {
    // Query campaigns collection by slug
    const q = query(
      collection(db, 'campaigns'),
      where('slug', '==', slug),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const campaignDoc = querySnapshot.docs[0];
    const campaignData = { id: campaignDoc.id, ...campaignDoc.data() };
    
    // Don't show removed or hidden campaigns
    if (campaignData.moderationStatus === 'removed-temporary' || 
        campaignData.moderationStatus === 'removed-permanent' ||
        campaignData.moderationStatus === 'under-review-hidden') {
      return null;
    }
    
    // Fetch creator info
    let creatorData = null;
    if (campaignData.creatorId) {
      try {
        const creatorDocRef = doc(db, 'users', campaignData.creatorId);
        const creatorDoc = await getDoc(creatorDocRef);
        
        if (creatorDoc.exists()) {
          creatorData = { id: creatorDoc.id, ...creatorDoc.data() };
        }
      } catch (creatorError) {
        // Continue without creator info if fetch fails
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch creator info:', creatorError);
        }
      }
    }
    
    return {
      campaign: campaignData,
      creator: creatorData
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting campaign by slug:', error);
    }
    return null;
  }
};

// Complete user profile setup after welcome popup
export const completeUserProfile = async (userId, profileData) => {
  if (!userId || !profileData) return { success: false, error: 'Missing required data' };

  try {
    return await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const currentData = userDoc.data();
      
      // Check if username is being changed and ensure it's unique atomically
      if (profileData.username && profileData.username !== currentData.username) {
        // Normalize username to ensure consistency  
        const normalizedUsername = profileData.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Validate normalized username
        if (normalizedUsername.length < 3) {
          throw new Error('Username must be at least 3 characters long');
        }
        
        // If normalization changed the username, reject to avoid confusion
        if (normalizedUsername !== profileData.username) {
          throw new Error('Username can only contain lowercase letters and numbers');
        }
        
        // Reserve username atomically using usernames collection
        const usernameDocRef = doc(db, 'usernames', normalizedUsername);
        const usernameDoc = await transaction.get(usernameDocRef);
        
        if (usernameDoc.exists()) {
          throw new Error('Username already taken');
        }
        
        // Reserve the new username
        transaction.set(usernameDocRef, {
          userId: userId,
          createdAt: serverTimestamp(),
        });
        
        // Remove old username reservation if it exists
        if (currentData.username) {
          const oldUsernameDocRef = doc(db, 'usernames', currentData.username);
          transaction.delete(oldUsernameDocRef);
        }
        
        // Update profileData with normalized username
        profileData.username = normalizedUsername;
      }

      // Prepare update data
      const updateData = {
        displayName: profileData.displayName || currentData.displayName,
        username: profileData.username || currentData.username,
        country: profileData.country || currentData.country,
        profileCompleted: true,
        updatedAt: serverTimestamp(),
      };

      // Handle bio - include empty string values to support clearing
      if (profileData.hasOwnProperty('bio')) {
        updateData.bio = profileData.bio;
      } else {
        updateData.bio = currentData.bio || '';
      }

      // Handle profile image - include null values to support removals
      if (profileData.hasOwnProperty('profileImage')) {
        updateData.profileImage = profileData.profileImage;
      }

      // Handle banner image - include null values to support removals
      if (profileData.hasOwnProperty('bannerImage')) {
        updateData.bannerImage = profileData.bannerImage;
      }

      transaction.update(userDocRef, updateData);
      
      return { success: true, username: updateData.username };
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error completing user profile:', error);
    }
    const errorResponse = await handleFirebaseError(error, 'firestore', { returnType: 'string' });
    return { success: false, error: errorResponse || 'Failed to complete operation. Please try again.' };
  }
};

// Report operations for campaign moderation
export const createReport = async (reportData) => {
  if (!reportData || typeof reportData !== 'object') {
    return { success: false, error: 'Report data is required' };
  }
  
  // Validate required fields
  const requiredFields = ['campaignId', 'reason'];
  const missingFields = requiredFields.filter(field => !reportData[field]);
  if (missingFields.length > 0) {
    return { success: false, error: `Missing required fields: ${missingFields.join(', ')}` };
  }
  
  // Validate reason is one of the allowed values
  const validReasons = ['inappropriate', 'spam', 'copyright', 'other'];
  if (!validReasons.includes(reportData.reason)) {
    return { success: false, error: 'Invalid report reason' };
  }
  
  try {
    return await runTransaction(db, async (transaction) => {
      // Create the report document
      const reportRef = doc(collection(db, 'reports'));
      const reportDoc = {
        campaignId: reportData.campaignId,
        campaignSlug: reportData.campaignSlug || '',
        reportedBy: reportData.reportedBy || 'anonymous',
        reason: reportData.reason,
        details: reportData.details || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
        action: null,
      };
      
      transaction.set(reportRef, reportDoc);
      
      // Increment the campaign's reportsCount
      const campaignRef = doc(db, 'campaigns', reportData.campaignId);
      const campaignDoc = await transaction.get(campaignRef);
      
      if (!campaignDoc.exists()) {
        throw new Error('Campaign not found');
      }
      
      const currentReportsCount = campaignDoc.data().reportsCount || 0;
      const newReportsCount = currentReportsCount + 1;
      
      const campaignUpdates = {
        reportsCount: increment(1),
        updatedAt: serverTimestamp(),
      };
      
      // Auto-flag for review if threshold reached (3+ reports)
      if (newReportsCount >= 3 && campaignDoc.data().moderationStatus === 'active') {
        campaignUpdates.moderationStatus = 'under-review';
      }
      
      transaction.update(campaignRef, campaignUpdates);
      
      return { success: true, reportId: reportRef.id };
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating report:', error);
    }
    const errorResponse = await handleFirebaseError(error, 'firestore', { returnType: 'string' });
    return { success: false, error: errorResponse || 'Failed to submit report. Please try again.' };
  }
};

// Get all reports (admin only - enforce in component)
export const getReports = async (filterOptions = {}) => {
  if (!db) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Database not initialized - cannot get reports');
    }
    return [];
  }
  
  try {
    let q = collection(db, 'reports');
    const constraints = [];
    
    // Add filters
    if (filterOptions.status) {
      constraints.push(where('status', '==', filterOptions.status));
    }
    
    if (filterOptions.campaignId) {
      constraints.push(where('campaignId', '==', filterOptions.campaignId));
    }
    
    // Always order by creation date (newest first)
    constraints.push(orderBy('createdAt', 'desc'));
    
    // Add limit if specified
    if (filterOptions.limit) {
      constraints.push(limit(filterOptions.limit));
    }
    
    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }
    
    const querySnapshot = await getDocs(q);
    const reports = [];
    
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    
    return reports;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting reports:', error);
    }
    return [];
  }
};

// Get reports for a specific campaign
export const getCampaignReports = async (campaignId, limitCount = 50) => {
  return getReports({ campaignId, limit: limitCount });
};

// Update report status (admin only - enforce in component)
export const updateReportStatus = async (reportId, statusData) => {
  if (!reportId || !statusData) {
    return { success: false, error: 'Report ID and status data are required' };
  }
  
  // Validate status
  const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
  if (statusData.status && !validStatuses.includes(statusData.status)) {
    return { success: false, error: 'Invalid status' };
  }
  
  // Validate action if provided
  const validActions = ['removed', 'warned', 'no-action'];
  if (statusData.action && !validActions.includes(statusData.action)) {
    return { success: false, error: 'Invalid action' };
  }
  
  try {
    const reportRef = doc(db, 'reports', reportId);
    const reportDoc = await getDoc(reportRef);
    
    if (!reportDoc.exists()) {
      return { success: false, error: 'Report not found' };
    }
    
    const updateData = {
      updatedAt: serverTimestamp(),
    };
    
    if (statusData.status) {
      updateData.status = statusData.status;
      updateData.reviewedAt = serverTimestamp();
    }
    
    if (statusData.reviewedBy) {
      updateData.reviewedBy = statusData.reviewedBy;
    }
    
    if (statusData.action) {
      updateData.action = statusData.action;
    }
    
    await updateDoc(reportRef, updateData);
    
    return { success: true };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating report status:', error);
    }
    const errorResponse = await handleFirebaseError(error, 'firestore', { returnType: 'string' });
    return { success: false, error: errorResponse || 'Failed to update report. Please try again.' };
  }
};

// ============================================================================
// REPORT SUMMARY FUNCTIONS (for grouped reporting)
// ============================================================================

/**
 * Create or update report summary for grouped reporting
 * This aggregates reports by campaign or user for efficient admin display
 * @param {object} summaryData - Summary data
 * @returns {Promise<object>} Success response
 */
export const upsertReportSummary = async (summaryData) => {
  if (!db) {
    return { success: false, error: 'Database not initialized' };
  }
  
  try {
    const { targetId, targetType, reportData } = summaryData;
    
    if (!targetId || !targetType) {
      return { success: false, error: 'Target ID and type are required' };
    }
    
    const summaryId = `${targetType}-${targetId}`;
    const summaryRef = doc(db, 'reportSummary', summaryId);
    
    await runTransaction(db, async (transaction) => {
      const summaryDoc = await transaction.get(summaryRef);
      const now = new Date();
      
      if (summaryDoc.exists()) {
        // Update existing summary
        const currentData = summaryDoc.data();
        const updates = {
          lastReportedAt: now,
          updatedAt: now,
        };
        
        // If previously resolved/dismissed, reset counter to start fresh
        if (currentData.status === 'resolved' || currentData.status === 'dismissed') {
          updates.status = 'pending';
          updates.reportsCount = 1;
          updates.firstReportedAt = now;
        } else {
          // Still pending, increment counter
          updates.reportsCount = (currentData.reportsCount || 0) + 1;
        }
        
        transaction.update(summaryRef, updates);
      } else {
        // Create new summary
        const newSummary = {
          targetId,
          targetType,
          reportsCount: 1,
          firstReportedAt: now,
          lastReportedAt: now,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          // Include display data for quick access
          ...reportData,
        };
        
        transaction.set(summaryRef, newSummary);
      }
    });
    
    return { success: true };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error upserting report summary:', error);
    }
    const errorResponse = await handleFirebaseError(error, 'firestore', { returnType: 'string' });
    return { success: false, error: errorResponse || 'Failed to update report summary' };
  }
};

/**
 * Get grouped report summaries with filters and sorting
 * @param {object} options - Query options
 * @returns {Promise<Array>} Array of report summaries
 */
export const getReportSummaries = async (options = {}) => {
  if (!db) {
    return [];
  }
  
  const {
    targetType = 'all',
    status = 'pending',
    sortBy = 'lastReportedAt',
    sortOrder = 'desc',
    limitCount = 10,
  } = options;
  
  try {
    let q = collection(db, 'reportSummary');
    const constraints = [];
    
    // Filter by target type
    if (targetType !== 'all') {
      constraints.push(where('targetType', '==', targetType));
    }
    
    // Filter by status
    if (status !== 'all') {
      constraints.push(where('status', '==', status));
    }
    
    // Add sorting
    constraints.push(orderBy(sortBy, sortOrder));
    constraints.push(limit(limitCount));
    
    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }
    
    const querySnapshot = await getDocs(q);
    const summaries = [];
    
    querySnapshot.forEach((doc) => {
      summaries.push({ id: doc.id, ...doc.data() });
    });
    
    return summaries;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting report summaries:', error);
    }
    return [];
  }
};

/**
 * Update report summary status (when admin takes action)
 * @param {string} summaryId - Summary document ID
 * @param {string} newStatus - New status ('resolved', 'dismissed')
 * @returns {Promise<object>} Success response
 */
export const updateReportSummaryStatus = async (summaryId, newStatus) => {
  if (!db) {
    return { success: false, error: 'Database not initialized' };
  }
  
  try {
    const summaryRef = doc(db, 'reportSummary', summaryId);
    const summaryDoc = await getDoc(summaryRef);
    
    if (!summaryDoc.exists()) {
      return { success: false, error: 'Report summary not found' };
    }
    
    await updateDoc(summaryRef, {
      status: newStatus,
      resolvedAt: newStatus === 'resolved' || newStatus === 'dismissed' ? new Date() : null,
      reportsCount: 0,
      updatedAt: new Date(),
    });
    
    return { success: true };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating report summary status:', error);
    }
    const errorResponse = await handleFirebaseError(error, 'firestore', { returnType: 'string' });
    return { success: false, error: errorResponse || 'Failed to update report summary status' };
  }
};

/**
 * Get all campaigns with optional filters and pagination
 * @param {object} filters - Filter options
 * @param {string} filters.type - Campaign type ('frame', 'background', or 'all')
 * @param {string} filters.country - Filter by creator's country
 * @param {string} filters.timePeriod - Time period ('24h', '7d', '30d', or 'all')
 * @param {string} filters.sortBy - Sort field ('supportersCount' or 'createdAt')
 * @param {number} filters.page - Page number (1-indexed)
 * @param {number} filters.pageSize - Number of campaigns per page (default: 10)
 * @returns {Promise<{campaigns: Array, totalCount: number, totalPages: number, currentPage: number}>} Paginated campaigns with creator info
 */
export const getAllCampaigns = async (filters = {}) => {
  const {
    type = 'all',
    country = null,
    timePeriod = 'all',
    sortBy = 'createdAt',
    page = 1,
    pageSize = 10
  } = filters;
  
  // Check if database is initialized
  if (!db) {
    console.error('Database not initialized - cannot get campaigns');
    return { campaigns: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
  
  try {
    // Calculate time cutoff for filtering
    let timeCutoff = null;
    if (timePeriod !== 'all') {
      const now = new Date();
      switch (timePeriod) {
        case '24h':
          timeCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          timeCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }
    
    // Build query - Only show active campaigns (exclude removed and hidden)
    let constraints = [
      where('moderationStatus', 'in', ['active', 'under-review'])
    ];
    
    // Add type filter
    if (type !== 'all') {
      constraints.push(where('type', '==', type));
    }
    
    // Add time filter
    if (timeCutoff) {
      constraints.push(where('createdAt', '>=', timeCutoff));
    }
    
    // Add sorting
    constraints.push(orderBy(sortBy, 'desc'));
    
    // First, get total count for pagination (fetch all matching docs)
    const countQuery = query(collection(db, 'campaigns'), ...constraints);
    const countSnapshot = await getDocs(countQuery);
    const allCampaigns = [];
    
    // Collect campaigns - use denormalized creator data when available
    const campaignsNeedingCreator = [];
    countSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const campaign = {
        id: docSnapshot.id,
        ...data
      };
      
      // Build creator object from denormalized fields (for new campaigns)
      // or mark for fetching (for old campaigns without denormalized data)
      if (data.creatorName || data.creatorUsername || data.creatorAvatar) {
        campaign.creator = {
          id: data.creatorId,
          displayName: data.creatorName || 'Anonymous',
          username: data.creatorUsername || null,
          profileImage: data.creatorAvatar || null,
        };
      } else if (data.creatorId) {
        campaignsNeedingCreator.push(campaign);
      }
      
      allCampaigns.push(campaign);
    });
    
    // Fetch creators only for old campaigns that don't have denormalized data
    if (campaignsNeedingCreator.length > 0) {
      const creatorIds = [...new Set(campaignsNeedingCreator.map(c => c.creatorId))];
      const creatorsMap = new Map();
      
      const creatorPromises = creatorIds.map(async (creatorId) => {
        try {
          const creatorDocRef = doc(db, 'users', creatorId);
          const creatorDoc = await getDoc(creatorDocRef);
          if (creatorDoc.exists()) {
            return { id: creatorDoc.id, ...creatorDoc.data() };
          }
        } catch (error) {
          console.error('Error fetching creator:', error);
        }
        return null;
      });
      
      const creators = await Promise.all(creatorPromises);
      creators.forEach((creator) => {
        if (creator) {
          creatorsMap.set(creator.id, creator);
        }
      });
      
      // Attach creator data to old campaigns
      campaignsNeedingCreator.forEach((campaign) => {
        campaign.creator = creatorsMap.get(campaign.creatorId) || null;
      });
    }
    
    // Filter by country if specified (country filtering requires full creator data)
    let filteredCampaigns = allCampaigns;
    if (country) {
      filteredCampaigns = allCampaigns.filter((campaign) => {
        return campaign.creator && campaign.creator.country === country;
      });
    }
    
    // Calculate pagination
    const totalCount = filteredCampaigns.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Get paginated slice
    const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);
    
    return {
      campaigns: paginatedCampaigns,
      totalCount,
      totalPages,
      currentPage
    };
  } catch (error) {
    console.error('Error getting campaigns:', error);
    return { campaigns: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
};

/**
 * Get top creators with aggregated stats
 * @param {object} filters - Filter options
 * @param {string} filters.country - Filter by country
 * @param {string} filters.timePeriod - Time period ('24h', '7d', '30d', or 'all')
 * @param {number} filters.limit - Number of creators to return
 * @returns {Promise<Array>} Array of creators with stats
 */
export const getTopCreators = async (filters = {}) => {
  const {
    country = null,
    timePeriod = 'all',
    limit: limitCount = 20
  } = filters;
  
  // Check if database is initialized
  if (!db) {
    console.error('Database not initialized - cannot get top creators');
    return [];
  }
  
  try {
    // Calculate time cutoff for filtering
    let timeCutoff = null;
    if (timePeriod !== 'all') {
      const now = new Date();
      switch (timePeriod) {
        case '24h':
          timeCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          timeCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }
    
    // Build query for campaigns (active campaigns only)
    const campaignsQuery = query(
      collection(db, 'campaigns'),
      where('moderationStatus', '!=', 'removed')
    );
    const campaignsSnapshot = await getDocs(campaignsQuery);
    
    // Aggregate stats by creator
    const creatorStatsMap = new Map();
    
    // Process each campaign
    for (const campaignDoc of campaignsSnapshot.docs) {
      const campaignData = campaignDoc.data();
      const creatorId = campaignData.creatorId;
      
      // Initialize creator stats if not exists
      if (!creatorStatsMap.has(creatorId)) {
        creatorStatsMap.set(creatorId, {
          campaignsCount: 0,
          totalSupports: 0
        });
      }
      
      const stats = creatorStatsMap.get(creatorId);
      
      // Count campaigns created in time period (if time filter applied)
      if (!timeCutoff || (campaignData.createdAt && campaignData.createdAt.toDate() >= timeCutoff)) {
        stats.campaignsCount++;
      }
      
      // Count supports received in time period
      if (timeCutoff) {
        // Query downloads subcollection for this campaign within time period
        const downloadsQuery = query(
          collection(db, 'campaigns', campaignDoc.id, 'downloads'),
          where('downloadedAt', '>=', timeCutoff)
        );
        const downloadsSnapshot = await getDocs(downloadsQuery);
        stats.totalSupports += downloadsSnapshot.size;
      } else {
        // For 'all time', use the main supportersCount
        stats.totalSupports += campaignData.supportersCount || 0;
      }
    }
    
    // Fetch creator profiles
    const creatorIds = Array.from(creatorStatsMap.keys());
    const creatorPromises = creatorIds.map(async (creatorId) => {
      try {
        const creatorDocRef = doc(db, 'users', creatorId);
        const creatorDoc = await getDoc(creatorDocRef);
        
        if (creatorDoc.exists()) {
          const creatorData = { id: creatorDoc.id, ...creatorDoc.data() };
          const stats = creatorStatsMap.get(creatorId);
          
          return {
            ...creatorData,
            campaignsCount: stats.campaignsCount,
            totalSupports: stats.totalSupports
          };
        }
      } catch (error) {
        console.error('Error fetching creator profile:', error);
      }
      return null;
    });
    
    let creators = await Promise.all(creatorPromises);
    creators = creators.filter(creator => creator !== null);
    
    // Filter by country if specified
    if (country) {
      creators = creators.filter(creator => creator.country === country);
    }
    
    // Sort by total supports (descending)
    creators.sort((a, b) => b.totalSupports - a.totalSupports);
    
    // Limit results
    return creators.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting top creators:', error);
    return [];
  }
};

// ==================== ADMIN FUNCTIONS ====================
// Note: Admin role management is handled server-side via API routes
// See: /api/admin/users/[userId]/role for setUserRole implementation
// This ensures admin operations use Firebase Admin SDK and bypass client-side security rules

// ==================== APPEAL FUNCTIONS ====================

export const createAppeal = async (appealData) => {
  try {
    const appealsRef = collection(db, 'appeals');
    const appealDoc = await addDoc(appealsRef, {
      ...appealData,
      status: 'pending',
      submittedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    
    return { success: true, appealId: appealDoc.id };
  } catch (error) {
    console.error('Error creating appeal:', error);
    throw handleFirebaseError(error);
  }
};

export const getAppealsByUser = async (userId) => {
  try {
    const appealsRef = collection(db, 'appeals');
    const q = query(
      appealsRef,
      where('userId', '==', userId),
      orderBy('submittedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const appeals = [];
    
    snapshot.forEach((doc) => {
      appeals.push({ id: doc.id, ...doc.data() });
    });
    
    return appeals;
  } catch (error) {
    console.error('Error getting user appeals:', error);
    return [];
  }
};

export const getAppealById = async (appealId) => {
  try {
    const appealRef = doc(db, 'appeals', appealId);
    const appealDoc = await getDoc(appealRef);
    
    if (!appealDoc.exists()) {
      return null;
    }
    
    return { id: appealDoc.id, ...appealDoc.data() };
  } catch (error) {
    console.error('Error getting appeal:', error);
    return null;
  }
};