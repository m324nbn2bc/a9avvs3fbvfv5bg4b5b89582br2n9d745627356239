"use client";

// Provider component to make Firebase context available to Firestore operations
import { createContext, useContext } from 'react';
import { useFirebaseOptimized as useFirebase } from '../lib/firebase-optimized';

const FirestoreContext = createContext(null);

export function FirestoreProvider({ children }) {
  const firebase = useFirebase();
  
  return (
    <FirestoreContext.Provider value={firebase}>
      {children}
    </FirestoreContext.Provider>
  );
}

export const useFirestore = () => {
  const context = useContext(FirestoreContext);
  if (!context) {
    throw new Error('useFirestore must be used within a FirestoreProvider');
  }
  return context;
};