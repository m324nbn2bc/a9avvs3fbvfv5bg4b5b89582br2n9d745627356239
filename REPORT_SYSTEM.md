# Twibbonize Reporting System

**Last Updated:** October 31, 2025

## Overview
The Twibbonize reporting system allows users to report inappropriate campaigns or user profiles. The system is designed to be efficient, reducing database operations by 95% through an optimized aggregation approach. This document explains how the system works in simple, non-technical terms.

---

## How Users Report Content

### Reporting a Campaign
1. **User clicks "Report" button** on a campaign page
2. **Selects a reason** from dropdown (required):
   - **Inappropriate Content** (API value: `inappropriate`)
   - **Spam** (API value: `spam`)
   - **Copyright Violation** (API value: `copyright`)
   - **Other** (API value: `other`)
3. **Submits the report** (no text field needed - just reason selection)

**API Endpoint:** `POST /api/reports/submit`  
**Required Fields:** `campaignId` (string), `reason` (one of the API values above)  
**Optional Fields:** `reportedBy` (user ID or 'anonymous'), `campaignSlug` (string)

### Reporting a User Profile
1. **User clicks "Report" button** on a user's profile page
2. **Selects a reason** from dropdown (required):
   - **Inappropriate Profile Picture** (API value: `inappropriate_avatar`)
   - **Offensive Username** (API value: `offensive_username`)
   - **Spam in Bio/Description** (API value: `spam_bio`)
   - **Impersonation** (API value: `impersonation`)
   - **Other** (API value: `other`)
3. **Submits the report**

**API Endpoint:** `POST /api/reports/user`  
**Required Fields:** `reportedUserId` (string), `reason` (one of the API values above)  
**Optional Fields:** `reportedBy` (user ID or 'anonymous'), `reportedUsername` (string)

**Rate Limiting:**
- Maximum 5 reports per hour from the same IP address
- Cannot report the same target twice from the same IP address
- Returns error message if limit exceeded: "You have submitted too many reports. Please try again later."
- IP addresses are hashed for privacy before storage

---

## What Happens After a Report is Submitted

### For Campaigns:
1. **Report is counted** - The campaign's report count increases by 1
2. **Reason is tracked** - The specific reason (spam, inappropriate, etc.) is recorded in the report summary
3. **Two synchronized counters updated:**
   - Campaign document: `reportsCount` field increments
   - Report Summary document: `reasonCounts` object increments the specific reason count
   - **Both counters always stay synchronized** - they increment together and reset together
4. **Auto-flag based on report count:**
   - **1-2 reports**: Status changes to `under-review` (flagged for review but still visible to public)
     - **Creator receives notification**: "⚠️ Campaign Under Review - Your campaign has been flagged by users"
   - **3+ reports**: Status changes to `under-review-hidden` (hidden from public)
     - Hidden timestamp recorded
     - **Creator receives notification**: "⚠️ Campaign Hidden - Your campaign has been auto-hidden due to multiple reports"
5. **No reports** - Campaign stays in `active` status, fully visible

### For User Profiles:
1. **Report is counted** - The user's report count increases by 1
2. **Reason is tracked** - The specific reason is recorded
3. **Two synchronized counters updated:**
   - User document: `reportsCount` field increments
   - Report Summary document: `reasonCounts` object increments the specific reason count
   - **Both counters always stay synchronized** - they increment together and reset together
4. **Auto-flag based on report count:**
   - **1-9 reports**: Account status changes to `under-review` (flagged for review but profile still visible)
     - **User receives notification**: "⚠️ Profile Under Review - Your profile has been flagged by users"
   - **10+ reports**: Account status changes to `under-review-hidden` (profile hidden from public)
     - Hidden timestamp recorded
     - **User receives notification**: "⚠️ Profile Hidden - Your profile has been auto-hidden due to multiple reports"
5. **No reports** - User stays in `active` status, profile fully visible

**Counter Synchronization (Fixed October 22, 2025):**
- When a new report comes in AFTER admin has reviewed previous reports (status was 'resolved' or 'dismissed'), the system:
  - Resets BOTH the Report Summary counter AND the campaign/user counter to 1 (starting fresh)
  - Both counters increment together as new reports arrive
  - Both counters reset to 0 together when admin takes action (dismiss/warn/remove)
  - No temporary mismatches - counters are always synchronized

---

## Report Aggregation System

### How It Works:
Instead of storing each individual report as a separate document, the system groups all reports for the same campaign/user into a single **Report Summary** document. This dramatically reduces database operations.

**What's Stored in Report Summary:**
- **targetId** - ID of reported campaign or user
- **targetType** - Either "campaign" or "user"
- **Total report count** (e.g., 15 reports)
- **Reason breakdown with counts** (e.g., `{ spam: 8, inappropriate: 5, copyright: 2 }`)
- **Status** - `pending`, `resolved`, or `dismissed`
- **Timestamps** - `firstReportedAt`, `lastReportedAt`, `createdAt`, `updatedAt`
- **Cached display info** - Campaign title/image or user's name/profile picture for quick display

**Why This Matters:**
- Saves 95% of database operations
- Faster for admins to review
- Cheaper to run at scale
- No need to fetch hundreds of individual reports
- Admin sees percentage breakdown instantly (e.g., "53% spam, 33% inappropriate, 13% copyright")

**Performance Comparison:**

Before optimization (individual reports):
- Report submission: 3 writes per report
- Admin dismiss (100 reports): 102 reads + 103 writes

After optimization (aggregated summaries):
- Report submission: 2 writes per report (33% reduction)
- Admin dismiss (any number): 2 reads + 3 writes (98% reduction)

---

## Admin Dashboard (/admin/reports)

### How Admins Access Reports

Admins visit `/admin/reports` and see a control panel with filters:

#### Filter Options:

1. **Report Type**
   - **All Types** - Shows both campaigns and users
   - **Campaign** - Shows only reported campaigns
   - **User** - Shows only reported user profiles

2. **Status**
   - **All** - Shows all reports regardless of status
   - **Pending** - Reports that haven't been reviewed yet (default)
   - **Resolved** - Reports where admin took action (warned/removed)
   - **Dismissed** - Reports where admin found no issue

3. **Sort By**
   - **Most Recent** (lastReportedAt) - Shows newest reports first
   - **Top Reported** (reportsCount) - Shows items with most reports first (default)
   - **Oldest Pending** (firstReportedAt) - Shows oldest unresolved reports first

