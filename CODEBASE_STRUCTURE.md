# Codebase Structure Documentation

**Last Updated:** October 26, 2025  
**Project:** Twibbonize - Campaign Photo Frame & Background Platform

This document provides a complete overview of the codebase structure with descriptions of each file and folder's purpose.

---

## 📁 Root Directory

```
.
├── attached_assets/          # Uploaded assets and screenshots (temporary files)
├── public/                   # Static assets served directly
├── src/                      # Source code directory (main application)
├── *.md                      # Documentation files
└── Config files              # Project configuration
```

### Documentation Files

- **`README.md`** - Standard Next.js project documentation
- **`replit.md`** - Project overview, strict policies, architecture, and user preferences
- **`TASKS.md`** - Campaign system task tracker with implementation status
- **`CAMPAIGN_SYSTEM.md`** - Complete campaign system implementation guide
- **`REPORT_SYSTEM.md`** - Comprehensive reporting and moderation system documentation
- **`CODE_INCONSISTENCIES.md`** - Tracks code/documentation inconsistencies and fixes
- **`CODEBASE_STRUCTURE.md`** - This file - complete codebase structure documentation

### Configuration Files

- **`package.json`** - Node.js dependencies and scripts
- **`package-lock.json`** - Locked dependency versions
- **`next.config.mjs`** - Next.js framework configuration
- **`postcss.config.mjs`** - PostCSS configuration for Tailwind CSS
- **`eslint.config.mjs`** - ESLint linting rules
- **`jsconfig.json`** - JavaScript/TypeScript configuration and path aliases
- **`firestore.rules`** - Firestore database security rules
- **`firestore.indexes.json`** - Firestore composite index definitions
- **`vercel.json`** - Vercel deployment configuration including 2 cron jobs for automated moderation

---

## 📁 `/public` - Static Assets

```
public/
├── file.svg              # File icon
├── globe.svg             # Globe icon
├── next.svg              # Next.js logo
├── vercel.svg            # Vercel logo
└── window.svg            # Window icon
```

**Purpose:** Contains static assets that are served directly without processing. These files are accessible at the root URL (e.g., `/file.svg`).

---

## 📁 `/src` - Source Code

Main application source code organized by Next.js App Router conventions.

---

## 📁 `/src/app` - Application Routes & Pages

Next.js 15 App Router directory structure. Each folder represents a route.

### Root Level Files

- **`layout.js`** - Root layout wrapper for entire app with NotificationProvider
- **`globals.css`** - Global styles and Tailwind CSS imports
- **`loading.js`** - Global loading UI component
- **`not-found.js`** - 404 error page
- **`analytics.js`** - Analytics tracking setup
- **`favicon.ico`** - Site favicon

---

### 📁 `/src/app/(chrome)` - Main App Layout Group

Routes that use the main app layout (header + footer).

#### **`layout.js`** - Chrome layout with Header/Footer navigation

#### **`page.js`** - Homepage with hero and CTA

---

### 📁 `/src/app/(chrome)/admin` - Admin Dashboard

Admin-only routes for platform moderation and management.

#### **`layout.js`** - Admin layout with sidebar navigation and auth protection
#### **`page.js`** - Admin analytics dashboard (default admin page)

#### 📁 **`/reports`** - Reports Management
- **`page.js`** - Reports table with filters and moderation actions (uses aggregated reportSummary)

#### 📁 **`/campaigns`** - Campaign Moderation
- **`page.js`** - Campaign grid with moderation status and actions

#### 📁 **`/users`** - User Management
- **`page.js`** - User table with role assignment and ban actions

#### 📁 **`/logs`** - Admin Action Logs
- **`page.js`** - Admin activity audit log with filters (action type, target type, admin, date range)

#### 📁 **`/appeals`** - Appeals Review
- **`page.js`** - Admin dashboard for reviewing user appeals with approve/reject actions and typed confirmation

---

### 📁 `/src/app/(chrome)/campaign/[slug]` - 3-Page Campaign Flow

Visitor experience for using campaigns (frames/backgrounds).

