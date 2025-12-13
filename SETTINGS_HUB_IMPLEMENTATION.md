# Settings Hub Implementation Plan

**Created:** December 13, 2025  
**Status:** Ready for Implementation  
**Estimated Time:** 1-2 weeks  
**Priority:** Phase 1

---

## 1. Executive Summary

This document provides a detailed implementation plan for the Settings Hub feature. The Settings Hub will be a centralized location for users to manage their account security, privacy controls, and preferences - separate from profile editing (`/profile/edit`).

### What This Includes
- `/settings` - Main hub with sidebar navigation (redirects to `/settings/account`)
- `/settings/account` - Account & Security management
- `/settings/privacy` - Privacy & Data controls
- `/settings/preferences` - User preferences (theme, language, etc.)

### What This Does NOT Include
- Notification preferences (notifications are mandatory for moderation)
- Profile editing (stays at `/profile/edit`)

---

## 2. Architecture Overview

### 2.1 Route Structure

```
src/app/(chrome)/settings/
├── layout.js           # Settings layout with sidebar (similar to admin layout)
├── page.js             # Redirects to /settings/account
├── account/
│   └── page.js         # Account & Security settings
├── privacy/
│   └── page.js         # Privacy & Data settings
└── preferences/
    └── page.js         # User preferences
```

### 2.2 Component Structure

```
src/components/settings/
├── SettingsSidebar.js  # Sidebar navigation (similar to AdminSidebar)
├── SettingsHeader.js   # Header with breadcrumbs
├── SettingsCard.js     # Reusable settings section card
├── SettingsToggle.js   # Toggle switch component
├── SettingsInput.js    # Input field with validation
└── SettingsSection.js  # Section wrapper with title/description
```

### 2.3 API Routes

```
src/app/api/settings/
├── account/
│   ├── password/route.js       # Change password
│   ├── email/route.js          # Update email
│   ├── sessions/route.js       # Manage active sessions
│   └── delete/route.js         # Delete account
├── privacy/
│   ├── visibility/route.js     # Profile visibility settings
│   ├── export/route.js         # Export user data (GDPR)
│   └── indexing/route.js       # Search engine indexing
└── preferences/
    └── route.js                # Save user preferences
```

---

## 3. Database Schema Updates

### 3.1 User Document Extensions (Firestore: `users/{userId}`)

```javascript
{
  // Existing fields...
  
  // NEW: Privacy Settings
  privacySettings: {
    profileVisibility: "public" | "private",  // Default: "public"
    showInCreatorLeaderboard: true,           // Default: true
    allowSearchEngineIndexing: true,          // Default: true
    showSupportCount: true,                   // Default: true
  },
  
  // NEW: User Preferences
  preferences: {
    theme: "light" | "dark" | "system",       // Default: "system"
    language: "en",                           // Default: "en"
    timezone: "auto",                         // Default: "auto"
  },
  
  // NEW: Security tracking
  security: {
    lastPasswordChange: timestamp,
    twoFactorEnabled: false,                  // Future enhancement
    activeSessions: [],                       // Future enhancement
  },
  
  // Existing fields remain unchanged
}
```

### 3.2 Sessions Collection (Future - for session management)

```javascript
// Firestore: `users/{userId}/sessions/{sessionId}`
{
  deviceInfo: string,       // Browser/device info
  ipAddress: string,        // Hashed IP
  location: string,         // Approximate location
  createdAt: timestamp,
  lastActiveAt: timestamp,
  isCurrent: boolean,
}
```

---

## 4. Detailed Implementation Plan

### 4.1 Phase 1A: Settings Layout & Navigation (2-3 days)

#### Task 1: Create Settings Layout
**File:** `src/app/(chrome)/settings/layout.js`

```javascript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/components/UserProfileProvider";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import PageLoader from "@/components/PageLoader";

export default function SettingsLayout({ children }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: profileLoading } = useUserProfile();
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
  }, [user, authLoading, router]);
  
  if (authLoading || profileLoading) {
    return <PageLoader message="Loading settings..." />;
  }
  
  if (!user) {
    return <PageLoader message="Redirecting to sign in..." />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <div className="flex flex-col lg:flex-row gap-8">
          <SettingsSidebar user={{ ...user, ...userProfile }} />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
```

#### Task 2: Create Settings Sidebar
**File:** `src/components/settings/SettingsSidebar.js`

**Design Pattern:** Follow `AdminSidebar.js` structure but with:
- Light theme (not dark like admin)
- Vertical layout for desktop, horizontal tabs for mobile
- Active state with emerald color
- Icons from existing SVG patterns