4. **Number of Reports**
   - Choose how many to load (1-100, default: 10)

5. **Load Button**
   - Click to fetch reports with selected filters
   - Does NOT auto-load on page open (admin must click "Load")

**Performance Note:**
When loading reports, the system fetches live status from each campaign/user document to ensure displayed information is current. This means if you load 100 reports, the system makes 100-300 database reads to show accurate data. This could be optimized with batch fetching or short-term caching.

---

## Report Table Display

Each row in the table shows:

### Campaign Reports:
- **Campaign thumbnail** (small preview image)
- **Campaign title** (clickable)
- **Creator name** and profile picture
- **Total report count** (big red number badge)
- **Current moderation status** badge (active, hidden, removed-temporary, etc.)
- **Last reported date/time**
- **Action buttons:**
  - "View Breakdown" - Expands to show reason distribution
  - "Take Action" - Opens detailed panel with admin actions

### User Reports:
- **Profile picture** (or initials if no picture)
- **User's display name** (clickable)
- **Username** (@username)
- **Total report count** (big red number badge)
- **Current account status** badge (active, hidden, banned-temporary, etc.)
- **Last reported date/time**
- **Action buttons:**
  - "View Breakdown" - Expands to show reason distribution
  - "Take Action" - Opens detailed panel with admin actions

---

## Viewing Report Details

### View Breakdown Button
When clicked, the row expands to show:
- **Reason distribution** (visual breakdown)
- Each reason with:
  - Count (e.g., "Spam: 8")
  - Percentage (e.g., "53%")
  - Visual progress bar showing proportion
- **First report date** - When first report was received
- **Latest report date** - When most recent report was received

**Example:**
```
Report Breakdown
━━━━━━━━━━━━━━━━
Spam: 8 (53%)          [████████████░░░] 
Inappropriate: 5 (33%) [████████░░░░░░░]
Copyright: 2 (13%)     [███░░░░░░░░░░░░]

First Report: Jan 15, 2025 2:30 PM
Latest Report: Jan 18, 2025 9:45 AM
```

### Take Action Button
Opens a **detailed side panel** showing:

#### For Campaigns:
- Campaign image (full size preview)
- Campaign title and type (Frame/Background)
- Current moderation status with color-coded badge
- Creator information (name, profile picture, username)
- Total reports count with reason breakdown
- Campaign slug (URL identifier)
- Timestamps (created, first reported, last reported)

#### For Users:
- Profile picture (full size)
- Display name and username
- Current account status with color-coded badge
- Current moderation status
- Total reports count with reason breakdown
- Link to view full profile page
- Timestamps (account created, first reported, last reported)

---

## Admin Actions

When admin clicks "Take Action" in the side panel, they see **3 action buttons** with multi-step confirmation to prevent accidents:

### Safety Features (October 22, 2025)

All dangerous admin actions now require **typing "CONFIRM"** to proceed:
- ✅ **Ban User** - Requires typing "CONFIRM"
- ✅ **Remove Campaign** - Requires typing "CONFIRM"  
- ✅ **Warn User/Creator** - Requires typing "CONFIRM"
- ❌ **Dismiss Report** - Simple click confirmation (restoring content is low-risk)
- ❌ **Unban User** - Simple click confirmation (restoring access is low-risk)

**How it works:**
1. Admin fills in required information (reason, ban type, etc.)
2. Clicks "Continue" to proceed
3. A confirmation modal appears requiring them to type "CONFIRM" (exact match, case-sensitive)
4. The confirm button is disabled until "CONFIRM" is typed correctly
5. Clicking "Cancel" or outside the modal safely cancels the action

**Why this matters:**
- Prevents accidental clicks on destructive actions
- Gives admins a moment to reconsider
- Reduces stress and mistakes
- Only adds 2-3 seconds to legitimate actions

---

### 1. Dismiss Report (Secondary Button - Gray)

**Step 1: Click "Dismiss Report"**
- Shows simple confirmation modal (no typing required)

**Step 2: Confirm Dismissal**
- Admin confirms they want to dismiss (one click)

**What it does:**
- Marks report summary status as "dismissed"
- Resets ALL report counts to 0:
  - Campaign/User `reportsCount` → 0
  - Report Summary `reportsCount` → 0
  - Report Summary `reasonCounts` → {} (empty)
- Restores content to "active" status:
  - Campaigns: `moderationStatus` → "active"
  - Users: `accountStatus` → "active"
- Removes hidden timestamps
- Removes ban-related fields

**Notification sent?**
- ✅ **YES** - If campaign/user was auto-hidden (at 3+ reports for campaigns, 10+ for users)
  - **Campaign**: "✅ Campaign Restored - Good news! Your campaign has been reviewed and restored"
  - **User**: "✅ Profile Restored - Good news! Your profile has been reviewed and restored"
- ❌ **NO** - If content was never hidden (below threshold)

**Use when:** Reports are false/spam, or content doesn't violate rules

---

### 2. Warn User/Creator (Warning Button - Yellow)

**Step 1: Click "Warn User" or "Warn Creator"**
- Shows reason selection modal with dropdown
- Admin MUST select a reason:
  - Inappropriate content
  - Spam
  - Harassment
  - Misinformation
  - Copyright violation
  - Other

**Step 2: Click "Continue"**
- "Continue" button disabled until reason selected
- Proceeds to typed confirmation

**Step 3: Type "CONFIRM" to Proceed**
- Confirmation modal appears showing the warning details
- Admin must type "CONFIRM" (case-sensitive, exact match)
- Confirm button stays disabled until correctly typed
- Can click "Go Back" to edit the reason

**What it does:**
- Creates warning record in `warnings` collection with:
  - Selected reason from admin
  - User ID who received warning
  - Target type (campaign or user)
  - Target ID
  - Admin ID, email, and name (from authenticated admin)
  - Timestamp
  - Acknowledged status (false)
- **Restores content to active status** (this is intentional - warning is not removal):
  - Campaigns: `moderationStatus` → "active"  
  - Users: `accountStatus` → "active"
- Resets all report counts to 0
- Removes hidden timestamps
- Removes ban-related fields

