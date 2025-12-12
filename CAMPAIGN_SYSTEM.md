# Campaign System - Implementation Guide

**Last Updated:** October 08, 2025  
**Status:** Phase 1 Complete | Phase 2 Pending | Moderation System Updated

---

## Overview

Twibbonize supports two campaign types:
- **Frames** - Images with transparency where visitor photos go underneath
- **Backgrounds** - Solid images where visitor photos go on top

**Key Features:**
- Two-step campaign creation (upload → metadata)
- 3-page visitor flow (upload → adjust → result)
- Canvas-based image composition with adjustments
- Download tracking and public analytics
- Delayed authentication (publish-time only)

---

## Data Schema

### Campaign Collection (Firestore: `campaigns`)
✅ **Status: Implemented** | 🔄 **Updated: Moderation Fields (Oct 2025)**

```javascript
{
  // Core fields (IMMUTABLE after publish)
  id: "auto-generated-id",
  type: "frame" | "background",
  slug: "unique-url-slug",              // Generated from title + random suffix
  imageUrl: "campaigns/{userId}/{campaignId}.png",
  creatorId: "firebase-user-id",
  
  // Metadata (editable for 7 days OR until 10 supporters)
  title: "Campaign Title",
  description: "Optional description",
  captionTemplate: "Share text template",
  
  // Counters
  supportersCount: 0,                    // Total downloads (increments on each download)
  reportsCount: 0,                       // Increments with each report
  
  // Moderation Status (UPDATED)
  moderationStatus: "active" | "under-review" | "under-review-hidden" | "removed-temporary" | "removed-permanent",
  hiddenAt: timestamp,                   // When auto-hidden (3+ reports)
  removedAt: timestamp,                  // When admin removed temporarily
  removalReason: string,                 // Admin's reason for removal
  appealDeadline: timestamp,             // 30 days from removal
  appealCount: number,                   // How many times appealed (max 1)
  
  // Timestamps
  createdAt: timestamp,                  // Publish time
  updatedAt: timestamp,                  // Last edit
  firstUsedAt: timestamp                 // First download (optional)
}
```

**Editing Policy:**
- Editable fields: title, description, captionTemplate
- Edit window: 7 days from publish AND less than 10 supporters
- After limit: Campaign permanently locked

**Moderation Policy (NEW):**
- **3+ reports** → Auto-hide from public (`under-review-hidden`)
- **Admin dismiss** → Restore to `active`, reset reportsCount to 0
- **Admin remove** → `removed-temporary` for 30 days with appeal option
- **After 30 days** → Auto-delete permanently if no appeal
- **Second removal** → `removed-permanent` (no recovery)

**Deletion Policy:**
- Only creator can delete (for `active` campaigns)
- Admin can remove (temporary or permanent)
- Temporary removal allows 30-day appeal
- Permanent deletion removes Firestore doc + Supabase image

---

### Report Summary Collection (Firestore: `reportSummary`)
✅ **Status: Implemented** | 🔄 **Updated: Reason Counts Optimization (Oct 14, 2025)**

```javascript
{
  targetId: string,                      // campaignId or userId
  targetType: "campaign" | "user",
  reportsCount: number,                  // Total active reports
  
  // NEW: Reason breakdown with counts
  reasonCounts: {
    spam: 8,                             // Example: 8 spam reports
    inappropriate: 5,                    // 5 inappropriate reports
    copyright: 2,                        // 2 copyright reports
    ...                                  // Other reasons with counts
  },
  
  // Timestamps
  firstReportedAt: timestamp,            // First report time
  lastReportedAt: timestamp,             // Most recent report time
  createdAt: timestamp,
  updatedAt: timestamp,
  resolvedAt: timestamp,                 // When admin took action
  
  // Status
  status: "pending" | "resolved" | "dismissed",
  
  // Cached display data (for quick access)
  // For campaigns:
  campaignTitle?: string,
  campaignImage?: string,
  campaignSlug?: string,
  campaignType?: string,
  creatorId?: string,
  moderationStatus?: string,
  
  // For users:
  username?: string,
  displayName?: string,
  profileImage?: string,
  accountStatus?: string,
}
```

**Report Reasons by Type:**

**Campaign Reports:**
- `inappropriate` - Inappropriate Content
- `spam` - Spam
- `copyright` - Copyright Violation
- `other` - Other

**Profile Reports:**
- `inappropriate_avatar` - Inappropriate Profile Picture
- `offensive_username` - Offensive Username
- `spam_bio` - Spam in Bio/Description
- `impersonation` - Impersonation
- `other` - Other

**Key Features:**
- No individual report documents - all tracked in aggregated summary
- Reason counts show breakdown of why content was reported
- Admin sees percentage distribution (e.g., "80% spam, 20% inappropriate")
- Resets to 0 when admin takes action (dismiss/warn/remove)
- 95% reduction in Firestore reads/writes for admin actions

---

### Warnings Collection (Firestore: `warnings`)
✅ **Status: Implemented** (October 09, 2025)

