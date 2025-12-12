"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CampaignSessionContext = createContext(null);

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function CampaignSessionProvider({ children }) {
  const [sessions, setSessions] = useState({});

  // Load sessions from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadedSessions = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('campaign_session_')) {
        try {
          const data = sessionStorage.getItem(key);
          const session = JSON.parse(data);
          
          // Check if session is expired
          if (Date.now() - session.timestamp <= TWENTY_FOUR_HOURS) {
            const slug = key.replace('campaign_session_', '');
            loadedSessions[slug] = session;
          } else {
            // Remove expired session
            sessionStorage.removeItem(key);
          }
        } catch (error) {
          console.error('Error loading session:', error);
          sessionStorage.removeItem(key);
        }
      }
    }
    
    setSessions(loadedSessions);
  }, []);

  // Get session for specific campaign
  const getSession = useCallback((slug) => {
    if (!slug) return null;
    return sessions[slug] || null;
  }, [sessions]);

  // Update session for specific campaign
  const updateSession = useCallback((slug, updates) => {
    if (!slug) return;
    
    setSessions(prev => {
      const currentSession = prev[slug] || {
        sessionId: Math.random().toString(36).substring(2, 15),
        campaignSlug: slug,
        timestamp: Date.now()
      };
      
      const newSession = {
        ...currentSession,
        ...updates,
        timestamp: currentSession.timestamp // Keep original timestamp
      };
      
      // Save to sessionStorage
      try {
        const key = `campaign_session_${slug}`;
        sessionStorage.setItem(key, JSON.stringify(newSession));
      } catch (error) {
        console.error('Error saving session:', error);
      }
      
      return {
        ...prev,
        [slug]: newSession
      };
    });
  }, []);

  // Clear session for specific campaign
  const clearSession = useCallback((slug) => {
    if (!slug) return;
    
    setSessions(prev => {
      const { [slug]: removed, ...rest } = prev;
      
      // Remove from sessionStorage
      try {
        const key = `campaign_session_${slug}`;
        sessionStorage.removeItem(key);
      } catch (error) {
        console.error('Error clearing session:', error);
      }
      
      return rest;
    });
  }, []);

  // Check if session is expired
  const isSessionExpired = useCallback((slug) => {
    const session = getSession(slug);
    if (!session) return true;
    
    return Date.now() - session.timestamp > TWENTY_FOUR_HOURS;
  }, [getSession]);

  // Set user photo
  const setUserPhoto = useCallback((slug, file, preview) => {
    updateSession(slug, {
      userPhoto: file ? { name: file.name, size: file.size, type: file.type } : null,
      userPhotoPreview: preview
    });
  }, [updateSession]);

  // Set adjustments
  const setAdjustments = useCallback((slug, adjustments) => {
    updateSession(slug, { adjustments });
  }, [updateSession]);

  // Mark as downloaded
  const markDownloaded = useCallback((slug) => {
    updateSession(slug, { downloaded: true, downloadedAt: Date.now() });
  }, [updateSession]);

  // Set campaign data
  const setCampaignData = useCallback((slug, campaignData) => {
    updateSession(slug, { campaignData });
  }, [updateSession]);

  // Set creator data
  const setCreatorData = useCallback((slug, creatorData) => {
    updateSession(slug, { creatorData });
  }, [updateSession]);

  const value = {
    getSession,
    updateSession,
    clearSession,
    isSessionExpired,
    setUserPhoto,
    setAdjustments,
    markDownloaded,
    setCampaignData,
    setCreatorData
  };

  return (
    <CampaignSessionContext.Provider value={value}>
      {children}
    </CampaignSessionContext.Provider>
  );
}

export function useCampaignSession() {
  const context = useContext(CampaignSessionContext);
  if (!context) {
    throw new Error('useCampaignSession must be used within CampaignSessionProvider');
  }
  return context;
}