**Rationale for restoration:**
Warning is a "slap on the wrist" - admin reviewed and decided content is not severe enough for removal. If content deserves to stay hidden, admin should use "Ban User/Remove Campaign" instead. Users should be able to see their content after being warned.

**Notification sent:** ✅ **ALWAYS**
- **Message**: "⚠️ Warning Issued - You've received a warning for: [admin-selected reason]. Please review our community guidelines."
- The notification includes the specific reason the admin selected from the dropdown

**Use when:** Content is borderline/minor issue - you want to warn the creator but allow content to remain visible

**Note:** Warning does NOT auto-ban users. Admin must manually decide actions based on warning history. Future enhancement needed: Admin warning history view (currently deferred).

---

### 3. Ban User / Remove Campaign (Danger Button - Red)

**Step 1: Click "Ban User" or "Remove Campaign"**
- Shows reason selection modal with dropdown
- Admin MUST select a reason:
  - Inappropriate content
  - Spam
  - Harassment
  - Misinformation
  - Copyright violation
  - Other

**Step 2: Click "Continue"**
- "Continue" button disabled until reason selected
- Proceeds to typed confirmation

**Step 3: Type "CONFIRM" to Proceed**
- Confirmation modal appears showing:
  - Selected reason
  - Ban type (temporary vs permanent, if banning user)
  - Appeal deadline (if applicable)
  - Clear warning about consequences
- Admin must type "CONFIRM" (case-sensitive, exact match)
- Confirm button stays disabled until correctly typed
- Can click "Go Back" to edit inputs

**What it does:**

**For Campaigns:**
- Sets `moderationStatus` to `removed-temporary`
- Content stays hidden from public
- Sets 30-day appeal deadline (calculated: current date + 30 days)
- Stores admin-selected reason in `banReason` field
- Stores `bannedAt` timestamp
- Sets `appealCount` to 0
- Resets `reportsCount` to 0
- **After 30 days:** ✅ Auto-upgrades to permanent status via Vercel Cron Job (runs daily at 2:00 AM)
- **Second removal:** Admin can manually set to `removed-permanent` (no recovery)

**For Users:**
- Sets `accountStatus` to `banned-temporary`
- Profile hidden from public
- Hides all their campaigns from public
- Sets 30-day appeal deadline
- Stores admin-selected reason in `banReason` field
- Stores `bannedAt` timestamp
- Resets `reportsCount` to 0
- **After 30 days:** ✅ Auto-upgrades to permanent ban via Vercel Cron Job (runs daily at 2:00 AM), sends email notification

**Notification sent:** ✅ **ALWAYS**
- **Campaign**: "🚫 Campaign Removed - Your campaign has been removed for: [reason]. You can appeal this decision until [date]."
- **User**: "🚫 Account Banned - Your account has been banned for: [reason]. You can appeal until [date]."
- Notifications now include both:
  - The specific reason admin selected from dropdown
  - The exact appeal deadline date (formatted as "February 20, 2025")

**Use when:** Content clearly violates rules and needs removal

---

## Appeal System

### How Appeals Work

When a campaign is removed or a user is banned temporarily, they have **30 days** to appeal the decision. Here's the complete flow:

#### For Users to Submit an Appeal:

1. **User receives notification**
   - Campaign removed: "🚫 Campaign Removed - Your campaign has been removed for: [reason]. You can appeal this decision until [date]."
   - Account banned: "🚫 Account Banned - Your account has been banned for: [reason]. You can appeal until [date]."
   - Notification includes exact appeal deadline (e.g., "February 20, 2025")

2. **User visits appeals page** (`/profile/appeals`)
   - Shows all removed campaigns and banned accounts eligible for appeal
   - Displays appeal deadline for each item
   - Only shows items with active appeal window (within 30 days)
   - One appeal allowed per item

3. **User selects item and submits appeal**
   - Writes appeal reason (minimum 20 characters required)
   - Explains why they believe the removal/ban was unfair
   - Submits appeal for admin review
   - Receives confirmation: "✅ Appeal Submitted - Your appeal has been submitted and is under review. You will be notified of the outcome."

4. **Appeal is tracked**
   - Appeal status set to `pending`
   - `appealCount` increments on the campaign (tracks multiple appeals if previous ones were rejected)
   - Appeal stored in `appeals` collection with: userId, type, targetId, reason, status, submittedAt

#### For Admins to Review Appeals:

5. **Admin visits appeals dashboard** (`/admin/appeals`)
   - Filter by:
     - **Status**: All, Pending, Approved, Rejected
     - **Type**: All, Campaign, Account
     - **Limit**: 10, 25, 50, 100
   - Table shows:
     - User info (profile picture, username, display name)
     - Appeal type (Campaign or Account)
     - Target details (campaign title/image or account info)
     - Original removal/ban reason
     - User's appeal reason
     - Submission date

6. **Admin reviews and decides**
   - Click "Approve" or "Reject" button
   - Modal appears with:
     - Full appeal details
     - Option to add admin notes (optional)
     - Warning about consequences
     - Type "CONFIRM" requirement (prevents accidental clicks)

7. **Admin approves appeal**
   - **For campaigns:**
     - `moderationStatus` → `active` (campaign restored)
     - Clears all removal-related fields (`bannedAt`, `banReason`, `appealDeadline`)
     - Notification sent: "✅ Appeal Approved - Your appeal for campaign '[title]' has been approved and your campaign has been restored."
   - **For accounts:**
     - `accountStatus` → `active` (account restored)
     - Clears ban-related fields
     - Notification sent: "✅ Appeal Approved - Your appeal has been approved and your account has been restored. Welcome back!"
   - Appeal status → `approved`
   - Admin action logged for audit trail

8. **Admin rejects appeal**
   - **For campaigns:**
     - `moderationStatus` → `removed-permanent` (no more appeals allowed)
     - Clears `appealDeadline` (permanent removal)
     - Notification sent: "❌ Appeal Rejected - Your appeal for campaign '[title]' has been reviewed and rejected. The removal is now permanent."
   - **For accounts:**
     - `accountStatus` → `banned-permanent` (permanent ban)
     - Clears `appealDeadline`
     - Notification sent: "❌ Appeal Rejected - Your appeal has been reviewed and rejected. Your account ban is now permanent."
   - Appeal status → `rejected`
   - Admin action logged

### Appeal System Rules:

- ✅ **30-day window** - Appeals must be submitted within 30 days of removal/ban
- ✅ **One appeal per item** - Users cannot submit multiple pending appeals for the same campaign/account
- ✅ **Minimum 20 characters** - Appeal reason must be at least 20 characters long
- ✅ **Real-time notifications** - Users notified immediately when appeal is approved/rejected
- ✅ **Admin confirmation** - All approve/reject actions require typing "CONFIRM" to prevent accidents
- ✅ **Audit trail** - All appeals and admin decisions are logged

### Appeal Deadline Expiration:

**✅ FULLY IMPLEMENTED (October 26, 2025):**

**Automatic Cleanup (Vercel Cron Job):**
- **Runs daily at 2:00 AM UTC** via `/api/cron/cleanup-expired-appeals`
- Automatic upgrade to permanent status after deadline passes
- Campaigns: `removed-temporary` → `removed-permanent`
- Users: `banned-temporary` → `banned-permanent`
- **Sends in-app notification** for permanently removed campaigns (users can still log in)
- **Sends email notification** for permanent bans (users cannot log in to see in-app)
- All actions logged to `adminLogs` collection for audit trail

**Appeal Deadline Reminders (Vercel Cron Job):**
- **Runs daily at 10:00 AM UTC** via `/api/cron/send-appeal-reminders`
- Sends reminders at 7, 3, and 1 day(s) before deadline expires
- **Notification delivery varies by type:**
  - **Campaign removals:** BOTH in-app + email reminders sent (creators can still log in)
  - **Account bans:** Email reminders ONLY (banned users cannot log in to see in-app)
- Includes countdown timer, removal reason, and direct appeal link
- Prevents users from missing their appeal window

**Vercel Cron Job Configuration:**
- Secured with `CRON_SECRET` environment variable
- Free tier limit: 2 cron jobs (both slots used)
- Monitored via Vercel function logs and admin logs dashboard

---

## Status Meanings

### Report Summary Statuses:
- **pending** - Waiting for admin review (new reports)
- **resolved** - Admin took action (warned or removed/banned)
- **dismissed** - Admin found no issue and cleared the reports

**Status Transitions:**
- When new report comes in on previously `resolved`/`dismissed` target → Status resets to `pending`
- When admin takes action → Status changes to `resolved` (for warn/remove) or `dismissed` (for dismiss)

### Moderation Statuses (For Campaigns):
- **active** - Visible to public, no issues
- **under-review** - 1-2 reports received, still visible but flagged for admin review
- **under-review-hidden** - Hidden due to 3+ reports, awaiting admin review
- **removed-temporary** - Campaign removed by admin, 30-day appeal window
- **removed-permanent** - Campaign permanently deleted (second offense or severe violation)
- **deleted** - Campaign deleted by creator (only appears in reportSummary for tracking)

### Account Statuses (For Users):
- **active** - Profile visible, account accessible, no issues
- **under-review** - 1-9 reports received, profile still visible but flagged for admin review
- **under-review-hidden** - Profile hidden due to 10+ reports, awaiting admin review
- **banned-temporary** - User banned by admin, 30-day appeal window, cannot login
- **banned-permanent** - User permanently banned (severe violations), all data deleted

**Clear Distinction:**
- **Campaigns** use `moderationStatus` - Controls content visibility and moderation state
- **Users** use `accountStatus` - Controls account access and ban state
- This prevents field conflicts and ensures consistent enforcement

---

## Automatic Behavior

### When New Reports Come In After Admin Action:

1. **If admin previously dismissed or resolved:**
   - Report summary status resets to `pending`
   - **Counter behavior (synchronized):**
     - **Both Report Summary AND Campaign/User counters reset to 1** (starting fresh to track "new wave" of reports)
     - Counters stay synchronized and increment together as new reports arrive
     - Fixed October 22, 2025 - no more temporary mismatches
   - All reason counts in summary reset to track new pattern
   - New reports trigger auto-hide thresholds again

2. **Auto-hide triggers again:**
   - Campaign: Hidden at 3rd report (if status is `active`)
   - User: Hidden at 10th report (if status is `active`)
   - Notification sent again to creator/user
   - **Note:** Only triggers if current status is `active` - intentional design to require manual admin review for previously-reviewed content

### Report Summary Retention:
- **Report summaries are kept forever** (not deleted after admin action)
- Status changes to `dismissed` or `resolved` but document remains
- This allows tracking:
  - Repeat offenders
  - Historical patterns
  - Audit trail for moderation decisions
  - Analysis of which violations are most common

**Important:** Reason counts are reset to empty `{}` when admin takes action. Historical reason data is lost. See CODE_INCONSISTENCIES.md #10 for improvement suggestion to preserve this data.

### Campaign Deletion by Creator:
When a campaign creator deletes their own campaign:

1. **Campaign document deleted:**
   - Removed from Firestore `campaigns` collection
   - Associated image deleted from Supabase storage
   - Creator's `campaignsCount` decreased by 1

2. **Report Summary updated (NOT deleted):**
   - Status changed to `dismissed`
   - `reportsCount` reset to 0
   - `reasonCounts` reset to empty object `{}`
   - `moderationStatus` set to `deleted`
   - `deletionNote` added: "Campaign deleted by creator"
   - **Summary kept for audit trail**

3. **Admin dashboard behavior:**
   - Deleted campaign reports don't appear in pending queue (status is `dismissed`)
   - If admin filters by "all" or "dismissed" status, they may see historical data
   - Report summaries show `targetDeleted: true` flag when target no longer exists
   - Prevents admins from wasting time on non-existent content

4. **Notifications:**
   - No notification sent to creator (they initiated the deletion)
   - API returns count of auto-dismissed reports in response

**API Endpoint:** `DELETE /api/campaigns/[campaignId]`
**Authorization:** Only campaign owner (creatorId match required)
**UI Location:** Profile page > Campaign menu (3-dot button) > "Delete Campaign"
**Confirmation:** Required before deletion proceeds

---

## Notification System

The system uses **hybrid notifications** - combining in-app and email notifications based on user accessibility:

### Notification Types by Delivery Method:

**📧 EMAIL NOTIFICATIONS** (for banned users who cannot access their account):
- **User bans** → "🚫 Your Account Has Been Suspended"
  - Sent via MailerSend to user's email address
  - Includes ban reason and appeal deadline
  - Works for both temporary and permanent bans
  - **Why email:** Banned users are immediately signed out and cannot access in-app notifications