```javascript
{
  userId: string,                        // User who received warning
  targetType: "campaign" | "profile",
  targetId: string,                      // campaignId or userId
  reportId: string,                      // Related report
  reason: string,
  issuedBy: string,                      // adminId
  issuedAt: timestamp,
  acknowledged: boolean,                 // User read the warning
}
```

**Purpose:**
- Track warning history for admin review
- Does NOT auto-ban users
- Admin manually decides actions based on warning count
- Visible in admin user details panel

---

### In-App Notifications System
✅ **Status: Fully Implemented** (October 2025)

**Notification Document (Firestore: `users/{userId}/notifications/{notificationId}`):**
```javascript
{
  id: string,                            // Auto-generated notification ID
  type: "warning" | "campaign_removed" | "campaign_under_review" | "profile_under_review" | "account_banned" | "appeal_deadline",
  title: string,                         // Notification title
  message: string,                       // Notification message
  actionUrl: string,                     // Deep link to take action
  actionLabel: string,                   // "Appeal Removal", "View Campaign", etc.
  
  // Optional metadata
  campaignId?: string,
  reportId?: string,
  appealDeadline?: timestamp,            // ISO timestamp
  
  // Status tracking
  read: boolean,                         // User has read the notification
  createdAt: timestamp,                  // When notification was sent
}
```

**Purpose:**
- In-app notifications delivered via Firestore real-time listeners
- Notify users about moderation actions instantly
- No browser permissions required
- Notifications appear in NotificationBell and inbox at `/profile/notifications`
- Users can mark as read, delete, and filter by type
- Toast notifications show latest unread notification automatically

---

### Appeals Collection (Firestore: `appeals`)
✅ **Status: Fully Implemented** (October 24, 2025)

```javascript
{
  userId: string,
  type: "campaign" | "account",
  targetId: string,                      // campaignId or userId
  reason: string,                        // User's explanation
  status: "pending" | "approved" | "rejected",
  submittedAt: timestamp,
  reviewedAt?: timestamp,
  reviewedBy?: string,                   // adminId
  adminNotes?: string,
}
```

**Purpose:**
- 30-day appeal window for removed content/banned accounts
- User submission at `/profile/appeals`
- Admin reviews at `/admin/appeals`
- Approve → Restore content/account to `active` status
- Reject → Upgrade to `removed-permanent` or `banned-permanent`

---

### User Schema Updates
✅ **Status: Implemented** (October 09, 2025)

**NEW moderation fields:**
```javascript
{
  // Existing fields...
  
  // Profile Moderation
  moderationStatus: "active" | "under-review" | "under-review-hidden",
  reportsCount: number,
  hiddenAt?: timestamp,
  
  // Account Status
  accountStatus: "active" | "banned-temporary" | "banned-permanent",
  bannedAt?: timestamp,
  banReason?: string,
  appealDeadline?: timestamp,
}
```

**Profile Moderation Rules:**
- **10+ reports** → Auto-hide from public (`under-review-hidden`)
- **Admin dismiss** → Restore to `active`, reset reportsCount to 0
- **Admin ban** → `banned-temporary` for 30 days with appeal
- **Permanent ban** → Delete all data (profile + campaigns)

---

## Moderation Workflows (NEW)

### Campaign Moderation Workflow

1. **Report Received** → `moderationStatus: "under-review"` (still public)
2. **3+ Reports** → `moderationStatus: "under-review-hidden"` (auto-hide)
   - Send notification to creator
   - Campaign invisible to public
3. **Admin Actions:**
   - **Dismiss:** Reset reportsCount to 0, restore to `active`, unhide
   - **Warn:** Create warning record, send notification
   - **Remove:** `removed-temporary` + 30-day appeal deadline
4. **Appeal Process:**
   - Creator appeals within 30 days
   - Admin reviews in `/admin/appeals`
   - Approve → Restore campaign
   - Reject → `removed-permanent` (delete all data)
5. **No Appeal:** After 30 days → Auto-delete permanently

### Profile Moderation Workflow

1. **Report Received** → Track in reportsCount
2. **10+ Reports** → `moderationStatus: "under-review-hidden"` (auto-hide)
   - Send notification to user
   - Profile invisible to public
3. **Admin Actions:**
   - **Dismiss:** Reset reportsCount to 0, restore to `active`, unhide
   - **Warn:** Create warning record, send notification
   - **Ban Account:** `banned-temporary` + 30-day appeal deadline
4. **Ban Message:**
   - User cannot login
   - Shows ban reason + appeal deadline
   - "Appeal" button available
5. **Appeal Process:**
   - User appeals within 30 days
   - Admin reviews in `/admin/appeals`
   - Approve → Restore account
   - Reject → `banned-permanent` + delete all data (profile + campaigns)
6. **No Appeal:** After 30 days → Permanent ban + delete data

---

## User Flows

### Creator Flow - Campaign Creation
✅ **Status: Implemented**

**Route:** `/create` (opens modal) → `/create/frame` or `/create/background`

