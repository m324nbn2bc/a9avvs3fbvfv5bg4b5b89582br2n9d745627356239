import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAdminAction } from '@/utils/logAdminAction';
import { sendInAppNotification } from '@/utils/notifications/sendInAppNotification';
import { sendEmail } from '@/utils/notifications/sendEmail';
import { getEmailTemplate } from '@/utils/notifications/emailTemplates';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    let campaignsProcessed = 0;
    let usersProcessed = 0;
    const errors = [];

    const campaignsSnapshot = await adminDb
      .collection('campaigns')
      .where('moderationStatus', '==', 'removed-temporary')
      .get();

    for (const doc of campaignsSnapshot.docs) {
      try {
        const campaign = doc.data();
        
        // Validate campaign fields
        const campaignTitle = campaign.title || `Campaign ${doc.id}`;
        
        // Safely handle appealDeadline conversion
        if (campaign.appealDeadline) {
          let deadline;
          try {
            deadline = campaign.appealDeadline.toDate 
              ? campaign.appealDeadline.toDate() 
              : new Date(campaign.appealDeadline);
          } catch (conversionError) {
            console.error(`Invalid appealDeadline format for campaign ${doc.id}:`, conversionError);
            errors.push({ campaignId: doc.id, error: 'Invalid appealDeadline format' });
            continue;
          }
          
          if (deadline < now) {
            await doc.ref.update({
              moderationStatus: 'removed-permanent',
              appealDeadline: FieldValue.delete(),
              appealCount: FieldValue.delete(),
              updatedAt: FieldValue.serverTimestamp(),
            });

            await sendInAppNotification(campaign.creatorId, {
              type: 'campaignPermanentlyRemoved',
              title: '🚫 Campaign Permanently Removed',
              message: `Your campaign "${campaignTitle}" has been permanently removed. The 30-day appeal window has expired.`,
              actionUrl: '/profile',
              actionLabel: 'View Profile',
            });

            await logAdminAction({
              adminId: 'system',
              adminEmail: 'system@twibbonize.com',
              action: 'auto_permanent_removal',
              targetType: 'campaign',
              targetId: doc.id,
              targetTitle: campaignTitle,
              reason: 'Appeal deadline expired - auto-upgraded to permanent removal',
            });

            campaignsProcessed++;
          }
        }
      } catch (error) {
        console.error(`Error processing campaign ${doc.id}:`, error);
        errors.push({ campaignId: doc.id, error: error.message });
      }
    }

    const usersSnapshot = await adminDb
      .collection('users')
      .where('accountStatus', '==', 'banned-temporary')
      .get();

    for (const doc of usersSnapshot.docs) {
      try {
        const user = doc.data();
        
        // Validate user fields
        const username = user.username || user.displayName || `User ${doc.id}`;
        const banReason = user.banReason || 'Community guidelines violation';
        
        // Safely handle appealDeadline conversion
        if (user.appealDeadline) {
          let deadline;
          try {
            deadline = user.appealDeadline.toDate 
              ? user.appealDeadline.toDate() 
              : new Date(user.appealDeadline);
          } catch (conversionError) {
            console.error(`Invalid appealDeadline format for user ${doc.id}:`, conversionError);
            errors.push({ userId: doc.id, error: 'Invalid appealDeadline format' });
            continue;
          }
          
          if (deadline < now) {
            await doc.ref.update({
              accountStatus: 'banned-permanent',
              appealDeadline: FieldValue.delete(),
              updatedAt: FieldValue.serverTimestamp(),
            });

            if (user.email) {
              const emailTemplate = getEmailTemplate('accountBanned', {
                userEmail: user.email,
                username: username,
                banReason: banReason,
                isPermanent: true,
              });

              await sendEmail({
                to: user.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
              });
            }

            await logAdminAction({
              adminId: 'system',
              adminEmail: 'system@twibbonize.com',
              action: 'auto_permanent_ban',
              targetType: 'user',
              targetId: doc.id,
              targetTitle: username,
              reason: 'Appeal deadline expired - auto-upgraded to permanent ban',
            });

            usersProcessed++;
          }
        }
      } catch (error) {
        console.error(`Error processing user ${doc.id}:`, error);
        errors.push({ userId: doc.id, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: {
        campaigns: campaignsProcessed,
        users: usersProcessed,
      },
      errors: errors.length > 0 ? errors : undefined,
      executedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