- **User unbans** → "✅ Your Account Has Been Restored"
  - Sent via MailerSend to user's email address
  - Notifies user their account is restored
  - **Why email:** Previously, unbanned users had no notification at all - they discovered it by accident

**📱 IN-APP NOTIFICATIONS** (Firestore-based, no browser permissions needed):
- **Campaign reaches 3 reports** → "⚠️ Campaign Under Review"
- **User profile reaches 10 reports** → "⚠️ Profile Under Review"
- **Admin dismisses reports** → "✅ Campaign/Profile Restored"
- **Admin issues warning** → "⚠️ Warning Issued"
- **Campaign removals** → "🚫 Campaign Removed" (user can still log in)

### When Notifications Are Sent:

1. **Campaign reaches 3 reports** → In-app notification
   - Triggered automatically when 3rd report submitted
   - Only if current status is `active`

2. **User profile reaches 10 reports** → In-app notification
   - Triggered automatically when 10th report submitted
   - Only if current status is `active`

3. **Admin dismisses reports** → In-app notification
   - Only sent if content was previously hidden (at threshold)
   - Not sent if content was never auto-hidden

4. **Admin issues warning** → In-app notification
   - Always sent
   - Includes admin-selected reason

5. **Admin removes campaign** → In-app notification
   - Sent to creator (who can still access their account)
   - Includes admin-selected reason and appeal deadline
   - **Note:** Promises appeal system that doesn't exist yet

6. **Admin bans user** → EMAIL notification ✅
   - Sent to user's email address (bypasses account lockout)
   - Includes ban reason and appeal deadline
   - **Critical:** User cannot access account, so email is the only way to reach them

7. **Admin unbans user** → EMAIL notification ✅
   - Sent to user's email address
   - Notifies account restoration
   - **Important:** Builds trust by informing users of positive moderation decisions

8. **Appeal deadline reminders** → PLANNED (not implemented)
   - Requires cron job
   - Would notify 7 days, 3 days, and 1 day before deadline

### In-App Notification Delivery:
- Saved to Firestore: `users/{userId}/notifications/{notificationId}`
- Real-time listeners update UI instantly via `useNotifications` hook
- Shows in notification bell icon in header (with unread count badge)
- Toast popup appears for new notifications (auto-dismisses after 5 seconds)
- Full inbox available at `/profile/notifications` with:
  - Read/unread status toggle
  - Filter by notification type
  - Delete individual notifications
  - Mark all as read
  - Action buttons (e.g., "View Campaign", "Appeal Removal")

### Email Notification Delivery:
- Sent via MailerSend API (`src/utils/notifications/sendEmail.js`)
- Professional HTML templates (`src/utils/notifications/emailTemplates.js`)
- Includes ban reason, appeal deadline, and action buttons
- Free tier: 12,000 emails/month with trial domain
- Custom domain supported for production

### In-App Notification Structure:
```javascript
{
  id: "auto-generated-id",
  type: "warning" | "campaign_removed" | "campaign_under_review" | etc.,
  title: "Notification Title",
  body: "Notification message with details",
  actionUrl: "/profile" or specific page,
  icon: "/icon-192x192.png",
  read: false,
  createdAt: timestamp,
  metadata: { campaignId, reason, etc. } // Optional additional data
}
```

### Email Template Structure:
```javascript
{
  subject: "🚫 Your Account Has Been Suspended",
  html: "<professional HTML email with inline CSS>",
  // Includes: ban reason, appeal deadline, action buttons, support contact
}
```

---

## Performance Optimizations

### Before Optimization (Individual Reports System):
- **Report submission**: 3 Firestore writes per report
  - 1 write to create individual report document
  - 1 write to update campaign/user reportsCount
  - 1 write to update creator/user notification
- **Admin dismiss (100 reports)**: 102 reads + 103 writes
  - 1 read to fetch campaign/user
  - 100 reads to fetch all individual reports
  - 1 write to update campaign/user
  - 100 writes to update each report status
  - 1 write for notification
  - 1 write to update admin action log

### After Optimization (Current Aggregated System):
- **Report submission**: 2 Firestore writes (33% reduction)
  - 1 write to update campaign/user reportsCount
  - 1 write to update/create reportSummary with reason counts
  - (Notification is optional, not always sent)
- **Admin dismiss (any number of reports)**: 2 reads + 3 writes (98% reduction)
  - 1 read to fetch reportSummary
  - 1 read to fetch campaign/user
  - 1 write to update campaign/user status
  - 1 write to update reportSummary status
  - 1 write to create warning (if warning action)
  - (Notification write happens after transaction)

### How It's Achieved:
- Use aggregated `reportSummary` collection instead of individual report documents
- Store reason counts as objects: `{spam: 8, inappropriate: 5, copyright: 2}`
- No need to fetch/update hundreds of individual reports
- Single atomic transaction handles everything
- Instant admin actions with no query overhead

### Trade-offs:
- **Pro:** 95% reduction in database operations
- **Pro:** Faster admin actions (instant instead of seconds)
- **Pro:** Significant cost savings on Firestore usage
- **Pro:** Better admin UX with instant reason distribution visibility
- **Pro:** Batch fetching eliminates N+1 query problem when loading reports
- **Con:** Can't see individual report details (who reported, when each report came in)
- **Con:** Reason count history lost when admin takes action

---

## Key Design Principles

1. **Efficiency First** - Minimize database operations for scalability at viral scale

2. **Transparency** - Clear reason breakdowns help admins make informed decisions quickly

3. **User Communication** - Hybrid notification system ensures users are always informed:
   - **In-app notifications** for accessible accounts (warnings, campaign removals, auto-hides)
   - **Email notifications** for inaccessible accounts (bans, unbans)
   - **Critical:** Banned users receive email since they cannot access their account

4. **Audit Trail** - Keep report summaries forever for pattern detection and repeat offender tracking

5. **Fairness** - Appeal windows give users a chance to contest decisions (though not yet implemented)

6. **Automation** - Auto-hide at thresholds reduces admin workload for clear-cut cases

7. **Clear Status Separation** - Campaigns use `moderationStatus`, Users use `accountStatus` to prevent conflicts

8. **Atomic Transactions** - All status updates happen atomically to prevent race conditions and inconsistencies