**Steps:**
1. Click "Create Campaign" → Modal opens with type selection
2. Select Frame or Background
3. **Step 1:** Upload image
   - Frame: PNG with ≥5% transparency (validated automatically)
   - Background: PNG/JPG/WEBP (any format)
   - Max 5MB file size
4. **Step 2:** Fill metadata
   - Title (required)
   - Description (optional)
   - Caption template (optional)
5. Click "Publish"
   - If not logged in → Auth modal appears
   - Form data preserved during auth
6. Save to Firestore + Upload to Supabase
7. Redirect to `/campaign/[slug]`

**Files:**
- `CreateCampaignModal.js` - Type selection modal
- `/create/frame/page.js` - Frame upload workflow
- `/create/background/page.js` - Background upload workflow

---

### Visitor Flow - 3-Page Campaign Usage
✅ **Status: Implemented (October 4, 2025)**

**Architecture:** Upload → Adjust → Result with session persistence

#### Page 1: Upload (`/campaign/[slug]`)
- View campaign preview and details
- See creator info and supporter count
- Upload photo (10MB max, image files only)
- Auto-redirect to `/adjust` after upload

**Features:**
- Campaign details (title, description, creator)
- "Choose Your Photo" button
- Report campaign button
- Ad placeholder slots

#### Page 2: Adjust (`/campaign/[slug]/adjust`)
- Canvas preview of composed image
- Adjustment controls:
  - Zoom slider (0.5x - 3.0x)
  - Drag to reposition
  - Rotate (-45° to +45°)
  - "Fit to Frame" and "Reset" buttons
- Change/remove photo options
- Download button
- Auto-redirect to `/result` after download

**Route Guard:** Requires photo uploaded (redirects to Page 1 if missing)

#### Page 3: Result (`/campaign/[slug]/result`)
- Display final composed image
- Social sharing buttons (Twitter, Facebook, WhatsApp)
- "Re-Download" option
- "Start Over" clears session and returns to Page 1
- ⏸️ "Post to Gallery" (Phase 2 - deferred)

**Route Guard:** Requires download complete (redirects appropriately if not)

**Session Management:**
- Context: `CampaignSessionContext`
- Storage: sessionStorage (24h expiry)
- Data: photo preview (base64), adjustments, campaign/creator data
- Cleanup: Auto-expires or manual "Start Over"

**Files:**
- `CampaignSessionContext.js` - Session state management
- `campaignRouteGuards.js` - Navigation guards
- `/campaign/[slug]/page.js` - Page 1
- `/campaign/[slug]/adjust/page.js` - Page 2
- `/campaign/[slug]/result/page.js` - Page 3
- `/api/campaigns/track-download/route.js` - Download tracking

---

### Campaign Gallery & Discovery
✅ **Status: Implemented**

#### Unified Gallery (`/campaigns`)
Browse all campaigns with filters:
- Type: All / Frames / Backgrounds
- Time: 24h / 7d / 30d / All time
- Sort: Most recent / Most popular
- Grid layout with thumbnails

#### Top Creators (`/creators`)
Leaderboard ranked by total supports:
- Filter by country and time period
- Shows: Avatar, name, campaign count, total supports
- Links to creator profiles

**Files:**
- `/campaigns/page.js` - Gallery page
- `/creators/page.js` - Leaderboard page
- `FilterModal.js` - Shared filter component

---

## Technical Implementation

### Slug Generation
✅ **Status: Implemented (`slugGenerator.js`)**

**Algorithm:**
1. Lowercase and sanitize title
2. Replace spaces with hyphens
3. Remove special characters
4. Limit to 50 characters
5. Append 4-character random suffix (base36)

```javascript
generateSlug("Save Earth 2025") → "save-earth-2025-k8m3"
```

**No uniqueness check needed** - Collision probability: ~1 in 1.7M

---

### Transparency Detection
✅ **Status: Implemented (`transparencyDetector.js`)**

**Algorithm:**
1. Validate PNG format (only format with alpha channel)
2. Load image into Canvas
3. Analyze RGBA pixel data
4. Count pixels with alpha < 255
5. Calculate transparency percentage
6. Validate ≥5% threshold

```javascript
const result = await checkTransparency(file);
if (result.hasTransparency) {
  // Valid frame - proceed
} else {
  // Show error: result.error
}
```

---

### Image Composition
✅ **Status: Implemented (`imageComposition.js`)**

**Canvas API-based composition with real-time adjustments:**

```javascript
// Frame: User photo UNDER frame
drawUserPhoto(ctx, userPhoto, adjustments);
ctx.drawImage(frameImage, 0, 0);

// Background: User photo ON TOP
ctx.drawImage(backgroundImage, 0, 0);
drawUserPhoto(ctx, userPhoto, adjustments);
```

**Features:**
- Load images from File or URL
- Apply scale, position, rotation
- Real-time preview updates
- Export to PNG/JPEG blob
- Mobile touch support (pointer events)

