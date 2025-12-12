import { adminFirestore } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  return 'unknown';
}

export async function checkReportRateLimit(request, targetId, targetType, userId = null) {
  const db = adminFirestore();
  const clientIP = getClientIP(request);
  
  if (clientIP === 'unknown') {
    return {
      allowed: true,
      reason: null
    };
  }
  
  const ipHash = hashIP(clientIP);
  const rateLimitRef = db.collection('reportRateLimits').doc(ipHash);
  
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      
      let reports = [];
      
      if (doc.exists) {
        const data = doc.data();
        reports = data.reports || [];
        
        // Self-cleaning: If ALL reports are older than 24 hours, delete the entire document
        const allReportsExpired = reports.every(report => report.timestamp < oneDayAgo);
        if (allReportsExpired) {
          transaction.delete(rateLimitRef);
          return {
            allowed: true,
            reason: null
          };
        }
        
        // Filter out reports older than 24 hours (keep recent ones)
        reports = reports.filter(report => report.timestamp > oneDayAgo);
      }
      
      const reportsInLastHour = reports.filter(r => r.timestamp > oneHourAgo);
      
      // Check IP-based rate limit (5 reports per hour)
      if (reportsInLastHour.length >= 5) {
        return {
          allowed: false,
          reason: 'rate_limit_exceeded',
          message: 'You have submitted too many reports. Please try again later.'
        };
      }
      
      // Check IP-based duplicate
      const duplicateReportByIP = reports.find(
        r => r.targetId === targetId && r.targetType === targetType
      );
      
      if (duplicateReportByIP) {
        return {
          allowed: false,
          reason: 'duplicate_report',
          message: 'You have already reported this content.'
        };
      }
      
      // ISSUE #9 FIX: Check user-based duplicate for authenticated users
      // Prevents bypass by changing networks
      if (userId && userId !== 'anonymous') {
        const duplicateReportByUser = reports.find(
          r => r.targetId === targetId && r.targetType === targetType && r.userId === userId
        );
        
        if (duplicateReportByUser) {
          return {
            allowed: false,
            reason: 'duplicate_report',
            message: 'You have already reported this content.'
          };
        }
      }
      
      // Add new report with userId tracking
      reports.push({
        targetId,
        targetType,
        timestamp: now,
        userId: userId || null // Track userId for authenticated users
      });
      
      // Save updated reports with self-cleaning (no TTL needed)
      transaction.set(rateLimitRef, {
        reports,
        lastUpdated: new Date(),
        ipHash
      }, { merge: true });
      
      return {
        allowed: true,
        reason: null
      };
    });
    
    return result;
    
  } catch (error) {
    console.error('Rate limit check error:', error);
    
    return {
      allowed: true,
      reason: null
    };
  }
}
