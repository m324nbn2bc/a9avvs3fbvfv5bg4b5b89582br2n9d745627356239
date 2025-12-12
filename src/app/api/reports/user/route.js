import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebaseAdmin';
import { sendInAppNotification } from '@/utils/notifications/sendInAppNotification';
import { getNotificationTemplate } from '@/utils/notifications/notificationTemplates';
import { checkReportRateLimit } from '@/utils/reportRateLimit';

export async function POST(request) {
  try {
    const body = await request.json();
    
    const { reportedUserId, reportedUsername, reportedBy, reason } = body;
    
    // Validate required fields
    if (!reportedUserId || !reason) {
      return NextResponse.json(
        { success: false, error: 'User ID and reason are required' },
        { status: 400 }
      );
    }
    
    // Validate reason is one of the allowed values for profile reports
    const validReasons = [
      'inappropriate_avatar',
      'offensive_username',
      'spam_bio',
      'impersonation',
      'other'
    ];
    
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report reason' },
        { status: 400 }
      );
    }
    
    // Check rate limit and duplicate reports (pass userId to prevent authenticated bypass)
    const rateLimitCheck = await checkReportRateLimit(request, reportedUserId, 'user', reportedBy);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitCheck.message,
          reason: rateLimitCheck.reason
        },
        { status: 429 }
      );
    }
    
    // Get Firestore instance
    const db = adminFirestore();
    
    // Use Firestore transaction for atomic operations
    const userRef = db.collection('users').doc(reportedUserId);
    const summaryId = `user-${reportedUserId}`;
    const summaryRef = db.collection('reportSummary').doc(summaryId);
    
    let shouldNotify = false;
    let notificationData = null;
    
    await db.runTransaction(async (transaction) => {
      // ALL READS MUST COME FIRST (Firestore requirement)
      const userDoc = await transaction.get(userRef);
      const summaryDoc = await transaction.get(summaryRef);
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const currentReportsCount = userData.reportsCount || 0;
      
      // Update or create report summary with reason counts
      const now = new Date();
      
      let newReportsCount;
      let isResettingCounts = false;
      
      if (summaryDoc.exists) {
        const currentSummary = summaryDoc.data();
        
        // If previously resolved/dismissed, reset BOTH counters to start fresh
        if (currentSummary.status === 'resolved' || currentSummary.status === 'dismissed') {
          newReportsCount = 1;
          isResettingCounts = true;
        } else {
          // Still pending, increment counter
          newReportsCount = currentReportsCount + 1;
        }
      } else {
        // New summary, start at 1
        newReportsCount = 1;
      }
      
      // Update user moderation fields
      const userUpdates = {
        reportsCount: newReportsCount,
        updatedAt: new Date(),
      };
      
      // Initialize account status fields if they don't exist
      if (!userData.accountStatus) {
        userUpdates.accountStatus = 'active';
      }
      
      // Auto-flag for review based on report count thresholds
      // 1-9 reports: under-review (visible but flagged)
      // 10+ reports: under-review-hidden (profile hidden)
      if (newReportsCount >= 1 && newReportsCount <= 9 && userData.accountStatus === 'active') {
        userUpdates.accountStatus = 'under-review';
        
        // Flag for notification after transaction
        shouldNotify = true;
        notificationData = {
          userId: reportedUserId,
          reason,
          notificationType: 'under-review'
        };
      } else if (newReportsCount >= 10 && (userData.accountStatus === 'active' || userData.accountStatus === 'under-review')) {
        userUpdates.accountStatus = 'under-review-hidden';
        userUpdates.hiddenAt = new Date();
        
        // Flag for notification after transaction
        shouldNotify = true;
        notificationData = {
          userId: reportedUserId,
          reason,
          notificationType: 'under-review-hidden'
        };
      }
      
      transaction.update(userRef, userUpdates);
      
      if (summaryDoc.exists) {
        // Update existing summary
        const currentSummary = summaryDoc.data();
        const summaryUpdates = {
          lastReportedAt: now,
          updatedAt: now,
        };
        
        // If previously resolved/dismissed, reset counter and status to start fresh
        if (isResettingCounts) {
          summaryUpdates.status = 'pending';
          summaryUpdates.reportsCount = 1;
          summaryUpdates.firstReportedAt = now;
          summaryUpdates.reasonCounts = { [reason]: 1 };
        } else {
          // Still pending, increment counter and reason count
          summaryUpdates.reportsCount = (currentSummary.reportsCount || 0) + 1;
          
          // Increment reason count
          const currentReasonCounts = currentSummary.reasonCounts || {};
          summaryUpdates.reasonCounts = {
            ...currentReasonCounts,
            [reason]: (currentReasonCounts[reason] || 0) + 1
          };
        }
        
        // Sync account status based on report count
        if (newReportsCount >= 1 && newReportsCount <= 9 && userData.accountStatus === 'active') {
          summaryUpdates.accountStatus = 'under-review';
        } else if (newReportsCount >= 10 && (userData.accountStatus === 'active' || userData.accountStatus === 'under-review')) {
          summaryUpdates.accountStatus = 'under-review-hidden';
          summaryUpdates.hiddenAt = now;
        }
        
        // Always refresh cached display data
        summaryUpdates.displayName = userData.displayName || currentSummary.displayName;
        summaryUpdates.username = userData.username || currentSummary.username;
        summaryUpdates.profileImage = userData.profileImage || currentSummary.profileImage;
        
        transaction.update(summaryRef, summaryUpdates);
      } else {
        // Create new summary
        transaction.set(summaryRef, {
          targetId: reportedUserId,
          targetType: 'user',
          reportsCount: 1,
          reasonCounts: { [reason]: 1 },
          firstReportedAt: now,
          lastReportedAt: now,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          // Display data for quick access
          username: userData.username || '',
          displayName: userData.displayName || '',
          profileImage: userData.profileImage || '',
          accountStatus: userData.accountStatus || 'active',
        });
      }
    });
    
    // Send notification AFTER transaction completes
    if (shouldNotify && notificationData) {
      // Choose notification template based on status
      const templateType = notificationData.notificationType === 'under-review' 
        ? 'profileUnderReview' 
        : 'profileUnderReview'; // Using same template for now
      
      const notification = getNotificationTemplate(templateType);
      
      await sendInAppNotification({
        userId: notificationData.userId,
        title: notification.title,
        body: notification.body,
        actionUrl: notification.actionUrl,
        icon: notification.icon,
        type: notification.type || 'profile-under-review',
        metadata: {
          reportedUserId: notificationData.userId,
          reason: notificationData.reason,
          notificationType: notificationData.notificationType
        }
      }).catch(err => console.error('Failed to send notification:', err));
    }
    
    return NextResponse.json(
      { success: true, message: 'Report submitted successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error creating user report:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to submit report. Please try again.' 
      },
      { status: 500 }
    );
  }
}