#### **`page.js`** - Page 1: Upload photo and view campaign details
#### 📁 **`/adjust`**
- **`page.js`** - Page 2: Adjust photo with zoom/position/rotate controls
#### 📁 **`/result`**
- **`page.js`** - Page 3: Download result and share options

**Flow:** Upload → Adjust → Result (with session persistence and route guards)

---

### 📁 `/src/app/(chrome)/campaigns` - Campaign Gallery

#### **`page.js`** - Browse all campaigns with filters (type, time, sort)

---

### 📁 `/src/app/(chrome)/create` - Campaign Creation

Creator workflow for uploading new campaigns.

#### **`page.js`** - Opens CreateCampaignModal (for direct URL access)

#### 📁 **`/frame`**
- **`page.js`** - Upload frame with transparency detection (≥5% required)

#### 📁 **`/background`**
- **`page.js`** - Upload background (any format, no transparency required)

**Flow:** Choose type → Upload image → Fill metadata → Publish

---

### 📁 `/src/app/(chrome)/creators` - Top Creators

#### **`page.js`** - Leaderboard ranked by total campaign supports

---

### 📁 `/src/app/(chrome)/profile` - User Profile

#### **`page.js`** - User's own profile page with campaigns grid

#### 📁 **`/edit`**
- **`page.js`** - Edit profile (avatar, banner, bio, username)

#### 📁 **`/notifications`**
- **`page.js`** - Notification inbox with read/unread status and history

#### 📁 **`/appeals`**
- **`page.js`** - User appeals submission page for removed campaigns and banned accounts

**Note:** The `/settings` directory does NOT exist yet but is planned for future implementation. It will include settings pages for account management (`/settings/account`), privacy controls (`/settings/privacy`), and user preferences (`/settings/preferences`). Notification preferences will NOT be included since all notifications are moderation-related and mandatory. Users manage notifications via the inbox at `/profile/notifications`. Profile editing remains at `/profile/edit`.

---

### 📁 `/src/app/(chrome)/u/[username]` - Public Profiles

#### **`page.js`** - Public user profile pages (accessible via username)

---

### 📁 `/src/app/(chrome)/privacy` - Legal Pages

#### **`page.js`** - Privacy policy page

---

### 📁 `/src/app/(chrome)/terms` - Legal Pages

#### **`page.js`** - Terms of service page

---

### 📁 `/src/app/api` - API Routes (Server-Side)

Backend API endpoints for data operations.

---

### 📁 `/src/app/api/admin` - Admin API Routes

Server-side admin operations (protected by admin middleware).

#### 📁 **`/analytics`**
- **`route.js`** - GET: Fetch platform analytics (total users, campaigns, reports, bans)

#### 📁 **`/campaigns`**
- **`route.js`** - GET: Fetch all campaigns with creator info (admin view)
- **`/[campaignId]/route.js`** - PATCH: Update campaign moderation status
- **`/[campaignId]/delete/route.js`** - DELETE: Permanently delete campaign + image

#### 📁 **`/logs`**
- **`route.js`** - GET: Fetch admin action logs with filters (action type, target type, admin, limit)

#### 📁 **`/reports`**
- **`route.js`** - GET: Fetch all reports (legacy endpoint, still functional)
- **`/grouped/route.js`** - GET: Fetch aggregated report summaries with batch-optimized queries (96% faster)
- **`/summary/[summaryId]/route.js`** - PATCH: Take moderation action on aggregated report summary (dismiss/warn/remove)

#### 📁 **`/users`**
- **`route.js`** - GET: Fetch all users with search/filters
- **`/[userId]/role/route.js`** - PATCH: Assign/revoke admin role
- **`/[userId]/ban/route.js`** - PATCH: Ban/unban user (sends email notification to user)

#### 📁 **`/appeals`**
- **`route.js`** - GET: Fetch appeals for admin review with filtering (status, type, limit)
- **`/[appealId]/route.js`** - PATCH: Approve or reject appeals with status transition validation

---

### 📁 `/src/app/api/campaigns` - Campaign Operations

#### 📁 **`/[campaignId]`**
- **`route.js`** - DELETE: Delete campaign and auto-dismiss all related reports (owner only)

