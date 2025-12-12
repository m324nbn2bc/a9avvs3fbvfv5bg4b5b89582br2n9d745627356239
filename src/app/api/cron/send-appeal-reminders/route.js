import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { sendEmail } from '@/utils/notifications/sendEmail';
import { getEmailTemplate } from '@/utils/notifications/emailTemplates';
import { sendInAppNotification } from '@/utils/notifications/sendInAppNotification';

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
    const remindersProcessed = {
      campaigns: { day7: 0, day3: 0, day1: 0 },
      users: { day7: 0, day3: 0, day1: 0 },
    };
    const errors = [];

    const reminderDays = [7, 3, 1];

    for (const daysLeft of reminderDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysLeft);
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const campaignsSnapshot = await adminDb
        .collection('campaigns')
        .where('moderationStatus', '==', 'removed-temporary')
        .where('appealDeadline', '>=', targetDate)
        .where('appealDeadline', '<', nextDay)
        .get();

      for (const doc of campaignsSnapshot.docs) {
        try {
          const campaign = doc.data();
          
          // Validate campaign fields
          const campaignTitle = campaign.title || 'Your campaign';
          const removalReason = campaign.removalReason || 'Community guidelines violation';
          
          const creatorDoc = await adminDb.collection('users').doc(campaign.creatorId).get();
          const creator = creatorDoc.data();

          if (creator) {
            // For campaign removals: Send ONLY in-app notification (creator can log in)
            // No email needed - they can see the notification when they log in
            await sendInAppNotification(campaign.creatorId, {
              type: 'appealDeadlineReminder',
              title: '⏰ Appeal Deadline Reminder',
              message: `You have ${daysLeft} day${daysLeft > 1 ? 's' : ''} left to appeal the removal of your campaign "${campaignTitle}". Don't miss the deadline!`,
              actionUrl: '/profile/appeals',
              actionLabel: 'Submit Appeal',
            });

            remindersProcessed.campaigns[`day${daysLeft}`]++;
          }
        } catch (error) {
          console.error(`Error sending reminder for campaign ${doc.id}:`, error);
          errors.push({ campaignId: doc.id, error: error.message });
        }
      }

      const usersSnapshot = await adminDb
        .collection('users')
        .where('accountStatus', '==', 'banned-temporary')
        .where('appealDeadline', '>=', targetDate)
        .where('appealDeadline', '<', nextDay)
        .get();

      for (const doc of usersSnapshot.docs) {
        try {
          const user = doc.data();

          if (user.email) {
            const emailTemplate = getEmailTemplate('appealReminder', {
              userEmail: user.email,
              username: user.username || user.displayName || 'User',
              daysLeft,
              itemType: 'account ban',
              itemName: 'your account',
              removalReason: user.banReason || 'Community guidelines violation',
            });

            await sendEmail({
              to: user.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
            });

            remindersProcessed.users[`day${daysLeft}`]++;
          }
        } catch (error) {
          console.error(`Error sending reminder for user ${doc.id}:`, error);
          errors.push({ userId: doc.id, error: error.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersProcessed,
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