**Navigation Items:**
```javascript
const navItems = [
  {
    name: "Account & Security",
    href: "/settings/account",
    icon: LockIcon,
    description: "Password, email, sessions"
  },
  {
    name: "Privacy & Data",
    href: "/settings/privacy",
    icon: ShieldIcon,
    description: "Visibility, data export"
  },
  {
    name: "Preferences",
    href: "/settings/preferences",
    icon: CogIcon,
    description: "Theme, language"
  },
];
```

#### Task 3: Create Settings Page (Redirect)
**File:** `src/app/(chrome)/settings/page.js`

```javascript
import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/settings/account');
}

export const metadata = {
  title: "Settings - Twibbonize",
  description: "Manage your account settings",
};
```

---

### 4.2 Phase 1B: Account & Security Page (3-4 days)

#### Task 4: Create Account Settings Page
**File:** `src/app/(chrome)/settings/account/page.js`

**Sections:**
1. **Email Management**
   - Display current email (read-only with edit button)
   - Email change flow with verification

2. **Password Management**
   - Current password verification
   - New password with strength indicator
   - Confirm password

3. **Active Sessions** (Phase 2 - placeholder for now)
   - List of active sessions with device info
   - "Sign out all devices" button

4. **Account Deletion**
   - Danger zone section
   - Confirmation modal with typed confirmation ("DELETE")
   - 30-day grace period before permanent deletion

**UI Pattern:** Follow `/profile/edit/page.js` structure:
- Yellow header with title
- White content card with sections
- Form validation with error messages
- Success/error toasts

#### Task 5: Create Password Change API
**File:** `src/app/api/settings/account/password/route.js`

```javascript
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { verifyIdToken } from '@/middleware/adminAuth';

export async function POST(request) {
  // 1. Verify user is authenticated
  // 2. Verify current password
  // 3. Validate new password strength
  // 4. Update password via Firebase Admin SDK
  // 5. Invalidate other sessions (optional)
  // 6. Return success/error
}
```

#### Task 6: Create Account Deletion API
**File:** `src/app/api/settings/account/delete/route.js`

**Deletion Process:**
1. Verify user identity
2. Mark account for deletion (30-day grace period)
3. Send confirmation email
4. Schedule cleanup cron job

---

### 4.3 Phase 1C: Privacy & Data Page (2-3 days)

#### Task 7: Create Privacy Settings Page
**File:** `src/app/(chrome)/settings/privacy/page.js`

**Sections:**
1. **Profile Visibility**
   - Toggle: Public / Private profile
   - Toggle: Show in creator leaderboard
   - Toggle: Show support count

2. **Search Engine Indexing**
   - Toggle: Allow search engines to index profile

3. **Data Export (GDPR)**
   - Button: "Request Data Export"
   - Generates JSON/ZIP with all user data
   - Includes: profile, campaigns, notifications

4. **Connected Apps** (Future)
   - Placeholder for OAuth connections

#### Task 8: Create Privacy APIs
**File:** `src/app/api/settings/privacy/visibility/route.js`

```javascript
export async function PATCH(request) {
  // 1. Verify authentication
  // 2. Validate settings
  // 3. Update user document
  // 4. Return updated settings
}
```

**File:** `src/app/api/settings/privacy/export/route.js`

```javascript
export async function POST(request) {
  // 1. Verify authentication
  // 2. Gather all user data (profile, campaigns, notifications)
  // 3. Generate JSON export
  // 4. Return download link or initiate download
}
```

---

### 4.4 Phase 1D: Preferences Page (1-2 days)

#### Task 9: Create Preferences Page
**File:** `src/app/(chrome)/settings/preferences/page.js`

**Sections:**
1. **Appearance**
   - Theme selector: Light / Dark / System

2. **Language** (Placeholder for i18n)
   - Dropdown: English (more languages future)

3. **Time Zone**
   - Auto-detect or manual selection

**Note:** Theme implementation requires:
- CSS variables in `globals.css`
- Theme context provider
- localStorage persistence

#### Task 10: Create Preferences API
**File:** `src/app/api/settings/preferences/route.js`

```javascript
export async function PATCH(request) {
  // 1. Verify authentication
  // 2. Validate preferences
  // 3. Update user document
  // 4. Return updated preferences
}
```

---

## 5. Reusable Components

### 5.1 SettingsCard Component
**File:** `src/components/settings/SettingsCard.js`