#### 📁 **`/track-download`**
- **`route.js`** - POST: Increment campaign supportersCount on download

---

### 📁 `/src/app/api/notifications` - Notification System

**Hybrid notification system** combining in-app and email:

#### 📁 **`/[notificationId]`**
- **`route.js`** - PATCH: Mark notification as read/unread, DELETE: Delete notification

**In-App Notifications (Firestore-based):**
- No browser permissions required
- Delivered instantly via Firestore real-time listeners
- Used for: warnings, campaign removals, auto-hides, content restorations
- Works on all devices without setup

**Email Notifications (MailerSend):**
- Used exclusively for: user bans and unbans
- Critical for banned users who cannot access their account
- Professional HTML templates with ban reasons and appeal deadlines
- See `src/utils/notifications/emailTemplates.js` and `sendEmail.js`

---

### 📁 `/src/app/api/appeals` - Appeal System

#### 📁 **`/eligible`**
- **`route.js`** - GET: Fetch campaigns/accounts eligible for appeal (removed-temporary or banned-temporary with active appeal window)

#### 📁 **`/submit`**
- **`route.js`** - POST: Submit appeal for removed campaign or banned account with validation (min 20 chars, one appeal per item)

---

### 📁 `/src/app/api/cron` - Vercel Cron Jobs

**Two automated moderation cron jobs (runs in production only):**

#### 📁 **`/cleanup-expired-appeals`**
- **`route.js`** - GET: Daily cron job (2:00 AM UTC) to upgrade expired temporary removals/bans to permanent status
- Secured with `CRON_SECRET` environment variable
- Sends in-app notifications for campaigns, email notifications for user bans
- Logs all actions to `adminLogs` collection

#### 📁 **`/send-appeal-reminders`**
- **`route.js`** - GET: Daily cron job (10:00 AM UTC) to send appeal deadline reminders (7, 3, 1 day before expiry)
- Sends both in-app and email notifications
- Includes countdown timer and direct appeal link

---

### 📁 `/src/app/api/reports` - Report Submission

#### 📁 **`/submit`**
- **`route.js`** - POST: Submit campaign report with IP-based rate limiting (5/hour) and duplicate prevention

#### 📁 **`/user`**
- **`route.js`** - POST: Submit user/profile report with IP-based rate limiting (5/hour) and duplicate prevention

**Rate Limiting:**
- Maximum 5 reports per hour per IP address
- Duplicate prevention: same IP/user cannot report same target twice
- Authenticated users tracked by userId to prevent network-switching bypass
- IP addresses hashed (SHA-256) for privacy
- Auto-cleanup after 24 hours via Firestore TTL

---

### 📁 `/src/app/api/storage` - Supabase Storage Operations

#### 📁 **`/campaign-upload-url`**
- **`route.js`** - POST: Generate signed upload URL for campaigns

#### 📁 **`/upload-url`**
- **`route.js`** - POST: Generate signed upload URL for profile images

#### 📁 **`/delete`**
- **`route.js`** - POST: Delete file from Supabase storage

#### 📁 **`/signed-url`**
- **`route.js`** - POST: Generate temporary download URL

#### 📁 **`/list`**
- **`route.js`** - POST: List files in storage bucket

---

### 📁 `/src/app` - Auth & Special Pages (No Chrome Layout)

Authentication pages and special pages without header/footer.

#### **`/signin/page.js`** - Sign in page with email/password
#### **`/signup/page.js`** - Sign up page with email/password
#### **`/forgot-password/page.js`** - Password reset page
#### **`/verify-email/page.js`** - Email verification page
#### **`/onboarding/page.js`** - New user onboarding (username, bio, avatar)
#### **`/banned/page.js`** - Banned account notice with appeal option

---


---

## 📁 `/src/components` - React Components

Reusable UI components organized by feature.

### Layout Components