9. **Rate Limiting** - Prevent report spam and abuse through IP-based limits

10. **Privacy** - IP addresses are hashed (SHA-256) before storage for user privacy

---

## Common Admin Workflows

### Scenario 1: False Reports (Spam Reports)
1. Admin sets filters: Status = "Pending", Sort = "Top Reported"
2. Clicks "Load" to fetch reports
3. Clicks "Take Action" on campaign with high report count
4. Reviews campaign image and details - looks fine, no violations
5. Clicks "Dismiss Report"
6. Confirms dismissal in modal
7. System:
   - Resets all report counts to 0
   - Restores campaign to `active` status
   - If campaign was hidden → Creator gets "✅ Campaign Restored" notification
   - If campaign wasn't hidden → No notification sent
8. Panel closes, reports table refreshes

### Scenario 2: Clear Violation
1. Admin reviews reports (loaded with filters)
2. Clicks "Take Action" on reported campaign
3. Reviews campaign - clearly inappropriate content (violates rules)
4. Clicks "Remove Campaign" (red danger button)
5. Reason selection modal appears
6. Selects reason: "Inappropriate content"
7. Clicks "Continue"
8. Confirms removal in second confirmation modal
9. System:
   - Sets `moderationStatus` to `removed-temporary`
   - Sets 30-day appeal deadline
   - Stores ban reason "Inappropriate content"
   - Resets report counts to 0
   - Creator receives "🚫 Campaign Removed" notification with reason and appeal deadline
10. Panel closes, reports table refreshes

### Scenario 3: Minor Issue / Warning
1. Admin reviews reported content
2. Content is borderline but not severe enough for removal
   - Example: Slightly misleading caption but not harmful
3. Clicks "Warn Creator"
4. Reason selection modal appears
5. Selects reason: "Misinformation"
6. Clicks "Continue"
7. Confirms warning
8. System:
   - Creates warning record with reason "Misinformation"
   - **Restores campaign to `active` status** (unhides if was auto-hidden)
   - Resets report counts to 0
   - User receives "⚠️ Warning Issued" notification with specific reason
9. User can see their content again, but warning is tracked for future reference
10. If user gets more warnings, admin can see pattern (future enhancement needed)

---

## Known Limitations & Future Enhancements

### Current Limitations:

1. **Report Count Synchronization Edge Cases**
   - Campaign/user reportsCount can temporarily differ from reportSummary reportsCount
   - Happens when new reports come after previous dismissal/resolution
   - Counters sync again when admin takes action
   - Not a critical issue - counters always match before and after admin actions

2. **Reason Count History Lost**
   - When admin takes action, all reason count data is erased
   - Can't see historical patterns of violations across multiple report cycles
   - This is a trade-off for the 95% reduction in database operations
   - Could be improved by archiving reason counts before resetting

### Planned Enhancements:

1. **Reason Count History** (Priority: LOW)
   - Archive reason counts when admin takes action
   - Allow pattern analysis and trend detection
   - View historical violation patterns for repeat offenders

---

## Summary

The Twibbonize reporting system is designed to:
- ✅ Make reporting easy for users (just select a reason from dropdown)
- ✅ Auto-hide problematic content quickly (3 reports for campaigns, 10 for users)
- ✅ Give admins powerful filtering and sorting tools
- ✅ Show clear reason breakdowns for informed decisions
- ✅ Communicate actions transparently via in-app and email notifications
- ✅ Maintain audit trails for repeat offenders
- ✅ Optimize performance for viral-scale campaigns (95% reduction in database operations)
- ✅ Provide fair appeal windows (full appeal system implemented with user submission, admin review, and automated reminders)
- ✅ Track admin actions with comprehensive audit logging (admin ID, email, name, action, reason, timestamps)
- ✅ Enforce status transition validation (prevents reversing permanent bans/removals)
- ✅ Prevent report spam through rate limiting
- ✅ Protect user privacy (hashed IP addresses)

This system balances automation with human oversight, ensuring bad content is addressed quickly while giving creators/users appropriate notifications and appeal rights.

**Note:** This document reflects the actual implementation as of October 31, 2025. The appeal system, admin audit logging, appeal deadline reminders, and status transition validation are all fully implemented and functional.

---

## Status Transition System - Complete Technical Analysis

**Last Updated:** October 25, 2025

This section documents how campaign and user statuses change throughout the moderation lifecycle, where transitions are triggered, validation rules, and identified gaps in the current implementation.

---

### Campaign Status System (moderationStatus)

Campaigns use the `moderationStatus` field to track content visibility and moderation state.

#### Available Statuses:

1. **`active`** - Campaign is visible to public, no moderation issues
2. **`under-review`** - 1-2 reports received, still visible but flagged for review
3. **`under-review-hidden`** - Campaign auto-hidden at 3+ reports, awaiting admin review
4. **`removed-temporary`** - Admin removed campaign with 30-day appeal window
5. **`removed-permanent`** - Campaign permanently removed, no recovery possible

**Note:** The status `under-review` serves as an intermediate flagging state before auto-hiding content from the public.

---

### User Status System (accountStatus + moderationStatus)

Users have TWO separate status fields that serve different purposes:

#### 1. `accountStatus` - Controls account access and bans:
- **`active`** - User can log in, account fully functional
- **`under-review`** - 1-9 reports received, profile still visible (user can still log in)
- **`under-review-hidden`** - Profile hidden at 10+ reports (user can still log in)
- **`banned-temporary`** - User cannot log in, 30-day appeal window
- **`banned-permanent`** - User cannot log in, permanent ban, data scheduled for deletion

#### 2. `moderationStatus` - Controls profile visibility (separate from campaigns):
- **`active`** - Profile visible to public
- **`under-review`** - Profile flagged for review but still visible
- **`under-review-hidden`** - Profile hidden from public (user can still log in and appeal)

**Important Distinction:**
- `accountStatus` = whether user can ACCESS their account
- `moderationStatus` = whether profile is VISIBLE to public
- These can be different (e.g., profile hidden but user can still log in to appeal)

---

### Status Transition Map

#### Campaign Status Transitions:

```
AUTOMATIC TRANSITIONS (triggered by reports):
active → under-review-hidden (at 3rd report)

ADMIN ACTIONS (via /api/admin/reports/summary/[summaryId]):
under-review-hidden → active (dismiss reports)
under-review-hidden → removed-temporary (remove campaign)
active → removed-temporary (remove campaign without being hidden first)
active → active (warn creator - resets to active if was hidden)
under-review-hidden → active (warn creator - always restores to active)

ADMIN DIRECT ACTIONS (via /api/admin/campaigns/[campaignId]):
ANY_STATUS → active (restore campaign)
ANY_STATUS → under-review-hidden (manual hide)
ANY_STATUS → removed-temporary (temporary removal)
ANY_STATUS → removed-permanent (permanent removal)

APPEAL SYSTEM (via /api/admin/appeals/[appealId]):
removed-temporary → active (appeal approved)
removed-temporary → removed-permanent (appeal rejected)

CREATOR ACTIONS:
ANY_NON_REMOVED_STATUS → deleted (creator deletes their campaign)
```

#### User Status Transitions:

```
AUTOMATIC TRANSITIONS (triggered by reports):
accountStatus: active → under-review-hidden (at 10th report)

ADMIN REPORT ACTIONS (via /api/admin/reports/summary/[summaryId]):
accountStatus: under-review-hidden → active (dismiss reports)
accountStatus: under-review-hidden → banned-temporary (ban user)
accountStatus: active → banned-temporary (ban directly)
accountStatus: active → active (warn user - resets to active if hidden)
accountStatus: under-review-hidden → active (warn user)

ADMIN DIRECT BAN (via /api/admin/users/[userId]/ban):
accountStatus: ANY → active (unban)
accountStatus: ANY → banned-temporary (temporary ban)
accountStatus: ANY → banned-permanent (permanent ban)

APPEAL SYSTEM (via /api/admin/appeals/[appealId]):
accountStatus: banned-temporary → active (appeal approved)
accountStatus: banned-temporary → banned-permanent (appeal rejected)
```

---

### Where Transitions Happen

#### 1. Auto-Hide on Reports
**File:** `/src/app/api/reports/submit/route.js` and `/src/app/api/reports/user/route.js`

**Trigger:** Report submission increments counter

**Campaign Logic:**
```javascript
if (newReportsCount >= 3 && campaignData.moderationStatus === 'active') {
  campaignUpdates.moderationStatus = 'under-review-hidden';
  campaignUpdates.hiddenAt = now;
  // Send notification to creator
}
```

**User Logic:**
```javascript
if (newReportsCount >= 10 && userData.accountStatus === 'active') {
  userUpdates.accountStatus = 'under-review-hidden';
  userUpdates.hiddenAt = now;
  // Send notification to user
}
```

**Validation:** ✅ Only triggers if current status is `active` (prevents re-hiding reviewed content)

---

#### 2. Admin Report Actions (Dismiss/Warn/Remove)
**File:** `/src/app/api/admin/reports/summary/[summaryId]/route.js`

**Actions:**

**A. Dismiss Report (`action: 'no-action'`):**
- Campaigns: `moderationStatus → 'active'`
- Users: `accountStatus → 'active'`
- Clears: `hiddenAt`, `bannedAt`, `banReason`, `appealDeadline`
- Resets: `reportsCount → 0`

**B. Warn (`action: 'warned'`):**
- Creates warning record in `warnings` collection
- Campaigns: `moderationStatus → 'active'` (always restores)
- Users: `accountStatus → 'active'` (always restores)
- Clears all moderation fields (same as dismiss)
- Rationale: Warning means "reviewed but not severe enough for removal"

**C. Remove/Ban (`action: 'removed'`):**
- Campaigns: `moderationStatus → 'removed-temporary'`
- Users: `accountStatus → 'banned-temporary'`
- Sets: `bannedAt`, `banReason`, `appealDeadline` (30 days)
- Resets: `reportsCount → 0`

**Validation:** ✅ Status transition validation implemented via `statusTransitionValidator.js`
- Prevents reversing permanent removals (removed-permanent → active is blocked)
- Prevents reversing permanent bans (banned-permanent → active is blocked)
- Enforces valid state machine transitions
- Returns clear error messages for invalid transitions

---

#### 3. Admin Direct Campaign Moderation
**File:** `/src/app/api/admin/campaigns/[campaignId]/route.js`

**Allowed Statuses:** `['active', 'under-review-hidden', 'removed-temporary', 'removed-permanent']`

**Behavior:**
- Admin can set campaign to ANY valid status directly
- Sets appeal deadline for `removed-temporary`
- Clears appeal fields for `removed-permanent`
- Clears moderation fields when setting to `active`

**Validation:** ✅ Status transition validation enforced - `removed-permanent` → `active` is blocked

---

#### 4. Admin Direct User Ban
**File:** `/src/app/api/admin/users/[userId]/ban/route.js`

**Allowed Statuses:** `['active', 'banned-temporary', 'banned-permanent']`

**Behavior:**
- Admin can set user to ANY valid status directly
- Sets appeal deadline for `banned-temporary`
- Clears appeal fields for `banned-permanent`
- Sends email notification for bans/unbans

**Validation:** ✅ Status transition validation enforced - `banned-permanent` → `active` is blocked

---

#### 5. Appeal Approval/Rejection
**File:** `/src/app/api/admin/appeals/[appealId]/route.js`

**Appeal Approval:**
- Campaigns: `removed-temporary → active`
- Users: `banned-temporary → active`
- Clears all moderation/ban fields
- Resets `reportsCount → 0`

**Appeal Rejection:**
- Campaigns: `removed-temporary → removed-permanent`
- Users: `banned-temporary → banned-permanent`
- Clears `appealDeadline` (no more appeals)

**Validation:** ✅ Checks appeal status is `pending` before processing
**Validation:** ✅ Uses status transition validator to ensure valid state changes during approval/rejection

---

### Implemented Validation System

#### ✅ Status Transition Validation (IMPLEMENTED)

**File:** `/src/utils/admin/statusTransitionValidator.js`

**Features:**
- Prevents reversing permanent removals (`removed-permanent` → any other status is blocked)
- Prevents reversing permanent bans (`banned-permanent` → any other status is blocked)
- Enforces valid state machine transitions for campaigns and users
- Returns clear error messages for invalid transitions
- Used in all admin endpoints that modify status