**Functions:**
- `composeImages()` - Create final composition
- `updatePreview()` - Real-time canvas updates
- `calculateFitAdjustments()` - Auto-fit photo
- `downloadCanvas()` - Export as file

---

### Image Optimization
✅ **Status: Implemented (October 05, 2025) - `imageTransform.js`**

**ImageKit.io CDN integration for bandwidth reduction:**

Automatically serves optimized WebP images with appropriate sizes for different use cases through ImageKit.io CDN, reducing bandwidth costs by 89%. Supabase Storage is used only for full-size canvas operations where transparency must be preserved.

**Transformation Presets:**

```javascript
// Campaign Preview (800px width WebP, quality 80) - ~400 KB
// Aspect ratio preserved - works with any image size
getCampaignPreview(imagePath)    // Gallery grids, campaign view pages, campaign cards

// Full-size (original PNG) - ~800 KB - 2.5 MB
getCampaignCanvas(imagePath)     // Canvas operations only

// Avatars (150x150 WebP, quality 80) - ~100 KB
// Square crop from center
getProfileAvatar(imagePath)      // User profile pictures

// Banners (800x200 WebP, quality 85) - ~150 KB
// Aspect ratio crop
getProfileBanner(imagePath)      // Profile page headers
```

**Implementation:**
- ImageKit.io CDN handles transformations (WebP conversion, resizing, quality optimization)
- Campaign images preserve aspect ratio (width-based scaling)
- Profile avatars and banners use fixed dimensions (center crop)
- Supabase Storage provides original images for canvas operations (transparency required)
- Leverages ImageKit.io global CDN for edge caching and fast delivery
- Compatible with Firebase photo URLs (pass-through, no transformation)

**Cost Impact:**
- Before: $520/month at 100k visitors
- After: $56/month at 100k visitors
- Savings: $464/month (89% reduction)

---

### Storage Structure
✅ **Status: Implemented**

**Supabase Storage:**
- Bucket: `uploads`
- Path: `campaigns/{userId}/{campaignId}.png`

**Benefits:**
- Predictable paths for deletion
- One image per campaign
- Easy batch operations by user
- Clear ownership structure

**API Endpoints:**
- `/api/storage/campaign-upload-url` - Get signed upload URL
- `/api/storage/delete` - Delete campaign image
- `/api/storage/signed-url` - Get temporary download URL

**Files:**
- `campaignStorage.js` - Path utilities
- `campaign-upload-url/route.js` - Upload endpoint

---

### Download Tracking
✅ **Status: Implemented**

**Server-side tracking (Firestore transaction):**
1. Increment campaign `supportersCount`
2. Set `firstUsedAt` on first download
3. Create download record in subcollection (with timestamp)
4. Update `updatedAt` timestamp

**Cost-optimized approach:**
- No user tracking in campaign document
- Simple counter increment (prevents document bloat)
- Scales to unlimited downloads

---

## Route Guards & Navigation

✅ **Status: Implemented (`campaignRouteGuards.js`)**

**Guards:**
```javascript
// Adjust page: Requires photo uploaded
requirePhotoUpload(session, router, slug)

// Result page: Requires download complete
requireDownloadComplete(session, router, slug)

// Check session expiry (24h)
isSessionExpired(timestamp)
```

**Flow Enforcement:**
- Direct URL access to `/adjust` → Redirects to `/upload`
- Direct URL access to `/result` → Redirects to appropriate page
- Expired session → Clears data and redirects to `/upload`

---

## Firestore Functions

### Campaign Functions
✅ **Status: Implemented (`firestore.js`)**

- `createCampaign(campaignData, userId)` - Publish new campaign
- `getCampaignBySlug(slug)` - Fetch campaign with creator info
- `getUserCampaigns(userId, limit)` - Get user's campaigns
- `getAllCampaigns(filters)` - Gallery with filters
- `updateCampaign(campaignId, updates, userId)` - Edit metadata
- `deleteCampaign(campaignId, userId)` - Delete campaign + image
- `trackCampaignUsage(campaignId)` - Increment supporters (deprecated, use API)

### Report Functions
✅ **Status: Implemented (`firestore.js`)**

- `createReport(reportData)` - Submit report (anonymous allowed)
- `getReports(filterOptions)` - Admin: fetch all reports
- `getCampaignReports(campaignId)` - Get reports for campaign
- `updateReportStatus(reportId, statusData)` - Admin: review report

### Creator Functions
✅ **Status: Implemented (`firestore.js`)**

- `getTopCreators(filters)` - Leaderboard by supports

---

## Security Rules

### Campaign Creation
```javascript
// Firestore Rules
match /campaigns/{campaignId} {
  allow create: if request.auth != null
    && request.resource.data.creatorId == request.auth.uid
    && request.resource.data.type in ['frame', 'background']
    && request.resource.data.slug is string
    && request.resource.data.title is string;
    
  allow update: if request.auth.uid == resource.data.creatorId
    && onlyUpdatingFields(['title', 'description', 'captionTemplate', 'updatedAt']);
    
  allow delete: if request.auth.uid == resource.data.creatorId;
}
```

