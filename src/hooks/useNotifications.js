"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase-optimized';

// Helper to get dismissed notifications from localStorage
const getDismissedNotifications = () => {
  if (typeof window === 'undefined') return [];
  try {
    const dismissed = localStorage.getItem('dismissedNotifications');
    return dismissed ? JSON.parse(dismissed) : [];
  } catch {
    return [];
  }
};

// Helper to save dismissed notification to localStorage
const addDismissedNotification = (notificationId) => {
  if (typeof window === 'undefined') return;
  try {
    const dismissed = getDismissedNotifications();
    if (!dismissed.includes(notificationId)) {
      dismissed.push(notificationId);
      // Keep only last 100 dismissed notifications to prevent localStorage bloat
      const recent = dismissed.slice(-100);
      localStorage.setItem('dismissedNotifications', JSON.stringify(recent));
    }
  } catch (error) {
    console.error('Error saving dismissed notification:', error);
  }
};

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastNotificationIdRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      lastNotificationIdRef.current = null;
      isInitialLoadRef.current = true;
      return;
    }

    const notificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter(n => !n.read).length);
      
      // Get dismissed notifications from localStorage
      const dismissedIds = getDismissedNotifications();
      
      // Find the latest unread notification that hasn't been dismissed
      const latestUnread = notificationsList.find(n => !n.read && !dismissedIds.includes(n.id));
      
      // On the very first load, just record the latest notification ID without showing toast
      if (isInitialLoadRef.current) {
        if (latestUnread) {
          lastNotificationIdRef.current = latestUnread.id;
        }
        isInitialLoadRef.current = false;
      } else if (latestUnread && latestUnread.id !== lastNotificationIdRef.current) {
        // This is a truly NEW notification (arrived after initial load)
        lastNotificationIdRef.current = latestUnread.id;
        setLatestNotification(latestUnread);
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ read: true }),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }, [user]);

  const clearLatestNotification = useCallback((notificationId) => {
    if (notificationId) {
      // Mark this notification as dismissed so it won't show again on refresh
      addDismissedNotification(notificationId);
    }
    setLatestNotification(null);
  }, []);

  return {
    notifications,
    unreadCount,
    latestNotification,
    loading,
    markAsRead,
    deleteNotification,
    clearLatestNotification,
  };
}