- **`Header.js`** - Main navigation header with auth buttons and notification bell
- **`Footer.js`** - Site footer with links
- **`MobileMenu.js`** - Mobile hamburger menu
- **`Hero.js`** - Homepage hero section with CTA
- **`ConditionalLayout.js`** - Conditionally render header/footer
- **`AuthenticatedLayout.js`** - Layout wrapper for authenticated users

### Auth Components

- **`AuthGate.js`** - Protected route wrapper (requires authentication)
- **`ClientAuthProvider.js`** - Firebase auth context provider
- **`EmailVerification.js`** - Email verification prompt
- **`UserOnboardingWrapper.js`** - Onboarding flow wrapper
- **`UserProfileProvider.js`** - User profile data provider

### Campaign Components

- **`CampaignGallery.js`** - Grid layout with modals for share/report/delete (uses CampaignCard)
- **`CampaignCard.js`** - Individual campaign card with image, title, creator info, and stats
- **`CampaignCardMenu.js`** - 3-dot menu dropdown with share/delete/report options
- **`CampaignStepIndicator.js`** - Step indicator for 3-page flow (Upload → Adjust → Result)
- **`CreateCampaignModal.js`** - Modal for choosing Frame or Background type
- **`FilterModal.js`** - Filter modal for campaigns/creators pages

### Profile Components

- **`ProfilePage.js`** - User profile display component
- **`ProfilePageWrapper.js`** - Profile page wrapper with loading state

### Modal Components

- **`ConfirmationModal.js`** - Reusable confirmation dialog
- **`ReportModal.js`** - Universal report modal for both campaigns and user profiles
- **`ShareModal.js`** - Universal share modal for campaigns and profiles
- **`CreateCampaignModal.js`** - Campaign type selection modal

### Admin Components

Located in `/src/components/admin/`:

- **`AdminSidebar.js`** - Admin dashboard sidebar navigation with Logs link
- **`AdminHeader.js`** - Admin dashboard header with breadcrumbs
- **`AdminActionButton.js`** - Reusable action button with loading/confirm dialog
- **`ReportsTable.js`** - LEGACY: Individual reports data table (still functional but unused)
- **`GroupedReportsTable.js`** - NEW: Aggregated report summaries table with batch-optimized queries
- **`ReportDetailsPanel.js`** - Report details slide-out panel with typed confirmation for dangerous actions
- **`CampaignModerationCard.js`** - Campaign card with moderation actions (uses adminHelpers)
- **`UsersTable.js`** - Users data table with search (uses adminHelpers)
- **`UserDetailsModal.js`** - User details modal with admin actions and typed confirmation for bans
- **`AdminLogsTable.js`** - Admin action audit log table with filters (includes cron job actions)

### Notification Components

Located in `/src/components/notifications/`:

- **`NotificationProvider.js`** - Global notification provider with Firestore real-time listeners
- **`NotificationBell.js`** - Notification bell icon with unread count badge
- **`NotificationToast.js`** - Toast notifications with animations (displays latest unread notification)

### Utility Components

- **`ConfirmationModal.js`** - Reusable confirmation dialog with typed confirmation feature (requires typing "CONFIRM" for dangerous actions)
- **`LoadingSpinner.js`** - Loading spinner component
- **`PageLoader.js`** - Full-page loading indicator
- **`ErrorBoundary.js`** - Error boundary wrapper
- **`InteractiveClient.js`** - Client-side interactive wrapper
- **`FirestoreProvider.js`** - Firestore context provider
- **`LayoutVisibilityContext.js`** - Control header/footer visibility
- **`TimeoutWrapper.js`** - Timeout handling wrapper

---

## 📁 `/src/contexts` - React Context Providers

Global state management using React Context.

- **`CampaignSessionContext.js`** - Campaign flow session state (photo, adjustments, campaign data)
  - Persists to sessionStorage with 24h expiry
  - Used across 3-page campaign flow

---

## 📁 `/src/data` - Static Data

- **`countries.js`** - List of countries with codes and names for filters

---

## 📁 `/src/hooks` - Custom React Hooks

Reusable logic hooks.