### Report Submission
```javascript
match /reports/{reportId} {
  allow create: if request.resource.data.reason in ['inappropriate', 'spam', 'copyright', 'other']
    && request.resource.data.campaignId is string;
}
```

---

## Mobile Optimization

### Touch Interactions (Adjust Page)
✅ **Status: Implemented**

**Problem:** Blue highlight overlay on mobile touch

**Solution:**
```css
.canvas-container {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
```

```javascript
// Use pointer events (unified mouse/touch)
canvas.addEventListener('pointerdown', handleDragStart);
canvas.addEventListener('pointermove', handleDragMove);
canvas.addEventListener('pointerup', handleDragEnd);
```

---

## Implementation Status

### ✅ Phase 1: Complete (October 4, 2025)

**Core Campaign System:**
- [x] CreateCampaignModal (type selection)
- [x] Frame upload with transparency detection
- [x] Background upload (multi-format)
- [x] Slug generation
- [x] Campaign storage (Supabase)
- [x] Campaign metadata (Firestore)

**3-Page Visitor Flow:**
- [x] Page 1: Upload page
- [x] Page 2: Adjust page (canvas + controls)
- [x] Page 3: Result page (share + download)
- [x] Session management (Context + sessionStorage)
- [x] Route guards
- [x] Download tracking API

**Discovery:**
- [x] Campaigns gallery with filters
- [x] Top creators leaderboard
- [x] Report system (backend ready)

**Utilities:**
- [x] Image composition (Canvas API)
- [x] Transparency detector
- [x] Slug generator
- [x] Campaign storage helpers

---

### ✅ Phase 2: Admin Dashboard Complete (October 8, 2025)

**Admin Dashboard - COMPLETED:**
- [x] Admin role field in user profiles
- [x] Admin middleware protection (adminAuth.js)
- [x] Report management UI (table + filters + details panel)
- [x] Campaign moderation UI (grid + actions + status updates)
- [x] User management UI (search + role assignment + ban/unban)
- [x] Platform analytics dashboard (metrics + aggregation queries)
- [x] Admin utilities (helpers + validation + action button component)

**Enhanced Features - PENDING (Future):**
- [ ] User-submitted gallery posts ("Post to Twibbonize")
- [ ] Campaign edit UI (7-day / 10-supporter window)
- [ ] Campaign deletion UI with confirmation
- [ ] Privacy status toggle (public/private)
- [ ] Background removal for visitors
- [ ] Campaign external link field
- [ ] In-app frame creator/editor

**Analytics & Ads - PENDING (Future):**
- [ ] Event tracking (upload, download, share)
- [ ] Drop-off analysis
- [ ] AdSense integration
- [ ] A/B testing framework

---

## Admin Dashboard System (Phase 2)

### Overview
**Status:** ✅ Completed (October 8, 2025)

The admin dashboard provides platform moderators with tools to manage reports, campaigns, users, and monitor platform health. Access is restricted to users with `role: "admin"` in their profile.

**All features fully implemented and functional.**

---

### Features

#### 1. Reports Management (`/admin/reports`)
**Purpose:** Review and moderate user-submitted reports

**Functionality:**
- View all reports with filters (status, reason, date)
- Quick campaign preview (thumbnail + metadata)
- One-click actions: Dismiss, Remove campaign, Warn creator
- Bulk operations for multiple reports
- Filter by: pending, reviewed, resolved, dismissed
- Search by campaign slug or reporter ID

**Layout:**
- Table view with pagination (20 per page)
- Columns: Report ID, Campaign, Reason, Status, Created, Actions
- Side panel: Full report details + campaign preview

---

#### 2. Campaign Moderation (`/admin/campaigns`)
**Purpose:** Manage flagged and active campaigns

**Functionality:**
- View all campaigns with moderation status filter
- Quick actions: Remove, Under Review, Restore
- View campaign reports (inline)
- Edit campaign metadata (admin override)
- Delete campaigns (permanent + image cleanup)
- Filter by: active, under-review, removed
- Sort by: reports count, creation date, supporters

**Layout:**
- Grid view with status badges
- Card: Thumbnail, title, creator, supporters, reports count
- Modal: Full campaign details + all reports

---

#### 3. User Management (`/admin/users`)
**Purpose:** Manage user accounts and roles

**Functionality:**
- View all users with search
- Assign/revoke admin role
- View user stats (campaigns created, reports filed)
- Ban/unban users (prevents login)
- View user's campaigns
- Filter by: all, admins, banned

**Layout:**
- Table view with pagination
- Columns: Avatar, Name, Email, Role, Campaigns, Supports, Actions
- Modal: User details + activity history

---

#### 4. Platform Analytics (`/admin/analytics`)
**Purpose:** Monitor platform metrics and health

**Functionality:**
- Total campaigns (active, removed, under-review)
- Total users (creators, supporters)
- Reports statistics (pending, resolved rate)
- Daily/weekly/monthly trends
- Top creators leaderboard
- Most reported campaigns

