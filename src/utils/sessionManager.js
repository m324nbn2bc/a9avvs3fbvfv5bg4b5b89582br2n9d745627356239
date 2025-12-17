"use client";

export function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function getDeviceInfo() {
  if (typeof window === 'undefined') return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  
  const ua = navigator.userAgent;
  
  let deviceType = 'Desktop';
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    deviceType = /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Mobile';
  }
  
  let browser = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';
  
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  return { deviceType, browser, os, userAgent: ua };
}

export function getStoredSessionId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sessionId');
}

export function storeSessionId(sessionId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sessionId', sessionId);
}

export function clearSessionId() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sessionId');
}
