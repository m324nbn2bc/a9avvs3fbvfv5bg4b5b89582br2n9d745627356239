"use client";

// Optimized Firebase configuration with static imports for better performance
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { useState, useEffect } from "react";

// Module-level Firebase instances (initialized immediately on client)
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let isInitialized = false;
let isConfigured = false;

// Initialize Firebase immediately at module load (client-side only)
const initializeFirebaseModule = () => {
  // Only run on client
  if (typeof window === "undefined") {
    return;
  }

  // Only initialize once
  if (isInitialized) {
    return;
  }

  try {
    const isProduction = process.env.NODE_ENV === "production";
    const isDevelopment = process.env.NODE_ENV === "development";

    // Check environment variables
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    const messagingSenderId =
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;

    // Validate required environment variables
    const missingVars = [];
    if (!apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
    if (!projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    if (!appId) missingVars.push("NEXT_PUBLIC_FIREBASE_APP_ID");

    if (missingVars.length > 0) {
      const errorMessage = `Missing required Firebase configuration: ${missingVars.join(", ")}`;

      if (isProduction) {
        // Production: Fail fast
        throw new Error(`[PRODUCTION] ${errorMessage}. Please add these environment variables in Vercel.`);
      }

      if (isDevelopment) {
        // Development: Warn clearly
        console.warn(`[DEV WARNING] ${errorMessage}`);
        console.warn("[DEV WARNING] Firebase will not be available. Add these variables in Vercel for production.");
      }

      isInitialized = true;
      isConfigured = false;
      return;
    }

    const firebaseConfig = {
      apiKey,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: `${projectId}.appspot.com`,
      messagingSenderId,
      appId,
    };

    // Initialize Firebase - prevent duplicate initialization
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);

    // using in-app notifications only

    isInitialized = true;
    isConfigured = true;

    if (isDevelopment) {
      console.log("[DEV] Firebase client initialized successfully");
    }
  } catch (error) {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      // Production: Re-throw errors
      throw error;
    }

    // Development: Log error and continue
    console.error("[DEV ERROR] Firebase initialization failed:", error.message);
    isInitialized = true;
    isConfigured = false;
  }
};

// Initialize Firebase immediately when module loads (client-side only)
initializeFirebaseModule();

// Hook to access Firebase instances in React components
export const useFirebaseOptimized = () => {
  const [firebase, setFirebase] = useState({
    app: firebaseApp,
    auth: firebaseAuth,
    db: firebaseDb,
    isLoading: false,
    isConfigured: isConfigured,
  });

  useEffect(() => {
    // Update state with already-initialized instances from module load
    setFirebase({
      app: firebaseApp,
      auth: firebaseAuth,
      db: firebaseDb,
      isLoading: false,
      isConfigured: isConfigured,
    });
  }, []);

  return firebase;
};

// Export Firebase services (now available immediately at module load)
export { firebaseAuth as auth, firebaseDb as db };
export default firebaseApp;