**Layout:**
- Dashboard with metric cards
- Charts: Line graphs for trends, bar charts for top items
- Date range selector (7d, 30d, 90d, all time)

---

### Security & Access Control

#### Admin Role Implementation

**1. User Schema Update (`src/lib/firestore.js`):**
```javascript
// User profile schema
{
  uid: string,
  email: string,
  displayName: string,
  username: string,
  role: "admin" | "user",  // NEW FIELD (default: "user")
  // ... other fields
}
```

**2. Admin Assignment Function:**
```javascript
// firestore.js
export async function setUserRole(userId, role, adminId) {
  // Verify adminId is admin
  // Update user's role field
  // Log action
}
```

**3. Firestore Security Rules:**
```javascript
// firestore.rules
match /users/{userId} {
  allow update: if request.auth != null
    && request.auth.uid == userId
    && !request.resource.data.diff(resource.data).hasAny(['role']);
    
  // Only admins can update roles (enforced in app layer)
}
```

#### Middleware Protection

**Admin Middleware (`src/middleware/adminAuth.js`):**
```javascript
export async function requireAdmin(req) {
  const token = req.headers.authorization;
  const decodedToken = await verifyIdToken(token);
  const user = await getUserProfile(decodedToken.uid);
  
  if (user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return user;
}
```

**Usage in API Routes:**
```javascript
// /api/admin/*/route.js
import { requireAdmin } from '@/middleware/adminAuth';

export async function GET(request) {
  await requireAdmin(request); // Throws if not admin
  // ... admin-only logic
}
```

---

### File Structure

```
src/
├── app/
│   ├── (chrome)/
│   │   └── admin/
│   │       ├── layout.js                    # Admin layout with sidebar
│   │       ├── page.js                      # Analytics dashboard (default)
│   │       ├── reports/
│   │       │   ├── page.js                  # Reports table + filters
│   │       │   └── [reportId]/
│   │       │       └── page.js              # Report details modal
│   │       ├── campaigns/
│   │       │   ├── page.js                  # Campaigns grid + filters
│   │       │   └── [campaignId]/
│   │       │       └── page.js              # Campaign moderation view
│   │       └── users/
│   │           ├── page.js                  # Users table + search
│   │           └── [userId]/
│   │               └── page.js              # User details + actions
│   └── api/
│       └── admin/
│           ├── reports/
│           │   ├── route.js                 # GET all reports
│           │   └── [reportId]/
│           │       └── route.js             # PATCH update report status
│           ├── campaigns/
│           │   ├── route.js                 # GET all campaigns (admin view)
│           │   └── [campaignId]/
│           │       ├── route.js             # PATCH moderate campaign
│           │       └── delete/
│           │           └── route.js         # DELETE remove campaign
│           ├── users/
│           │   ├── route.js                 # GET all users
│           │   └── [userId]/
│           │       ├── role/
│           │       │   └── route.js         # PATCH set user role
│           │       └── ban/
│           │           └── route.js         # PATCH ban/unban user
│           └── analytics/
│               └── route.js                 # GET platform stats
├── components/
│   └── admin/
│       ├── AdminSidebar.js                  # Navigation sidebar
│       ├── AdminHeader.js                   # Top header with user menu
│       ├── ReportsTable.js                  # Reports data table
│       ├── ReportDetailsPanel.js            # Report details side panel
│       ├── CampaignModerationCard.js        # Campaign card with actions
│       ├── UsersTable.js                    # Users data table
│       ├── UserDetailsModal.js              # User info modal
│       ├── AnalyticsCard.js                 # Metric display card
│       ├── AnalyticsChart.js                # Chart component
│       └── AdminActionButton.js             # Reusable action button
├── middleware/
│   └── adminAuth.js                         # Admin authentication middleware
├── lib/
│   ├── firebaseAdmin.js                     # Add Firestore admin export
│   └── firestore.js                         # Add admin-only functions
└── utils/
    └── admin/
        ├── adminHelpers.js                  # Admin utility functions
        └── adminValidation.js               # Input validation for admin actions
```

---

### API Endpoints

#### Reports Management

**GET `/api/admin/reports`**
- Query params: `?status=pending&limit=20&offset=0`
- Returns: Array of reports with campaign/reporter details
- Auth: Admin only

**PATCH `/api/admin/reports/[reportId]`**
- Body: `{ status: "resolved", action: "removed", reviewedBy: adminId }`
- Updates report status and records action
- Auth: Admin only

---

#### Campaign Moderation

**GET `/api/admin/campaigns`**
- Query params: `?moderationStatus=under-review&limit=20`
- Returns: Campaigns with extended metadata
- Auth: Admin only

**PATCH `/api/admin/campaigns/[campaignId]`**
- Body: `{ moderationStatus: "removed", removedBy: adminId, removeReason: "Inappropriate content" }`
- Updates campaign moderation status
- Auth: Admin only

**DELETE `/api/admin/campaigns/[campaignId]/delete`**
- Permanently deletes campaign + Supabase image
- Records deletion in audit log
- Auth: Admin only

