// Firebase Admin SDK for server-side authentication and Firestore operations
import 'server-only'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { validateFirebaseServiceKey } from '../utils/validateEnv'

// Check if Firebase Admin is already initialized
let adminApp = null

if (getApps().length === 0) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Validate required environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!projectId) {
    const errorMessage = 'Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable';
    
    if (isProduction) {
      throw new Error(`[PRODUCTION] ${errorMessage}. Please add this variable in Vercel.`);
    }
    
    if (isDevelopment) {
      console.warn(`[DEV WARNING] ${errorMessage}`);
      console.warn('[DEV WARNING] Firebase Admin will not be available.');
    }
    
    throw new Error(errorMessage);
  }

  // Parse and validate service account key
  let credential = null;
  
  if (!serviceAccountKey) {
    const errorMessage = 'Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable';
    
    if (isProduction) {
      throw new Error(`[PRODUCTION] ${errorMessage}. Please add this variable in Vercel.`);
    }
    
    if (isDevelopment) {
      console.warn(`[DEV WARNING] ${errorMessage}`);
      console.warn('[DEV WARNING] Firebase Admin will run with limited functionality (no auth verification).');
    }
  } else {
    // Validate the service account key format
    validateFirebaseServiceKey(serviceAccountKey);
    
    try {
      const parsedKey = JSON.parse(serviceAccountKey);
      credential = cert(parsedKey);
    } catch (error) {
      const errorMessage = `Invalid FIREBASE_SERVICE_ACCOUNT_KEY format: ${error.message}`;
      
      if (isProduction) {
        throw new Error(`[PRODUCTION] ${errorMessage}. Please check the JSON format in Vercel.`);
      }
      
      if (isDevelopment) {
        console.warn(`[DEV WARNING] ${errorMessage}`);
        console.warn('[DEV WARNING] Firebase Admin will run with limited functionality.');
      }
    }
  }

  try {
    const config = {
      projectId,
    };
    
    // Add credential if available
    if (credential) {
      config.credential = credential;
    } else if (isProduction) {
      // In production, credential is required for full functionality
      throw new Error('[PRODUCTION] Firebase Admin credentials are required in production. Please add FIREBASE_SERVICE_ACCOUNT_KEY in Vercel.');
    }
    
    adminApp = initializeApp(config);
    
    if (isDevelopment) {
      console.log(`[DEV] Firebase Admin initialized ${credential ? 'with credentials' : 'without credentials (limited functionality)'}`);
    }
  } catch (error) {
    if (isProduction) {
      // Production: Fail fast
      throw new Error(`[PRODUCTION] Firebase Admin initialization failed: ${error.message}`);
    }
    
    // Development: Log error and attempt fallback
    console.error('[DEV ERROR] Firebase Admin initialization error:', error.message);
    console.warn('[DEV] Attempting fallback initialization without credentials...');
    
    try {
      adminApp = initializeApp({ projectId });
      console.log('[DEV] Fallback initialization successful (limited functionality - no auth verification)');
    } catch (fallbackError) {
      throw new Error(`Firebase Admin initialization completely failed: ${fallbackError.message}`);
    }
  }
} else {
  adminApp = getApps()[0]
}

// Get Auth instance
export const adminAuth = getAuth(adminApp)

// Get Firestore instance
export const adminFirestore = () => getFirestore(adminApp)

// Export adminDb for backward compatibility
export const adminDb = getFirestore(adminApp)

// Helper function to verify ID tokens
export const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    return decodedToken
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[DEV ERROR] Token verification error:', error.message)
    }
    throw new Error('Invalid authentication token')
  }
}

export default adminApp
