export const notificationTemplates = {
  campaignUnderReview: ({ campaignTitle }) => ({
    title: '⚠️ Campaign Under Review',
    body: `Your campaign "${campaignTitle}" has been flagged by users and is now under review. We'll notify you of the outcome.`,
    actionUrl: '/profile',
    icon: '/icon-192x192.png',
    type: 'campaign-under-review',
  }),

  campaignRemoved: ({ campaignTitle, appealDeadline, removalReason }) => ({
    title: '🚫 Campaign Removed',
    body: `Your campaign "${campaignTitle}" has been removed for: ${removalReason}. You can appeal this decision until ${appealDeadline}.`,
    actionUrl: '/profile',
    icon: '/icon-192x192.png',
    type: 'campaign-removed',
  }),

  campaignRestored: ({ campaignTitle }) => ({
    title: '✅ Campaign Restored',
    body: `Good news! Your campaign "${campaignTitle}" has been reviewed and restored.`,
    actionUrl: '/profile',
    icon: '/icon-192x192.png',
    type: 'campaign-restored',
  }),

  warningIssued: ({ reason }) => ({
    title: '⚠️ Warning Issued',
    body: `You've received a warning for: ${reason}. Please review our community guidelines.`,
    actionUrl: '/profile',
    icon: '/icon-192x192.png',
    type: 'warning',
  }),

  profileUnderReview: () => ({
    title: '⚠️ Profile Under Review',
    body: 'Your profile has been flagged by users and is now under review. We\'ll notify you of the outcome.',
    actionUrl: '/profile',
    icon: '/icon-192x192.png',
    type: 'profile-under-review',
  }),

  accountBanned: ({ banReason, appealDeadline }) => ({
    title: '🚫 Account Banned',
    body: `Your account has been banned for: ${banReason}. You can appeal until ${appealDeadline}.`,
    actionUrl: '/profile',
    icon: '/icon-192x192.png',
    type: 'account-banned',
  }),

  profileRestored: () => ({
    title: '✅ Profile Restored',
    body: 'Good news! Your profile has been reviewed and restored.',
    actionUrl: '/profile',
    icon: '/icon-192x192.png',
    type: 'profile-restored',
  }),

  appealDeadlineReminder: ({ daysLeft, type }) => ({
    title: '⏰ Appeal Deadline Reminder',
    body: `You have ${daysLeft} days left to appeal your ${type} removal. Don't miss the deadline!`,
    actionUrl: '/profile',
    icon: '/icon-192x192.png',
    type: 'appeal-deadline-reminder',
  }),

  appealSubmitted: () => ({
    title: '✅ Appeal Submitted',
    body: 'Your appeal has been submitted and is under review. You will be notified of the outcome.',
    actionUrl: '/profile/notifications',
    icon: '/icon-192x192.png',
    type: 'appeal-submitted',
  }),

  appealApproved: ({ type }) => ({
    title: '✅ Appeal Approved',
    body: `Your appeal for ${type} removal has been approved and restored.`,
    actionUrl: '/profile',
    icon: '/icon-192x192.png',
    type: 'appeal-approved',
  }),

  appealRejected: ({ type }) => ({
    title: '❌ Appeal Rejected',
    body: `Your appeal for ${type} removal has been reviewed and rejected.`,
    actionUrl: '/profile',
    icon: '/icon-192x192.png',
    type: 'appeal-rejected',
  }),

  campaignPermanentlyRemoved: ({ campaignTitle }) => ({
    title: '🚫 Campaign Permanently Removed',
    body: `Your campaign "${campaignTitle}" has been permanently removed. The 30-day appeal window has expired.`,
    actionUrl: '/profile',
    icon: '/icon-192x192.png',
    type: 'campaign-permanently-removed',
  }),

  accountPermanentlyBanned: () => ({
    title: '🚫 Account Permanently Banned',
    body: 'Your account has been permanently banned. The 30-day appeal window has expired.',
    actionUrl: '/banned',
    icon: '/icon-192x192.png',
    type: 'account-permanently-banned',
  }),
};

export function getNotificationTemplate(type, params = {}) {
  const template = notificationTemplates[type];
  
  if (!template) {
    console.error(`Notification template not found: ${type}`);
    return {
      title: 'Notification',
      body: 'You have a new notification',
      actionUrl: '/',
      icon: '/icon-192x192.png',
    };
  }

  return typeof template === 'function' ? template(params) : template;
}