**Campaign Transitions (Enforced):**
```javascript
{
  'active': ['under-review', 'under-review-hidden', 'removed-temporary', 'removed-permanent'],
  'under-review': ['active', 'under-review-hidden', 'removed-temporary', 'removed-permanent'],
  'under-review-hidden': ['active', 'under-review', 'removed-temporary', 'removed-permanent'],
  'removed-temporary': ['active', 'removed-permanent'], // Can be restored via appeal
  'removed-permanent': [], // NO transitions out - truly permanent
}
```

**User Transitions (Enforced):**
```javascript
{
  'active': ['under-review', 'under-review-hidden', 'banned-temporary', 'banned-permanent'],
  'under-review': ['active', 'under-review-hidden', 'banned-temporary', 'banned-permanent'],
  'under-review-hidden': ['active', 'under-review', 'banned-temporary', 'banned-permanent'],
  'banned-temporary': ['active', 'banned-permanent'], // Can be restored via appeal
  'banned-permanent': [], // NO transitions out - truly permanent
}
```

**Impact:** "Permanent" truly means permanent - admins cannot accidentally (or intentionally) restore permanently removed/banned content

---

#### ✅ Admin Action Audit Logging (IMPLEMENTED)

**File:** `/src/utils/logAdminAction.js`

**What's Logged:**
- Admin ID, email, and display name (from authenticated session)
- Action type (dismissed, warned, removed, banned, etc.)
- Target type and ID (campaign or user)
- Target title/name for easy reference
- Admin-selected reason (for warnings, bans, removals)
- Additional metadata (previous status, reports count, etc.)
- Timestamp (server-side)
- System actions from cron jobs (labeled with adminId: 'system')

**Where Used:**
- All report summary actions (`/api/admin/reports/summary/[summaryId]`)
- All campaign moderation actions (`/api/admin/campaigns/[campaignId]`)
- All user ban actions (`/api/admin/users/[userId]/ban`)
- All appeal decisions (`/api/admin/appeals/[appealId]`)
- Cron job automated actions (appeal deadline expiry, etc.)

**Admin Logs Dashboard:** `/admin/logs` - View, filter, and search all admin actions

**Impact:** Full audit trail for accountability, debugging, and pattern analysis

---

#### ✅ Appeal Deadline Reminders (IMPLEMENTED)

**Cron Job:** `/api/cron/send-appeal-reminders`
- **Schedule:** Daily at 10:00 AM UTC
- **Reminders:** 7 days, 3 days, and 1 day before deadline
- **Campaign removals:** In-app notifications (creators can log in)
- **Account bans:** Email notifications (banned users cannot log in)
- **Secured:** Requires `CRON_SECRET` environment variable
- **Monitored:** All actions logged to admin logs

**Impact:** Users don't miss their appeal window, improving fairness

---

#### Minor Edge Cases (Not Critical)

#### 1. **Auto-Hide Status Check**

**Current Logic:**
```javascript
if (newReportsCount >= 3 && campaignData.moderationStatus === 'active')
```

**Edge Case:** Reports on `removed-temporary` campaigns increment counter but don't trigger auto-hide.

**Impact:** Minimal - removed campaigns are already hidden from public and shouldn't receive new reports

#### 2. **"under-review" Status Usage**

**Status:** Listed in validation constants but not actively used in report flow

**Current Implementation:** Reports go from `active` → `under-review` (1-2 reports) → `under-review-hidden` (3+ reports)

**Impact:** None - status is valid and could be used in future for intermediate flagging

---

### Enforced Status Transition Rules

The system enforces these transition rules via `/src/utils/admin/statusTransitionValidator.js`:

#### Campaign Transitions (ENFORCED):

```javascript
const VALID_CAMPAIGN_TRANSITIONS = {
  'active': ['under-review', 'under-review-hidden', 'removed-temporary', 'removed-permanent'],
  'under-review': ['active', 'under-review-hidden', 'removed-temporary', 'removed-permanent'],
  'under-review-hidden': ['active', 'under-review', 'removed-temporary', 'removed-permanent'],
  'removed-temporary': ['active', 'removed-permanent'], // Only via appeal or admin decision
  'removed-permanent': [], // NO transitions out - truly permanent
};
```

#### User Transitions (ENFORCED):

```javascript
const VALID_ACCOUNT_TRANSITIONS = {
  'active': ['under-review', 'under-review-hidden', 'banned-temporary', 'banned-permanent'],
  'under-review': ['active', 'under-review-hidden', 'banned-temporary', 'banned-permanent'],
  'under-review-hidden': ['active', 'under-review', 'banned-temporary', 'banned-permanent'],
  'banned-temporary': ['active', 'banned-permanent'], // Only via appeal or admin decision
  'banned-permanent': [], // NO transitions out - truly permanent
};
```

**Where Enforced:**
- `/api/admin/campaigns/[campaignId]/route.js` - Campaign moderation actions
- `/api/admin/users/[userId]/ban/route.js` - User ban/unban actions
- `/api/admin/reports/summary/[summaryId]/route.js` - Report actions (warn/remove/dismiss)
- `/api/admin/appeals/[appealId]/route.js` - Appeal approval/rejection

**Error Handling:**
- Invalid transitions return clear error messages
- Example: "Cannot restore permanently removed campaigns. Permanent removals are final and cannot be reversed."
- HTTP 400 status code returned to client

---

### Business Rule Summary

Based on actual code implementation, the moderation system follows these rules:

✅ **Implemented and Enforced:**
1. Auto-hide only triggers on `active` status (prevents re-hiding reviewed content)
2. Warnings always restore to `active` (warning is not removal)
3. Appeals check for `pending` status before processing
4. Report counts reset to 0 on all admin actions
5. Temporary statuses set 30-day appeal deadlines
6. **Status transition validation prevents reversing permanent bans/removals**
7. **Admin actions are logged with full audit trail (admin ID, name, email, reason)**
8. **Appeal deadline reminders sent at 7, 3, and 1 day before expiry**
9. **Expired appeal deadlines auto-upgrade to permanent via cron job**

✅ **Working as Designed:**
1. Users can have `accountStatus = 'banned-temporary'` while `moderationStatus = 'active'` (profile visible but cannot log in)
2. Reports can increment on `removed-temporary` content (edge case - removed content hidden from public anyway)
3. "under-review" status exists for intermediate flagging (1-2 reports for campaigns, 1-9 for users)

---

**End of Status Transition Analysis**