---

#### User Management

**GET `/api/admin/users`**
- Query params: `?search=john&role=admin&limit=50`
- Returns: User list with stats
- Auth: Admin only

**PATCH `/api/admin/users/[userId]/role`**
- Body: `{ role: "admin", updatedBy: adminId }`
- Sets user role (admin/user)
- Auth: Admin only

**PATCH `/api/admin/users/[userId]/ban`**
- Body: `{ banned: true, reason: "Spam", bannedBy: adminId }`
- Bans or unbans user
- Auth: Admin only

---

#### Analytics

**GET `/api/admin/analytics`**
- Query params: `?period=30d`
- Returns: Platform metrics and trends
- Auth: Admin only

---

### Firestore Functions (Admin-Only)

Add to `src/lib/firestore.js`:

```javascript
// Reports
export async function getAllReportsAdmin(filters) {
  // Fetch reports with filters (admin access)
}

export async function updateReportAdmin(reportId, updates, adminId) {
  // Update report with admin user tracking
}

// Campaigns
export async function getAllCampaignsAdmin(filters) {
  // Fetch campaigns with extended metadata
}

export async function moderateCampaign(campaignId, moderationData, adminId) {
  // Update campaign moderation status
}

export async function deleteCampaignAdmin(campaignId, adminId) {
  // Permanently delete campaign + image
}

// Users
export async function getAllUsersAdmin(filters) {
  // Fetch all users with stats
}

export async function setUserRole(userId, role, adminId) {
  // Assign admin/user role
}

export async function banUser(userId, banData, adminId) {
  // Ban or unban user
}

// Analytics
export async function getPlatformStats(period) {
  // Calculate platform metrics
}
```

---

### Firebase Admin Setup

Update `src/lib/firebaseAdmin.js`:

```javascript
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore'; // NEW

const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp); // NEW
```

**Usage:**
- Use `adminFirestore` for server-side queries in admin API routes
- Bypasses security rules (full database access)
- Required for aggregation queries and batch operations

---

### UI Components

#### AdminSidebar
- Links: Analytics, Reports, Campaigns, Users
- Active state indication
- Admin user info at bottom
- Logout button

#### ReportsTable
- Columns: ID, Campaign (thumbnail + title), Reason, Reporter, Status, Date, Actions
- Filters: Status dropdown, reason dropdown
- Pagination controls
- Click row → Opens ReportDetailsPanel

#### CampaignModerationCard
- Campaign thumbnail with type badge
- Title, creator, supporters, reports count
- Status badge (active/under-review/removed)
- Quick actions: View Reports, Remove, Restore
- Click → Opens campaign details modal

#### UsersTable
- Columns: Avatar, Display Name, Email, Role, Campaigns, Supports, Joined, Actions
- Search bar (name/email)
- Filter: All, Admins, Banned
- Actions: Make Admin, Ban, View Campaigns

---

### Implementation Status

**✅ Phase 2A - COMPLETED (Critical):**
1. ✅ Admin role field + assignment function
2. ✅ Middleware authentication
3. ✅ Reports management UI + API
4. ✅ Campaign moderation UI + API

**✅ Phase 2B - COMPLETED (Important):**
5. ✅ User management UI + API
6. ✅ Platform analytics dashboard
7. ⏸️ Audit logging system (deferred)

**⏸️ Phase 2C - NOT IMPLEMENTED (Nice to Have):**
8. ⏸️ Bulk actions for reports/campaigns
9. ⏸️ Advanced analytics (charts, trends)
10. ⏸️ Export data (CSV reports)

---

## Best Practices & Recommendations

### Performance Optimization
⚠️ **Recommended for Production**

1. **Image Optimization** ✅ (Completed)
   - ImageKit.io CDN with WebP transformations
   - Smart resizing with imageTransform.js utility
   - Thumbnails for gallery, full resolution for canvas
   - **Impact:** Significant bandwidth cost reduction through optimized delivery

2. **Lazy Loading**
   - Load images on scroll in gallery
   - Defer ad scripts until page ready
   - Code-split routes for faster initial load

3. **Caching Strategy**
   - Cache campaign metadata in browser (5min)
   - CDN cache images (365 days with version param)
   - Service worker for offline support

### Security Hardening
⚠️ **Recommended for Production**

1. **Rate Limiting**
   - Campaign creation: 5 per hour per user
   - Report submission: 10 per hour per IP
   - Download tracking: 100 per hour per campaign

2. **Content Validation**
   - Server-side file type re-validation
   - Image dimension limits (max 4000x4000)
   - Malware scanning for uploads
   - NSFW content detection

3. **Auth Improvements**
   - Email verification required for publishing
   - reCAPTCHA on report submission
   - Admin role verification middleware

### Data Integrity
⚠️ **Recommended for Production**

1. **Backup Strategy**
   - Daily Firestore exports
   - Weekly Supabase backup
   - Deleted campaign archive (30-day retention)

