import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendInAppNotification } from '@/utils/notifications/sendInAppNotification';
import { getNotificationTemplate } from '@/utils/notifications/notificationTemplates';
import { logAdminAction } from '@/utils/logAdminAction';
import { validateCampaignTransition, validateAccountTransition } from '@/utils/admin/statusTransitionValidator';

export async function PATCH(request, { params }) {
  try {
    const adminUser = await requireAdmin(request);
    
    const { summaryId } = params;
    const { status, action, reason } = await request.json();
    
    if (!summaryId || !status || !action) {
      return NextResponse.json(
        { success: false, error: 'Summary ID, status, and action are required' },
        { status: 400 }
      );
    }
    
    // Validate reason is provided for warned and removed actions
    if ((action === 'warned' || action === 'removed') && !reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required for warnings and removals' },
        { status: 400 }
      );
    }
    
    const db = adminFirestore();
    const summaryRef = db.collection('reportSummary').doc(summaryId);
    
    // Get the summary
    const summaryDoc = await summaryRef.get();
    
    if (!summaryDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Summary not found' },
        { status: 404 }
      );
    }
    
    const summaryData = summaryDoc.data();
    const { targetId, targetType } = summaryData;
    
    // Validate targetType
    if (targetType !== 'campaign' && targetType !== 'user') {
      return NextResponse.json(
        { success: false, error: `Invalid target type: ${targetType}. Must be 'campaign' or 'user'` },
        { status: 400 }
      );
    }
    
    // Track if campaign/user was previously hidden (for notification logic)
    let wasHidden = false;
    let targetNotFound = false;
    
    // Use transaction to update everything atomically
    await db.runTransaction(async (transaction) => {
      const targetRef = targetType === 'campaign' 
        ? db.collection('campaigns').doc(targetId)
        : db.collection('users').doc(targetId);
      
      const targetDoc = await transaction.get(targetRef);
      
      if (!targetDoc.exists) {
        targetNotFound = true;
        throw new Error(`TARGET_NOT_FOUND:${targetType}`);
      }
      
      const targetData = targetDoc.data();
      const now = new Date();
      
      // Get current status for validation
      const currentStatus = targetType === 'campaign' 
        ? (targetData.moderationStatus || 'active')
        : (targetData.accountStatus || 'active');
      
      // Determine new status based on action
      let newStatus;
      if (action === 'no-action') {
        newStatus = 'active';
      } else if (action === 'warned') {
        newStatus = 'active';
      } else if (action === 'removed') {
        newStatus = targetType === 'campaign' ? 'removed-temporary' : 'banned-temporary';
      }
      
      // Validate status transition
      const validation = targetType === 'campaign'
        ? validateCampaignTransition(currentStatus, newStatus)
        : validateAccountTransition(currentStatus, newStatus);
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Check if it was previously hidden (auto-hidden at 3+ reports for campaigns, 10+ for users)
      // For campaigns: check moderationStatus === 'under-review-hidden'
      // For users: check accountStatus === 'under-review-hidden'
      if (targetType === 'campaign') {
        wasHidden = targetData.moderationStatus === 'under-review-hidden' || targetData.moderationStatus === 'under-review';
      } else {
        wasHidden = targetData.accountStatus === 'under-review-hidden' || targetData.accountStatus === 'under-review';
      }
      
      // Update the target based on action - ALWAYS reset reportsCount to 0
      const targetUpdates = {
        reportsCount: 0,
        updatedAt: now,
      };
      
      if (action === 'no-action') {
        // Dismiss - restore to active and clear all moderation fields
        if (targetType === 'campaign') {
          targetUpdates.moderationStatus = 'active';
        } else {
          targetUpdates.accountStatus = 'active';
        }
        targetUpdates.hiddenAt = FieldValue.delete();
        targetUpdates.bannedAt = FieldValue.delete();
        targetUpdates.banReason = FieldValue.delete();
        targetUpdates.appealDeadline = FieldValue.delete();
      } else if (action === 'warned') {
        // Warning issued - create warning record and restore to active
        // Rationale: Warning is a "slap on the wrist" - content reviewed but not severe enough for removal
        // If content deserves to be hidden, admin should use "Remove/Ban" instead
        const warningRef = db.collection('warnings').doc();
        transaction.set(warningRef, {
          userId: targetType === 'campaign' ? targetData.creatorId : targetId,
          targetType,
          targetId,
          reportId: summaryId,
          reason: reason, // Use admin-selected reason
          issuedBy: adminUser.uid,
          issuedByEmail: adminUser.email,
          issuedByName: adminUser.displayName || adminUser.username || adminUser.email,
          issuedAt: now,
          acknowledged: false,
        });
        
        // Restore to active after warning (admin reviewed and decided it's not severe enough)
        if (targetType === 'campaign') {
          targetUpdates.moderationStatus = 'active';
        } else {
          targetUpdates.accountStatus = 'active';
        }
        targetUpdates.hiddenAt = FieldValue.delete();
        targetUpdates.bannedAt = FieldValue.delete();
        targetUpdates.banReason = FieldValue.delete();
        targetUpdates.appealDeadline = FieldValue.delete();
      } else if (action === 'removed') {
        // Remove/Ban - use moderationStatus for campaigns, accountStatus for users
        if (targetType === 'campaign') {
          targetUpdates.moderationStatus = 'removed-temporary';
          targetUpdates.appealCount = 0;
        } else {
          targetUpdates.accountStatus = 'banned-temporary';
        }
        targetUpdates.bannedAt = now;
        targetUpdates.banReason = reason; // Use admin-selected reason
        targetUpdates.appealDeadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      }
      
      transaction.update(targetRef, targetUpdates);
      
      // Update summary - reset reportsCount and reasonCounts to 0
      // Also update cached status and display fields to keep them fresh
      const summaryUpdates = {
        status: action === 'no-action' ? 'dismissed' : 'resolved',
        reportsCount: 0,
        reasonCounts: {},
        updatedAt: now,
      };
      
      // Sync cached status fields (moderationStatus for campaigns, accountStatus for users)
      if (targetType === 'campaign') {
        summaryUpdates.moderationStatus = targetUpdates.moderationStatus || targetData.moderationStatus;
      } else {
        summaryUpdates.accountStatus = targetUpdates.accountStatus || targetData.accountStatus;
      }
      
      // Update cached display data
      if (targetType === 'campaign') {
        summaryUpdates.campaignTitle = targetData.title || summaryData.campaignTitle;
        summaryUpdates.campaignImage = targetData.imageUrl || summaryData.campaignImage;
      } else {
        summaryUpdates.displayName = targetData.displayName || summaryData.displayName;
        summaryUpdates.username = targetData.username || summaryData.username;
        summaryUpdates.profileImage = targetData.profileImage || summaryData.profileImage;
      }
      
      transaction.update(summaryRef, summaryUpdates);
    });
    
    // Log admin action after transaction completes
    const actionMap = {
      'no-action': 'dismissed',
      'warned': 'warned',
      'removed': 'removed'
    };
    
    await logAdminAction({
      adminId: adminUser.uid,
      adminEmail: adminUser.email,
      adminName: adminUser.displayName || adminUser.username || adminUser.email,
      action: actionMap[action] || action,
      targetType,
      targetId,
      targetTitle: targetType === 'campaign' ? summaryData.campaignTitle : summaryData.displayName || summaryData.username,
      reason: reason || null,
      summaryId,
      additionalData: {
        previousStatus: targetType === 'campaign' ? summaryData.moderationStatus : summaryData.accountStatus,
        reportsCount: summaryData.reportsCount || 0
      }
    });
    
    // Send notification after transaction completes
    try {
      const userId = targetType === 'campaign' ? summaryData.creatorId : targetId;
      
      if (action === 'no-action') {
        // Only send "restored" notification if it was previously hidden (at 3+ reports)
        // No notification needed if campaign was never auto-hidden
        if (wasHidden) {
          const notification = getNotificationTemplate(
            targetType === 'campaign' ? 'campaignRestored' : 'profileRestored',
            { campaignTitle: summaryData.campaignTitle }
          );
          
          await sendInAppNotification({
            userId,
            title: notification.title,
            body: notification.body,
            actionUrl: notification.actionUrl,
            icon: notification.icon,
            type: notification.type,
          });
          
          // Send unban email if user was previously banned
          if (targetType === 'user' && (summaryData.accountStatus === 'banned-temporary' || summaryData.accountStatus === 'banned-permanent')) {
            const { sendEmail } = await import('@/utils/notifications/sendEmail');
            const { getEmailTemplate } = await import('@/utils/notifications/emailTemplates');
            
            // Get user email from database
            const userDoc = await db.collection('users').doc(targetId).get();
            const userData = userDoc.data();
            
            if (userData?.email) {
              const emailTemplate = getEmailTemplate('accountUnbanned', {
                userEmail: userData.email,
                username: userData.displayName || userData.username || userData.email,
              });
              
              await sendEmail({
                to: userData.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
              });
              
              if (process.env.NODE_ENV === 'development') {
                console.log('[REPORT UNBAN] Unban email sent to:', userData.email);
              }
            }
          }
        }
      } else if (action === 'warned') {
        const notification = getNotificationTemplate('warningIssued', { 
          reason: reason
        });
        
        await sendInAppNotification({
          userId,
          title: notification.title,
          body: notification.body,
          actionUrl: notification.actionUrl,
          icon: notification.icon,
          type: notification.type,
        });
      } else if (action === 'removed') {
        const appealDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const formattedDeadline = appealDeadline.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        if (targetType === 'user') {
          // For BANNED USERS: Send EMAIL instead of in-app notification
          // Banned users cannot access their account, so email is the only way to reach them
          const { sendEmail } = await import('@/utils/notifications/sendEmail');
          const { getEmailTemplate } = await import('@/utils/notifications/emailTemplates');
          
          // Get user email from database
          const userDoc = await db.collection('users').doc(targetId).get();
          const userData = userDoc.data();
          
          if (userData?.email) {
            const emailTemplate = getEmailTemplate('accountBanned', {
              userEmail: userData.email,
              username: userData.displayName || userData.username || userData.email,
              banReason: reason,
              appealDeadline: formattedDeadline,
              isPermanent: false, // From reports, it's always temporary ban
            });
            
            await sendEmail({
              to: userData.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
            });
            
            if (process.env.NODE_ENV === 'development') {
              console.log('[REPORT BAN] Ban email sent to:', userData.email);
            }
          }
        } else {
          // For CAMPAIGN REMOVALS: Keep in-app notification (creator can still log in)
          const notification = getNotificationTemplate('campaignRemoved', { 
            campaignTitle: summaryData.campaignTitle, 
            appealDeadline: formattedDeadline, 
            removalReason: reason 
          });
          
          await sendInAppNotification({
            userId,
            title: notification.title,
            body: notification.body,
            actionUrl: notification.actionUrl,
            icon: notification.icon,
            type: notification.type,
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'no-action' ? 'dismissed' : action === 'warned' ? 'warned' : 'removed'} ${targetType}`,
    });
  } catch (error) {
    console.error('Error updating grouped reports:', error);
    
    if (error.message.includes('Unauthorized') || error.message.includes('Admin access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    
    if (error.message.startsWith('TARGET_NOT_FOUND:')) {
      const targetType = error.message.split(':')[1];
      return NextResponse.json(
        { success: false, error: `${targetType} not found - may have been deleted` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update reports' },
      { status: 500 }
    );
  }
}
