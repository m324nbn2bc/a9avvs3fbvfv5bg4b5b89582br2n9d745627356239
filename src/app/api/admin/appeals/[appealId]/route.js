import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendInAppNotification } from '@/utils/notifications/sendInAppNotification';
import { logAdminAction } from '@/utils/logAdminAction';
import { validateCampaignTransition, validateAccountTransition } from '@/utils/admin/statusTransitionValidator';

export async function PATCH(request, { params }) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const { appealId } = params;
    const body = await request.json();
    const { action, adminNotes } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const appealRef = adminDb.collection('appeals').doc(appealId);
    const appealDoc = await appealRef.get();

    if (!appealDoc.exists()) {
      return NextResponse.json({ success: false, error: 'Appeal not found' }, { status: 404 });
    }

    const appealData = appealDoc.data();

    if (appealData.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'This appeal has already been reviewed' },
        { status: 400 }
      );
    }

    const adminUid = adminCheck.user.uid;
    const adminEmail = adminCheck.user.email || 'admin';
    
    // Get admin user data for complete audit trail
    const adminUserDoc = await adminDb.collection('users').doc(adminUid).get();
    const adminUserData = adminUserDoc.exists ? adminUserDoc.data() : null;
    const adminName = adminUserData?.displayName || adminUserData?.username || adminEmail;
    
    const now = new Date();

    if (action === 'approve') {
      if (appealData.type === 'campaign') {
        const campaignRef = adminDb.collection('campaigns').doc(appealData.targetId);
        const campaignDoc = await campaignRef.get();

        if (campaignDoc.exists()) {
          const campaignData = campaignDoc.data();
          const currentStatus = campaignData.moderationStatus || 'active';
          
          // Validate transition to active
          const validation = validateCampaignTransition(currentStatus, 'active');
          if (!validation.valid) {
            return NextResponse.json(
              { success: false, error: validation.error },
              { status: 400 }
            );
          }
          
          await campaignRef.update({
            moderationStatus: 'active',
            removedAt: null,
            removalReason: null,
            appealDeadline: null,
            reportsCount: 0,
            hiddenAt: null,
            updatedAt: now,
          });


          await sendInAppNotification(appealData.userId, {
            type: 'appealApproved',
            title: '✅ Appeal Approved',
            message: `Your appeal for campaign "${campaignData.title}" has been approved and your campaign has been restored.`,
            actionUrl: `/campaign/${campaignData.slug}`,
            actionLabel: 'View Campaign',
          });

          await logAdminAction({
            adminId: adminUid,
            adminEmail: adminEmail,
            adminName: adminName,
            action: 'appeal_approved',
            targetType: 'campaign',
            targetId: appealData.targetId,
            reason: `Approved appeal: ${appealData.reason.substring(0, 100)}`,
            notes: adminNotes || 'Appeal approved',
          });
        }
      } else {
        const userRef = adminDb.collection('users').doc(appealData.targetId);
        const userDoc = await userRef.get();

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentStatus = userData.accountStatus || 'active';
          
          // Validate transition to active
          const validation = validateAccountTransition(currentStatus, 'active');
          if (!validation.valid) {
            return NextResponse.json(
              { success: false, error: validation.error },
              { status: 400 }
            );
          }
          
          await userRef.update({
            accountStatus: 'active',
            bannedAt: null,
            banReason: null,
            appealDeadline: null,
            reportsCount: 0,
            hiddenAt: null,
            updatedAt: now,
          });


          await sendInAppNotification(appealData.userId, {
            type: 'appealApproved',
            title: '✅ Appeal Approved',
            message: 'Your appeal has been approved and your account has been restored. Welcome back!',
            actionUrl: '/profile',
            actionLabel: 'View Profile',
          });

          await logAdminAction({
            adminId: adminUid,
            adminEmail: adminEmail,
            adminName: adminName,
            action: 'appeal_approved',
            targetType: 'user',
            targetId: appealData.targetId,
            reason: `Approved appeal: ${appealData.reason.substring(0, 100)}`,
            notes: adminNotes || 'Appeal approved',
          });
        }
      }
    } else {
      if (appealData.type === 'campaign') {
        const campaignRef = adminDb.collection('campaigns').doc(appealData.targetId);
        const campaignDoc = await campaignRef.get();

        if (campaignDoc.exists()) {
          const campaignData = campaignDoc.data();
          const currentStatus = campaignData.moderationStatus || 'active';
          
          // Validate transition to removed-permanent
          const validation = validateCampaignTransition(currentStatus, 'removed-permanent');
          if (!validation.valid) {
            return NextResponse.json(
              { success: false, error: validation.error },
              { status: 400 }
            );
          }
          
          await campaignRef.update({
            moderationStatus: 'removed-permanent',
            appealDeadline: null,
            updatedAt: now,
          });


          await sendInAppNotification(appealData.userId, {
            type: 'appealRejected',
            title: '❌ Appeal Rejected',
            message: `Your appeal for campaign "${campaignData.title}" has been reviewed and rejected. The removal is now permanent.`,
            actionUrl: '/profile',
            actionLabel: 'View Profile',
          });

          await logAdminAction({
            adminId: adminUid,
            adminEmail: adminEmail,
            adminName: adminName,
            action: 'appeal_rejected',
            targetType: 'campaign',
            targetId: appealData.targetId,
            reason: `Rejected appeal: ${appealData.reason.substring(0, 100)}`,
            notes: adminNotes || 'Appeal rejected',
          });
        }
      } else {
        const userRef = adminDb.collection('users').doc(appealData.targetId);
        const userDoc = await userRef.get();

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentStatus = userData.accountStatus || 'active';
          
          // Validate transition to banned-permanent
          const validation = validateAccountTransition(currentStatus, 'banned-permanent');
          if (!validation.valid) {
            return NextResponse.json(
              { success: false, error: validation.error },
              { status: 400 }
            );
          }
          
          await userRef.update({
            accountStatus: 'banned-permanent',
            appealDeadline: null,
            updatedAt: now,
          });

          await sendInAppNotification(appealData.userId, {
            type: 'appealRejected',
            title: '❌ Appeal Rejected',
            message: 'Your appeal has been reviewed and rejected. Your account ban is now permanent.',
            actionUrl: '/profile',
            actionLabel: 'View Profile',
          });

          await logAdminAction({
            adminId: adminUid,
            adminEmail: adminEmail,
            adminName: adminName,
            action: 'appeal_rejected',
            targetType: 'user',
            targetId: appealData.targetId,
            reason: `Rejected appeal: ${appealData.reason.substring(0, 100)}`,
            notes: adminNotes || 'Appeal rejected',
          });
        }
      }
    }

    await appealRef.update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedAt: now,
      reviewedBy: adminUid,
      adminNotes: adminNotes || null,
    });

    return NextResponse.json({
      success: true,
      message: `Appeal ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error processing appeal:', error);
    return NextResponse.json(
      { error: 'Failed to process appeal', details: error.message },
      { status: 500 }
    );
  }
}