```javascript
export default function SettingsCard({ title, description, children, danger = false }) {
  return (
    <div className={`bg-white rounded-xl border ${danger ? 'border-red-200' : 'border-gray-200'} shadow-sm overflow-hidden`}>
      <div className={`px-6 py-4 border-b ${danger ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`text-lg font-semibold ${danger ? 'text-red-700' : 'text-gray-900'}`}>{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
}
```

### 5.2 SettingsToggle Component
**File:** `src/components/settings/SettingsToggle.js`

```javascript
export default function SettingsToggle({ label, description, checked, onChange, disabled = false }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-emerald-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}
```

---

## 6. Security Considerations

### 6.1 Authentication Requirements
- All settings pages require authentication
- Password changes require current password verification
- Account deletion requires typed confirmation + password
- Email changes require re-authentication

### 6.2 Rate Limiting
- Password change: 3 attempts per hour
- Email change: 1 per 24 hours
- Data export: 1 per 24 hours
- Account deletion: 1 pending request at a time

### 6.3 Audit Logging
Log all sensitive actions to `users/{userId}/activityLog`:
- Password changes
- Email changes
- Privacy setting changes
- Data exports
- Account deletion requests

---

## 7. UI/UX Consistency

### 7.1 Follow Existing Patterns
- **Header Style:** Yellow background with emerald text (like `/profile/edit`)
- **Card Style:** White with gray border, rounded-xl
- **Button Style:** Use `btn-base` + variant classes from `BUTTON_STYLE_GUIDE.md`
- **Form Validation:** Red border + error message below field
- **Loading States:** Emerald spinner with message
- **Success Feedback:** Green toast notification
- **Danger Zone:** Red border, red header background

### 7.2 Responsive Design
- **Desktop:** Sidebar on left, content on right
- **Tablet:** Sidebar collapses to icons
- **Mobile:** Horizontal tabs at top, content below

### 7.3 Accessibility
- All toggles have proper `role="switch"` and `aria-checked`
- Form fields have associated labels
- Keyboard navigation support
- Focus indicators on all interactive elements

---

## 8. Implementation Order

### Week 1: Foundation
1. ✅ Create settings layout structure
2. ✅ Create SettingsSidebar component
3. ✅ Create reusable components (Card, Toggle, Input)
4. ✅ Create Account page skeleton
5. ✅ Implement password change functionality

### Week 2: Core Features
6. ✅ Implement email change functionality
7. ✅ Create Privacy settings page
8. ✅ Implement visibility toggles
9. ✅ Implement data export
10. ✅ Create Preferences page
11. ✅ Add account deletion (with confirmation)

### Future Enhancements (Post-Launch)
- Two-factor authentication (2FA)
- Session management (view/revoke sessions)
- Theme implementation (dark mode)
- Multi-language support (i18n)
- Connected apps/OAuth management

---

## 9. Testing Checklist

### Functional Tests
- [ ] Settings layout loads correctly
- [ ] Sidebar navigation works on all screen sizes
- [ ] Password change with correct current password
- [ ] Password change rejected with wrong current password
- [ ] Email change triggers verification
- [ ] Privacy toggles save correctly
- [ ] Data export generates valid JSON
- [ ] Account deletion shows proper confirmation
- [ ] Preferences persist after page reload

### Security Tests
- [ ] Unauthenticated users redirected to signin
- [ ] Rate limiting works on sensitive endpoints
- [ ] Password validation enforces minimum requirements
- [ ] Activity logging captures all actions

### UI/UX Tests
- [ ] Mobile responsive layout
- [ ] Loading states display correctly
- [ ] Error messages are clear and helpful
- [ ] Success feedback shows after actions
- [ ] Keyboard navigation works

---

## 10. Files to Create/Modify

### New Files
```
src/app/(chrome)/settings/
├── layout.js
├── page.js
├── account/page.js
├── privacy/page.js
└── preferences/page.js

src/components/settings/
├── SettingsSidebar.js
├── SettingsCard.js
├── SettingsToggle.js
└── SettingsSection.js

src/app/api/settings/
├── account/
│   ├── password/route.js
│   ├── email/route.js
│   └── delete/route.js
├── privacy/
│   ├── visibility/route.js
│   └── export/route.js
└── preferences/route.js
```

### Modified Files
```
src/lib/firestore.js         # Add settings update functions
src/components/Header.js      # Add Settings link to user menu
TASKS.md                      # Update Phase 1 status
replit.md                     # Update with settings architecture
CODEBASE_STRUCTURE.md         # Add settings files documentation
```

---

## 11. Dependencies

### No New Packages Required
All functionality can be built with existing dependencies:
- Firebase Admin SDK (password management)
- Next.js API routes (backend)
- Tailwind CSS (styling)
- Existing component patterns

---

## 12. Success Criteria

Phase 1 is complete when:
1. Users can access `/settings` and see the settings hub
2. Users can change their password
3. Users can control profile visibility
4. Users can export their data
5. Users can access preferences (theme placeholder)
6. Account deletion flow works with proper confirmation
7. All pages are responsive and accessible
8. Documentation is updated

---

**End of Implementation Plan**
