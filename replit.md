# Twibbonize App

## Overview
Twibbonize is a Next.js 15 application designed for creating and sharing "Campaigns" consisting of photo frames and backgrounds. It allows visitors to discover, customize, and download photos with these elements, while creators can upload and manage their campaigns with public analytics. The project aims to provide a visitor-first, frictionless experience with minimal authentication requirements, emphasizing public discovery and transparency.

## User Preferences
- Prefer stability over experimental features
- Focus on clean, maintainable code structure
- Make code changes ONLY when explicitly requested
- Never perform automatic setup, testing, or debugging

## System Architecture
The application is built with Next.js 15.5.7 (App Router), React 19.1.0, and Tailwind CSS 4. It leverages Firebase for authentication and Supabase for database and storage.

**Core Features:**
- **Campaign System:** Users can upload and manage campaigns, categorized as Frames (requiring transparency detection) or Backgrounds.
- **Public Gallery:** A unified `/campaigns` page for browsing campaigns with filtering capabilities.
- **Image Composition:** Utilizes Canvas API for overlaying user photos with frames/backgrounds, including adjustment tools (zoom, move, fit).
- **Top Creators:** A leaderboard feature showcasing creators by country and time period.
- **Public Analytics:** Transparent usage statistics for all campaigns.
- **Three-Page Campaign Flow:** A guided user experience for photo upload, adjustment, and result download/sharing.
- **Admin Dashboard:** A comprehensive panel for moderation, including reports management, campaign moderation, user management, and analytics.
- **In-App Notification System:** Real-time Firestore-based notifications for user updates and moderation events, with notification inbox and toast alerts.

**Design Principles:**
- **Visitor-first experience:** Browsing and using campaigns do not require authentication.
- **Minimal account requirements:** Authentication is only required for campaign creation.
- **Public-first design:** Emphasizes discovery and transparent analytics.
- **Frictionless workflow:** Achieved through delayed authentication and intuitive user flows.

**Technical Implementations:**
- **Transparency Detection:** Canvas API is used to validate transparency for frame uploads.
- **Slug Generation:** Unique, URL-friendly identifiers are generated from campaign titles.
- **Delayed Authentication:** Users can complete forms unauthenticated, with a prompt only at the point of publishing.
- **Optimized Database Structure:** Firebase/Firestore is optimized to reduce storage costs and prevent document bloat, especially for viral campaigns, by simplifying download tracking and using counters.
- **Image Optimization:** ImageKit.io CDN is integrated for image transformation (WebP, resizing, quality optimization) across all application images.
- **In-App Notifications Only:** Notifications are delivered through Firestore real-time listeners - no browser permissions or service workers needed.
- **Notification History/Inbox System:** All notifications are saved to Firestore (`users/{userId}/notifications`) for an in-app inbox with real-time updates and authenticated APIs for managing read/delete status.

## External Dependencies
- **Firebase:** Authentication and Firestore database.
- **Supabase:** Image storage (campaigns, profiles).
- **ImageKit.io:** Active CDN for image optimization and transformations (WebP, resizing).
- **MailerSend:** Email notifications for critical actions (bans, unbans).
- **Next.js:** Web framework (v15.5.7).
- **React:** UI library (v19.1.0).
- **Tailwind CSS:** Styling (v4).

## Recent Updates (October 31, 2025)

### Documentation Cleanup - Settings Architecture Clarification
Updated documentation to clarify the settings architecture plan:

**Key Clarifications:**
- ✅ `/settings` hub is PLANNED for future implementation (account, privacy, preferences)
- ❌ `/settings/notifications` will NOT be implemented (notifications are mandatory)
- All notifications are moderation-related and users must receive them
- Notification inbox at `/profile/notifications` provides full notification management

**Settings Hub Will Include (Future):**
- `/settings/account` - Password, email, 2FA, sessions, account deletion
- `/settings/privacy` - Profile visibility, data export, GDPR compliance
- `/settings/preferences` - Language, theme, accessibility

**Files Updated:**
- `TASKS.md` - Restructured Phase 1 to focus on settings hub (excluding notification preferences)
- `replit.md` - Clarified that settings hub is deferred, not cancelled
- `CODEBASE_STRUCTURE.md` - Updated to reflect planned settings architecture

---

## Recent Updates (October 13, 2025)

### Documentation Audit & Corrections
Conducted comprehensive documentation audit comparing actual codebase against all documentation files:

**Files Analyzed:**
- CODEBASE_STRUCTURE.md (647 lines)
- CODE_INCONSISTENCIES.md
- TASKS.md (2427 lines)
- README.md
- CAMPAIGN_SYSTEM.md
- replit.md

**Key Findings & Fixes:**
1. **Component Discrepancies Resolved:**
   - ❌ Removed non-existent `ReportUserModal.js` from docs
   - ✅ Added missing `ShareModal.js` to docs (universal modal for campaigns and profiles)
   - ✅ Clarified `ReportModal.js` handles both campaign and user reports

2. **In-App Notification System:**
   - Firestore-based real-time notification system
   - No browser permissions required
   - System features:
     - ✅ Real-time Firestore listeners for instant notifications
     - ✅ NotificationBell, NotificationToast, NotificationProvider components
     - ✅ Notification inbox at `/profile/notifications` (read/unread, filter, delete)
     - ✅ Server-side sendInAppNotification utility for sending notifications

