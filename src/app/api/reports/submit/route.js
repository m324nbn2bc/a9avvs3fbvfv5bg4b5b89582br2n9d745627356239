import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebaseAdmin';
import { sendInAppNotification } from '@/utils/notifications/sendInAppNotification';
import { getNotificationTemplate } from '@/utils/notifications/notificationTemplates';
import { checkReportRateLimit } from '@/utils/reportRateLimit';

export async function POST(request) {
  try {
    const body = await request.json();
    
    const { campaignId, campaignSlug, reportedBy, reason } = body;
    
    // Validate required fields
    if (!campaignId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID and reason are required' },
        { status: 400 }
      );
    }
    
    // Validate reason is one of the allowed values
    const validReasons = ['inappropriate', 'spam', 'copyright', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report reason' },
        { status: 400 }
      );
    }
    
    // Check rate limit and duplicate reports (pass userId to prevent authenticated bypass)
    const rateLimitCheck = await checkReportRateLimit(request, campaignId, 'campaign', reportedBy);
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
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const summaryId = `campaign-${campaignId}`;
    const summaryRef = db.collection('reportSummary').doc(summaryId);
    
    let shouldNotify = false;
    let notificationData = null;
    
    await db.runTransaction(async (transaction) => {
      // ALL READS MUST COME FIRST (Firestore requirement)
      const campaignDoc = await transaction.get(campaignRef);
      const summaryDoc = await transaction.get(summaryRef);
      
      if (!campaignDoc.exists) {
        throw new Error('Campaign not found');
      }
      
      const campaignData = campaignDoc.data();
      const currentReportsCount = campaignData.reportsCount || 0;
      
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
      
      // Update campaign
      const campaignUpdates = {
        reportsCount: newReportsCount,
        updatedAt: new Date(),
      };
      
      // Auto-flag for review based on report count thresholds
      // 1-2 reports: under-review (visible but flagged)
      // 3+ reports: under-review-hidden (hidden from public)
      if (newReportsCount >= 1 && newReportsCount <= 2 && campaignData.moderationStatus === 'active') {
        campaignUpdates.moderationStatus = 'under-review';
        
        // Flag for notification after transaction
        shouldNotify = true;
        notificationData = {
          userId: campaignData.creatorId,
          campaignTitle: campaignData.title || 'Your campaign',
          campaignId,
          reason,
          notificationType: 'under-review'
        };
      } else if (newReportsCount >= 3 && (campaignData.moderationStatus === 'active' || campaignData.moderationStatus === 'under-review')) {
        campaignUpdates.moderationStatus = 'under-review-hidden';
        campaignUpdates.hiddenAt = new Date();
        
        // Flag for notification after transaction
        shouldNotify = true;
        notificationData = {
          userId: campaignData.creatorId,
          campaignTitle: campaignData.title || 'Your campaign',
          campaignId,
          reason,
          notificationType: 'under-review-hidden'
        };
      }
      
      transaction.update(campaignRef, campaignUpdates);
      
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
        
        // Sync moderation status based on report count
        if (newReportsCount >= 1 && newReportsCount <= 2 && campaignData.moderationStatus === 'active') {
          summaryUpdates.moderationStatus = 'under-review';
        } else if (newReportsCount >= 3 && (campaignData.moderationStatus === 'active' || campaignData.moderationStatus === 'under-review')) {
          summaryUpdates.moderationStatus = 'under-review-hidden';
          summaryUpdates.hiddenAt = now;
        }
        
        // Always refresh cached display data
        summaryUpdates.campaignTitle = campaignData.title || currentSummary.campaignTitle;
        summaryUpdates.campaignImage = campaignData.imageUrl || currentSummary.campaignImage;
        
        transaction.update(summaryRef, summaryUpdates);
      } else {
        // Create new summary
        transaction.set(summaryRef, {
          targetId: campaignId,
          targetType: 'campaign',
          reportsCount: 1,
          reasonCounts: { [reason]: 1 },
          firstReportedAt: now,
          lastReportedAt: now,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          // Display data for quick access
          campaignTitle: campaignData.title || 'Untitled Campaign',
          campaignImage: campaignData.imageUrl || '',
          campaignSlug: campaignData.slug || '',
          campaignType: campaignData.type || '',
          creatorId: campaignData.creatorId || '',
          moderationStatus: campaignData.moderationStatus || 'active',
        });
      }
    });
    
    // Send notification AFTER transaction completes
    if (shouldNotify && notificationData) {
      // Choose notification template based on status
      const templateType = notificationData.notificationType === 'under-review' 
        ? 'campaignUnderReview' 
        : 'campaignUnderReview'; // Using same template for now
      
      const notification = getNotificationTemplate(templateType, {
        campaignTitle: notificationData.campaignTitle
      });
      
      await sendInAppNotification({
        userId: notificationData.userId,
        title: notification.title,
        body: notification.body,
        actionUrl: notification.actionUrl,
        icon: notification.icon,
        type: notification.type || 'campaign-under-review',
        metadata: {
          campaignId: notificationData.campaignId,
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
    console.error('Error creating report:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to submit report. Please try again.' 
      },
      { status: 500 }
    );
  }
}