2. **Error Handling**
   - Retry logic for Firestore writes
   - Fallback for image load failures
   - User-friendly error messages
   - Error tracking (Sentry/LogRocket)

3. **Data Validation**
   - Schema validation on all writes
   - Sanitize user input (title, description)
   - XSS protection on rendered content

### Monitoring & Analytics
⚠️ **Recommended for Production**

1. **Core Metrics**
   - Campaign creation rate
   - Visitor completion rate (3-page flow)
   - Average time per page
   - Drop-off points
   - Download success rate

2. **Performance Metrics**
   - Page load time (target: <2s)
   - Canvas rendering time (target: <1s)
   - API response time (target: <500ms)
   - Error rate (target: <1%)

3. **Business Metrics**
   - Active campaigns
   - Daily active users
   - Top performing campaigns
   - Creator retention
   - Revenue per visit (with ads)

### Scalability Considerations
⚠️ **Prepare for Growth**

1. **Database Optimization**
   - Add composite indexes for filtered queries
   - Consider pagination for large galleries (>1000 campaigns)
   - Archive inactive campaigns (>6 months, 0 downloads)

2. **Storage Optimization**
   - Image compression before upload (client-side)
   - Delete old campaign images after deletion
   - Monitor Supabase storage quota

3. **Infrastructure**
   - Implement CDN for static assets
   - Database read replicas for heavy queries
   - Horizontal scaling for API routes

---

## Testing Checklist

### Creator Flow
- [ ] Upload frame with transparency → Success
- [ ] Upload frame without transparency → Error shown
- [ ] Upload background (PNG/JPG/WEBP) → Success
- [ ] File size >5MB → Error shown
- [ ] Unauthenticated publish → Auth modal appears
- [ ] Auth modal "Go Back" → Returns to form
- [ ] Auth modal "Sign In" → Preserves form data
- [ ] Publish success → Redirects to campaign page

### Visitor Flow
- [ ] Complete flow: Upload → Adjust → Result
- [ ] Direct URL to `/adjust` without photo → Redirects to upload
- [ ] Direct URL to `/result` without download → Redirects appropriately
- [ ] Page reload on each page → Session persists
- [ ] Session >24h old → Clears and redirects
- [ ] "Start Over" → Clears session and returns to upload
- [ ] Download button → Increments supportersCount
- [ ] Canvas adjustments (zoom, drag, rotate) → Works smoothly
- [ ] Mobile touch → No blue highlight, smooth interaction

### Discovery
- [ ] Gallery filters (type, time, sort) → Works correctly
- [ ] Creators filter (country, time) → Works correctly
- [ ] Campaign cards link to correct campaign
- [ ] Empty state shows when no results

### Reports
- [ ] Submit report without auth → Success
- [ ] Submit report with auth → Success
- [ ] Duplicate report prevention → Works
- [ ] Report increments reportsCount → Verified
- [ ] 3+ reports sets moderationStatus → Verified

---

## File Structure

```
src/
├── app/
│   ├── (chrome)/
│   │   ├── campaign/
│   │   │   └── [slug]/
│   │   │       ├── page.js              # Page 1: Upload
│   │   │       ├── adjust/
│   │   │       │   └── page.js          # Page 2: Adjust
│   │   │       └── result/
│   │   │           └── page.js          # Page 3: Result
│   │   ├── campaigns/
│   │   │   └── page.js                  # Gallery
│   │   ├── create/
│   │   │   ├── page.js                  # Opens modal
│   │   │   ├── frame/
│   │   │   │   └── page.js              # Frame upload
│   │   │   └── background/
│   │   │       └── page.js              # Background upload
│   │   └── creators/
│   │       └── page.js                  # Top creators
│   └── api/
│       ├── campaigns/
│       │   └── track-download/
│       │       └── route.js             # Download tracking
│       └── storage/
│           ├── campaign-upload-url/
│           │   └── route.js             # Campaign upload URL
│           ├── delete/
│           │   └── route.js             # Delete image
│           └── signed-url/
│               └── route.js             # Temporary download URL
├── components/
│   ├── CampaignStepIndicator.js         # Progress indicator
│   ├── CreateCampaignModal.js           # Type selection
│   └── FilterModal.js                   # Shared filter UI
├── contexts/
│   └── CampaignSessionContext.js        # Session state management
├── lib/
│   ├── firestore.js                     # All Firestore functions
│   ├── firebase-optimized.js            # Firebase client init
│   ├── firebaseAdmin.js                 # Firebase admin (server)
│   └── supabase.js                      # Supabase client
└── utils/
    ├── campaignRouteGuards.js           # Navigation guards
    ├── campaignStorage.js               # Storage path helpers
    ├── imageComposition.js              # Canvas composition
    ├── slugGenerator.js                 # Slug generation
    └── transparencyDetector.js          # Transparency check
```

---

**Last Updated:** October 05, 2025  
**Contributors:** Campaign system fully implemented in Phase 1  
**Next Steps:** See TASKS.md for Phase 2 roadmap
