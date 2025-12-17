import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { logAdminAction } from '@/utils/logAdminAction';

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
    let usersProcessed = 0;
    let campaignsDeleted = 0;
    const errors = [];
    const deletedUsers = [];

    const usersSnapshot = await adminDb
      .collection('users')
      .where('accountDeletionRequested', '==', true)
      .get();

    for (const userDoc of usersSnapshot.docs) {
      try {
        const user = userDoc.data();
        const userId = userDoc.id;
        
        if (!user.accountDeletionScheduledFor) {
          continue;
        }

        let scheduledDate;
        try {
          scheduledDate = user.accountDeletionScheduledFor.toDate 
            ? user.accountDeletionScheduledFor.toDate() 
            : new Date(user.accountDeletionScheduledFor);
        } catch (conversionError) {
          console.error(`Invalid scheduledFor date for user ${userId}:`, conversionError);
          errors.push({ userId, error: 'Invalid deletion date format' });
          continue;
        }

        if (scheduledDate > now) {
          continue;
        }

        const username = user.username || user.displayName || `User ${userId}`;

        const userCampaignsSnapshot = await adminDb
          .collection('campaigns')
          .where('creatorId', '==', userId)
          .get();

        for (const campaignDoc of userCampaignsSnapshot.docs) {
          try {
            await campaignDoc.ref.delete();
            campaignsDeleted++;
          } catch (campaignError) {
            console.error(`Error deleting campaign ${campaignDoc.id}:`, campaignError);
            errors.push({ userId, campaignId: campaignDoc.id, error: campaignError.message });
          }
        }

        const notificationsSnapshot = await adminDb
          .collection('users')
          .doc(userId)
          .collection('notifications')
          .get();

        for (const notifDoc of notificationsSnapshot.docs) {
          try {
            await notifDoc.ref.delete();
          } catch (notifError) {
            console.error(`Error deleting notification ${notifDoc.id}:`, notifError);
          }
        }

        await userDoc.ref.delete();

        try {
          await adminAuth.deleteUser(userId);
        } catch (authError) {
          if (authError.code !== 'auth/user-not-found') {
            console.error(`Error deleting Firebase Auth user ${userId}:`, authError);
            errors.push({ userId, error: `Auth deletion failed: ${authError.message}` });
          }
        }

        await logAdminAction({
          adminId: 'system',
          adminEmail: 'system@twibbonize.com',
          action: 'account_deleted',
          targetType: 'user',
          targetId: userId,
          targetTitle: username,
          reason: 'Account deletion processed after 30-day grace period',
        });

        deletedUsers.push(userId);
        usersProcessed++;

      } catch (error) {
        console.error(`Error processing user ${userDoc.id}:`, error);
        errors.push({ userId: userDoc.id, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: usersProcessed,
      campaignsDeleted,
      deletedUsers,
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