3. **Settings Architecture Clarification:**
   - ⏸️ `/settings` hub is planned for future (account, privacy, preferences pages)
   - ❌ `/settings/notifications` will NOT be implemented (notifications are mandatory moderation updates)
   - ✅ Notification inbox at `/profile/notifications` is fully functional
   - Users can view, filter, and delete notifications without needing preferences
   - All notifications are critical moderation actions that must be delivered

4. **Documentation Updates:**
   - Updated TASKS.md with notification system documentation
   - Documented in-app notification architecture and components
   - Added notification system integration with moderation features

**Current Implementation Status:**
- ✅ Core campaign system fully functional
- ✅ Admin dashboard with full moderation tools
- ✅ In-app notification system with Firestore real-time listeners
- ✅ Notification inbox at `/profile/notifications` with read/unread/delete functionality
- ✅ Optimized grouped reporting system
- ✅ Complete appeal system (user submission + admin review)
- ✅ Auto-deletion cron jobs (fully implemented)
- ✅ Appeal deadline reminder notifications (fully implemented)
- ⏸️ Settings hub (`/settings`) - Deferred for future (account, privacy, preferences pages)
- ⏸️ Admin warning history view (deferred - future enhancement)

## Recent Updates (October 24, 2025)

### Complete Appeal System Implementation
Implemented a full-featured appeal system for removed campaigns and banned accounts:

**User Features:**
- Appeal submission page at `/profile/appeals` showing all eligible items
- 30-day appeal window from removal/ban date
- One appeal per item with minimum 20-character reason requirement
- Real-time notifications for appeal submission, approval, and rejection

**Admin Features:**
- Appeals review dashboard at `/admin/appeals` with filtering (status, type, limit)
- Approve/reject actions with typed confirmation ("CONFIRM" requirement)
- Admin notes field for documentation
- Complete integration with moderation workflow

**Technical Implementation:**
- User API endpoint: `/api/appeals/eligible` (fetches user's removed items)
- User API endpoint: `/api/appeals/submit` (submits appeal)
- Admin API endpoint: `/api/admin/appeals` (lists appeals)
- Admin API endpoint: `/api/admin/appeals/[appealId]` (approve/reject)
- Appeals Firestore helper functions in `firestore.js`
- Notification templates: appealSubmitted, appealApproved, appealRejected
- AdminSidebar updated with Appeals navigation link

**Integration:**
- Appeals restore content on approval (moderationStatus → active, accountStatus → active)
- Appeals set permanent status on rejection (removed-permanent, banned-permanent)
- Full audit trail through admin action logging
- Notification system integration for all appeal events

**Completed Items (October 26, 2025):**
- ✅ Appeal deadline reminder notifications (implemented via Vercel cron job)
- ✅ Auto-deletion after 30 days if no appeal (implemented via Vercel cron job)

---

## Recent Updates (October 14, 2025)

### Reporting System with Reason Counts Optimization
Implemented an optimized reporting system using reason counts instead of individual report documents, reducing Firestore operations by ~95%.

**Implementation Details:**
1. **reportSummary with Reason Counts:**
   - Single aggregated collection that tracks reports by target (campaign or user)
   - Schema includes: `targetId`, `targetType`, `reportsCount`, `reasonCounts`, `status`, `firstReportedAt`, `lastReportedAt`
   - `reasonCounts` object stores breakdown (e.g., `{spam: 8, inappropriate: 5, copyright: 2}`)
   - Display data cached in summary for quick access (title, image, creator info)
   - All counts reset to 0 when admin takes action (dismiss/warn/remove)

2. **No Individual Reports:**
   - Removed individual report documents entirely
   - Report submission only increments reason counts in reportSummary
   - Atomic transactions ensure consistency
   - Status automatically resets to 'pending' when new reports filed against resolved entities

3. **Report Submission:**
   - User selects reason from dropdown (required field)
   - No details/text field - just reason selection
   - Backend increments specific reason count in reportSummary
   - 2 writes per report instead of 3 (33% reduction)

4. **Admin API Endpoints:**
   - `/api/admin/reports/grouped`: Fetches paginated summaries (max 10) with filters
   - `/api/admin/reports/summary/[summaryId]`: Admin actions (dismiss/warn/remove)
   - Removed: `/api/admin/reports/details` (no longer needed)
   - Removed: `/api/admin/reports/[reportId]` (no individual reports)

5. **GroupedReportsTable Component:**
   - Displays aggregated report summaries with reason breakdown
   - Expand shows percentage distribution (e.g., "Spam: 8 (53%)")
   - Visual progress bars for each reason
   - Shows first/last report timestamps
   - No individual report fetching needed

6. **Admin Action Performance:**
   - Before: 50 reads + 53 writes for 50 reports
   - After: 2 reads + 3 writes regardless of report count
   - 96% reduction in reads, 94% reduction in writes
   - Instant admin actions with no query overhead

7. **Frontend Updates:**
   - ReportModal simplified - removed details textarea
   - Admin sees reason breakdown instead of individual reports
   - Better insight into why content was reported

**Performance Impact:**
- Report submission: 3 writes → 2 writes (33% reduction)
- Admin dismiss (100 reports): 102 reads + 103 writes → 2 reads + 3 writes (98% reduction)
- Better admin UX with instant reason distribution visibility
- Significant cost savings on Firestore usage for high-volume scenarios