- **`useAuth.js`** - Firebase authentication hook (user state, login, logout)
- **`useBodyScrollLock.js`** - Lock body scroll when modal is open
- **`useNotifications.js`** - In-app notification hook with Firestore real-time listeners
  - Provides: notifications list, unread count, latest notification, mark read/delete functions
  - No browser permissions required
- **`useFocusTrap.js`** - Trap keyboard focus within modal
- **`useSecureStorage.js`** - Secure localStorage/sessionStorage wrapper with encryption

---

## 📁 `/src/lib` - Core Libraries & Integrations

External service integrations and core utilities.

### Firebase

- **`firebase-optimized.js`** - Firebase client SDK initialization (auth + firestore only)
- **`firebaseAdmin.js`** - Firebase Admin SDK for server-side operations
- **`firestore.js`** - Firestore database functions (CRUD operations)
  - User profiles, campaigns, reports, creators, notifications, etc.

### Supabase

- **`supabase.js`** - Supabase client SDK (storage operations)
- **`supabase-admin.js`** - Supabase Admin SDK for server-side storage

---

## 📁 `/src/middleware` - API Middleware

Server-side middleware for API routes.

- **`adminAuth.js`** - Admin authentication middleware
  - `requireAdmin()` - Verify user has admin role
  - Used in all `/api/admin/*` routes

---

## 📁 `/src/utils` - Utility Functions

Helper functions and algorithms.

### Campaign Utilities

- **`slugGenerator.js`** - Generate unique URL slugs from titles (50 chars + 4-char random)
- **`transparencyDetector.js`** - Detect PNG transparency (≥5% threshold for frames)
- **`campaignStorage.js`** - Storage path utilities (`campaigns/{userId}/{campaignId}.png`)
- **`campaignRouteGuards.js`** - Route guards for 3-page campaign flow
  - `requirePhotoUpload()` - Redirect if no photo
  - `requireDownloadComplete()` - Redirect if not downloaded

### Image Utilities

- **`imageComposition.js`** - Canvas-based image composition
  - Frame: photo under frame
  - Background: photo on top
  - Zoom, position, rotate adjustments
- **`imageTransform.js`** - ImageKit.io CDN transformations
  - Thumbnail, preview, avatar, banner presets via ImageKit.io
  - WebP conversion and quality optimization
  - Supabase used only for full-size canvas operations (no transforms)

### Admin Utilities

Located in `/src/utils/admin/`:

- **`adminHelpers.js`** - Admin dashboard formatting utilities
  - `formatReportReason()` - Human-readable report reasons
  - `getModerationStatusColor()` - Badge colors for moderation status
  - `getReportStatusColor()` - Badge colors for report status
  - `getRoleBadgeColor()` - Badge colors for user roles
  - `formatTimestamp()` - Date formatting with optional time
  - `truncateText()` - Text truncation with ellipsis
  - `formatNumber()` - Number formatting with thousands separator

- **`adminValidation.js`** - Admin input validation
  - `validateReportStatus()` - Validate report status values
  - `validateModerationStatus()` - Validate moderation status values
  - `validateUserRole()` - Validate user role values
  - `validateBanReason()` - Validate ban reason is provided
  - `validateReportAction()` - Validate report action types
  - `getValidationError()` - Get validation error message

### Notification Utilities

Located in `/src/utils/notifications/`:

- **`notificationTemplates.js`** - In-app notification templates for moderation actions
  - Campaign under review, removed, restored
  - Warning issued
  - Profile under review, restored
  - Account banned (NOTE: Now replaced with email for actual bans)
  - Appeal deadline reminders
  - All templates use object destructuring to prevent parameter order issues
  - All templates include type field for categorization

- **`sendInAppNotification.js`** - Server-side in-app notification sender
  - Saves notifications to Firestore (`users/{userId}/notifications`)
  - Instant delivery via Firestore real-time listeners
  - Supports metadata for rich notifications

- **`emailTemplates.js`** - Email notification templates (MailerSend)
  - Account banned (temporary/permanent with appeal deadline)
  - Account unbanned (restoration notification)
  - Appeal deadline reminders (7, 3, 1 day countdowns)
  - Campaign/account permanently removed notifications
  - Professional HTML design with inline CSS
  - Mobile-responsive with call-to-action buttons

- **`sendEmail.js`** - Email sending utility (MailerSend API)
  - Server-side email delivery
  - Used for ban/unban notifications and appeal reminders
  - Returns success/error status for logging
  - Supports custom sender domain

### General Utilities

- **`validation.js`** - Input validation functions
- **`schemas.js`** - Data schemas and validators
- **`firebaseErrorHandler.js`** - Firebase error messages formatter
- **`networkUtils.js`** - Network request utilities
- **`logAdminAction.js`** - Admin action logging utility
  - Logs all admin moderation actions to `adminLogs` collection
  - Tracks: admin ID/email/name, action type, target, reason, timestamp
  - Used for audit trail and accountability
  - Also used by cron jobs (admin: "system") for automatic permanent upgrades
- **`reportRateLimit.js`** - IP-based report rate limiting
  - Maximum 5 reports per hour per IP address
  - Duplicate prevention by IP and userId
  - SHA-256 IP hashing for privacy
  - Auto-cleanup after 24 hours via Firestore TTL
  - Prevents report spam and network-switching bypass

---

## 📁 `/src` - Root Level Files

- **`middleware.js`** - Next.js middleware (route protection, redirects)
- **`polyfills.js`** - Browser polyfills for older browsers

---

## Key File Relationships

### Campaign Creation Flow
1. User clicks "Create Campaign" → `CreateCampaignModal.js`
2. Choose Frame → `/create/frame/page.js` → `transparencyDetector.js`
3. Upload → `campaignStorage.js` → `supabase.js`
4. Publish → `firestore.js` (createCampaign)

### Campaign Usage Flow (3-Page)
1. Visit `/campaign/[slug]` → Upload photo → `CampaignSessionContext.js`
2. Navigate `/adjust` → `imageComposition.js` → Canvas controls
3. Download → `/api/campaigns/track-download` → Increment supportersCount
4. Navigate `/result` → Share options via `ShareModal.js`

### Admin Moderation Flow
1. Admin visits `/admin` → `adminAuth.js` middleware checks role
2. View reports → `/api/admin/reports/grouped` → Batch-optimized queries (96% faster)
3. Take moderation action → `/api/admin/reports/summary/[summaryId]` → Atomic transaction
4. Action logged → `logAdminAction.js` → `adminLogs` collection
5. Notification sent:
   - **For bans:** Email notification → `sendEmail.js` → MailerSend → User's inbox
   - **For warnings/removals:** In-app notification → `sendInAppNotification.js` → Firestore
6. User receives notification via email or in-app depending on action type

### In-App Notification Flow
1. Server action triggers notification → `sendInAppNotification.js`
2. Notification saved to `users/{userId}/notifications` → Firestore
3. Real-time listener detects new notification → `useNotifications.js`
4. NotificationToast displays latest unread → Auto-dismisses after 5s
5. User views full inbox at `/profile/notifications`

### Email Notification Flow (for Bans/Unbans)
1. Admin bans/unbans user → `/api/admin/users/[userId]/ban` or `/api/admin/reports/summary/[summaryId]`
2. Email template generated → `emailTemplates.js` → accountBanned or accountUnbanned
3. Email sent → `sendEmail.js` → MailerSend API → User's email inbox
4. User receives email with ban reason, appeal deadline, and action buttons
5. Banned users can read email even when locked out of account

---

## External Dependencies

### Core Framework
- **Next.js 15.5.7** - React framework with App Router
- **React 19.1.0** - UI library
- **Tailwind CSS 4** - Utility-first CSS

### Backend Services
- **Firebase** - Authentication and Firestore database
- **Supabase** - Object storage for images (no CDN transforms)
- **MailerSend** - Email delivery service for ban/unban notifications
- **ImageKit.io** - Active CDN for image optimization and transformations (WebP, resizing, quality)

### Key Libraries
- **@supabase/supabase-js** - Supabase client
- **firebase** - Firebase client SDK (auth + firestore only)
- **firebase-admin** - Firebase server SDK
- **mailersend** - MailerSend email API client
- **zod** - Schema validation
- **server-only** - Ensure server-side only code
- **date-fns** - Date formatting and manipulation

---

## Environment Variables

**Configured on Vercel (NOT in Replit):**

### Firebase
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON string)

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### MailerSend (Email Service)
- `MAILERSEND_API_KEY`
- `NEXT_PUBLIC_BASE_URL` (for email links)

### ImageKit.io (Active - Required)
- `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` (required for all image transformations)

---

## Development Workflow

1. **Code editing** - Done in Replit editor
2. **Testing** - All testing on Vercel deployment (NOT locally)
3. **Dependencies** - User installs manually (`npm install`)
4. **Server** - User manages server execution (NOT agent)
5. **Environment** - All env vars configured on Vercel

**Important:** Replit is used ONLY for code editing, not for running/testing the application.

---

## Implementation Status Summary

### ✅ Fully Implemented Features

**Core Campaign System:**
- Campaign creation (frame + background)
- 3-page visitor flow (upload → adjust → result)
- Image composition with Canvas API
- Campaign gallery and discovery
- Top creators leaderboard

**Admin Dashboard:**
- Reports management with aggregated summaries and batch-optimized queries (96% faster)
- Campaign moderation with status updates
- User management with role assignment and bans
- Platform analytics dashboard
- Admin action audit logs with comprehensive tracking

**Moderation System:**
- Report submission (campaigns + profiles) with IP-based rate limiting
- Auto-hide rules (3+ reports for campaigns, 10+ for profiles)
- Admin actions: Dismiss, Warn, Remove/Ban (with typed confirmation for dangerous actions)
- Warnings collection and tracking
- Admin action logging for accountability and audit trail

**Hybrid Notification System:**
- ✅ **In-App Notifications** (Firestore-based, no browser permissions required)
  - Real-time delivery via Firestore listeners
  - Notification templates for warnings, campaign removals, auto-hides
  - In-app notification inbox at `/profile/notifications` (read/unread, filter, delete)
  - Notification history saved to Firestore (`users/{userId}/notifications`)
  - Foreground notification toasts (`NotificationToast.js`)
  - NotificationBell with unread count
  - NotificationProvider integrated in app layout
  - useNotifications hook for real-time listeners

- ✅ **Email Notifications** (MailerSend-based)
  - Used exclusively for ban/unban notifications
  - Professional HTML templates with ban reasons and appeal deadlines
  - Critical for banned users who cannot access their account
  - Templates: accountBanned (temp/permanent), accountUnbanned
  - Sent via `sendEmail.js` utility

### ⏸️ Deferred Features

- Appeals system (user appeals for removed content/banned accounts)
  - **Note:** Appeal deadlines are mentioned in notifications but no submission form exists yet
- Admin warning history view in user details
- Auto-deletion cron jobs (30-day appeal deadline enforcement)
- Appeal deadline email reminders (7 days, 3 days, 1 day before deadline)

---

## Notes

- All routes under `/admin` require admin role verification
- All API routes under `/api/admin` protected by `requireAdmin()` middleware
- Campaign images stored in Supabase at `campaigns/{userId}/{campaignId}.png`
- Profile images stored in Supabase at `profiles/{userId}/{type}.{ext}`
- Session data persists in sessionStorage with 24h expiry
- Supabase CDN used for all image transformations (WebP, resizing)
- Download tracking uses Firestore transactions to prevent race conditions
- Username reservation uses dedicated collection for atomicity
- In-app notifications saved to Firestore: `users/{userId}/notifications/{notificationId}`
- Email notifications sent via MailerSend for ban/unban only
- Admin action logs saved to Firestore: `adminLogs` collection
- Report rate limits tracked in Firestore: `reportRateLimits` collection with 24h TTL
- Report system uses aggregated `reportSummary` collection (not individual `reports` documents)
- `ReportModal.js` handles both campaign and user/profile reports (universal component)
- `ShareModal.js` handles both campaign and profile sharing (universal component)
- `ConfirmationModal.js` supports typed confirmation (requires typing "CONFIRM") for dangerous actions

---

**End of Documentation**
