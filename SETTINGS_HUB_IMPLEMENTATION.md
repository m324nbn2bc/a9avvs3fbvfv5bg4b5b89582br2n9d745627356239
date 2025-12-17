# Settings Hub Implementation Plan

**Created:** December 13, 2025  
**Updated:** December 17, 2025  
**Status:** Phase 1 Complete (All Settings Hub Features)  
**Estimated Time:** 1-2 weeks  
**Priority:** Phase 1

### Code Quality Improvements (December 17, 2025)

The following improvements have been made to ensure consistency and maintainability:
- ✅ All Settings API routes now use the centralized `requireUser` middleware from `src/middleware/userAuth.js`
  - Eliminates duplicated authentication logic across API routes
  - Provides consistent error handling and banned user checks
  - Reduces code duplication and improves maintainability
- ✅ Standardized Firestore imports across all files
  - All files now use `adminDb` from `@/lib/firebaseAdmin` consistently
  - Removed usage of `adminFirestore()` function in favor of direct `adminDb` access

### Phase 1D Implementation Complete (December 17, 2025)

The following items have been implemented:
- ✅ Preferences API (`src/app/api/settings/preferences/route.js`)
  - GET: Fetch current preferences (theme, language)
  - PATCH: Update preferences
- ✅ Preferences page updated with full functionality
  - Loads preferences from Firestore on page load
  - Auto-saves theme selection with optimistic updates
  - Auto-saves language selection with optimistic updates
  - Shows save status feedback (success/error)
  - Disabled state while saving to prevent race conditions

### Phase 1C Implementation Complete (December 17, 2025)

The following items have been implemented:
- ✅ Privacy Visibility API (`src/app/api/settings/privacy/visibility/route.js`)
  - GET: Fetch current privacy settings
  - PATCH: Update privacy settings (profileVisibility, showInCreatorLeaderboard, allowSearchEngineIndexing, showSupportCount)
- ✅ Data Export API (`src/app/api/settings/privacy/export/route.js`)
  - POST: Export all user data (profile, campaigns, notifications) as JSON
  - GDPR-compliant data export functionality
- ✅ Privacy Settings page updated with full functionality
  - Loads settings from Firestore on page load
  - Auto-saves on toggle with optimistic updates
  - Shows save status feedback (success/error)
  - Data export downloads JSON file directly

### Phase 1B Implementation Complete (December 17, 2025)

The following items have been implemented:
- ✅ Account Deletion API (`src/app/api/settings/account/delete/route.js`)
  - POST: Request account deletion (30-day grace period)
  - DELETE: Cancel deletion request
  - GET: Check deletion status
- ✅ Account Settings page updated with full deletion functionality
  - Confirmation modal before deletion
  - Shows pending deletion status with scheduled date
  - Cancel deletion button when deletion is pending
- ✅ Uses existing ConfirmationModal component for consistent UX

### Phase 1A Implementation Complete (December 17, 2025)

The following items have been implemented:
- ✅ User authentication middleware (`src/middleware/userAuth.js`)
- ✅ Settings layout with sidebar (`src/app/(chrome)/settings/layout.js`)
- ✅ Settings redirect page (`src/app/(chrome)/settings/page.js`)
- ✅ SettingsSidebar component (`src/components/settings/SettingsSidebar.js`)
- ✅ Reusable components: SettingsCard, SettingsToggle, SettingsSection
- ✅ Account Settings page with password change (`src/app/(chrome)/settings/account/page.js`)
- ✅ Privacy Settings page with toggles (`src/app/(chrome)/settings/privacy/page.js`)
- ✅ Preferences page with theme/language placeholders (`src/app/(chrome)/settings/preferences/page.js`)
- ✅ Settings link added to MobileMenu.js
- ✅ Fixed AuthenticatedLayout to always provide UserProfileProvider wrapper

**Note:** Requires Firebase configuration for full functionality. Password change uses client-side Firebase Auth with reauthentication.

---

## 1. Executive Summary

This document provides a detailed implementation plan for the Settings Hub feature. The Settings Hub will be a centralized location for users to manage their account security, privacy controls, and preferences - separate from profile editing (`/profile/edit`).

### What This Includes
- `/settings` - Main hub with sidebar navigation (redirects to `/settings/account`)
- `/settings/account` - Account & Security management
- `/settings/privacy` - Privacy & Data controls
- `/settings/preferences` - User preferences (theme placeholder, language)

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
├── SettingsSidebar.js  # Sidebar navigation (similar to AdminSidebar but light theme)
├── SettingsCard.js     # Reusable settings section card
├── SettingsToggle.js   # Toggle switch component
└── SettingsSection.js  # Section wrapper with title/description
```

### 2.3 API Routes

```
src/app/api/settings/
├── privacy/
│   ├── visibility/route.js     # Profile visibility settings
│   └── export/route.js         # Export user data (GDPR)
├── preferences/
│   └── route.js                # Save user preferences
└── account/
    └── delete/route.js         # Delete account (mark for deletion)
```

### 2.4 Middleware

```
src/middleware/userAuth.js      # NEW: User authentication middleware (like adminAuth but for regular users)
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
  },
  
  // NEW: Account Deletion Tracking
  accountDeletionRequested: false,            // Default: false
  accountDeletionRequestedAt: null,           // Timestamp when deletion was requested
  accountDeletionScheduledFor: null,          // Date when account will be permanently deleted
  
  // Existing fields remain unchanged
}
```

### 3.2 Sessions Collection (Future Enhancement - Not in Phase 1)

```javascript
// Firestore: `users/{userId}/sessions/{sessionId}`
// DEFERRED: Session management for Phase 2
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

## 4. Critical Implementation Notes

### 4.1 Password Change - CLIENT-SIDE ONLY

**IMPORTANT:** Password change MUST be done entirely on the client-side using Firebase Auth. Firebase requires `reauthenticateWithCredential()` before `updatePassword()`.

**DO NOT create an API route for password change.** Use the Firebase Client SDK directly.

```javascript
// src/app/(chrome)/settings/account/page.js
// Password change is handled CLIENT-SIDE using:

import { 
  getAuth, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from "firebase/auth";

async function handlePasswordChange(currentPassword, newPassword) {
  const auth = getAuth();
  const user = auth.currentUser;

  // Step 1: Create credential with current password
  const credential = EmailAuthProvider.credential(
    user.email,
    currentPassword
  );

  // Step 2: Reauthenticate (required by Firebase for sensitive operations)
  await reauthenticateWithCredential(user, credential);

  // Step 3: Update password
  await updatePassword(user, newPassword);
}
```

**Error Codes to Handle:**
- `auth/wrong-password` - Current password is incorrect
- `auth/weak-password` - New password is too weak (min 6 chars)
- `auth/requires-recent-login` - User needs to sign in again

### 4.2 Email Change - Also CLIENT-SIDE

Email change also requires reauthentication and uses `updateEmail()` from Firebase Auth client SDK.

```javascript
import { updateEmail, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

async function handleEmailChange(currentPassword, newEmail) {
  const auth = getAuth();
  const user = auth.currentUser;

  // Reauthenticate first
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Update email (Firebase sends verification to new email)
  await updateEmail(user, newEmail);
}
```

### 4.3 User Authentication Middleware

Create a new middleware for user routes (similar to `src/middleware/adminAuth.js`):

**File:** `src/middleware/userAuth.js`

```javascript
import 'server-only';
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin';

export async function requireUser(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No authorization token provided');
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      throw new Error('Invalid authorization token format');
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    if (!decodedToken || !decodedToken.uid) {
      throw new Error('Invalid token');
    }
    
    const db = adminFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // Check if user is banned
    if (userData.accountStatus?.includes('banned')) {
      throw new Error('Account is banned');
    }
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...userData
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('User auth error:', error);
    }
    throw new Error(error.message || 'Unauthorized');
  }
}
```

---

## 5. Detailed Implementation Plan

### 5.1 Phase 1A: Settings Layout & Navigation (2-3 days)

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
    <div className="min-h-screen bg-white">
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
- Light theme (white background, not dark like admin)
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
    description: "Password, email, delete account"
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

#### Task 4: Add Settings Link to MobileMenu
**File:** `src/components/MobileMenu.js`

Add Settings link after Profile link for authenticated users:

```javascript
// After the Profile link (around line 112)
<div className="py-2 px-4">
  <a 
    href="/settings"
    className="flex items-center gap-3 py-2 px-3 text-base font-normal text-gray-800 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors duration-200"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    Settings
  </a>
</div>
```

---

### 5.2 Phase 1B: Account & Security Page (3-4 days)

#### Task 5: Create Account Settings Page
**File:** `src/app/(chrome)/settings/account/page.js`

**Sections:**
1. **Email Display** (Read-only)
   - Display current email
   - Note: Email change is complex, defer to Phase 2

2. **Password Management** (Client-side Firebase Auth)
   - Current password field
   - New password with strength indicator
   - Confirm password
   - Uses `reauthenticateWithCredential` + `updatePassword`

3. **Active Sessions** (Placeholder for Phase 2)
   - Show "Coming Soon" message
   - Will list active sessions with device info

4. **Account Deletion**
   - Danger zone section (red border)
   - Confirmation modal with typed confirmation ("DELETE")
   - 30-day grace period before permanent deletion

**UI Pattern:** Follow `/profile/edit/page.js` structure:
- Yellow header with title
- White content card with sections
- Form validation with error messages
- Success/error feedback
- Use `btn-base` + `btn-variant` for all buttons

#### Task 6: Create Account Deletion API
**File:** `src/app/api/settings/account/delete/route.js`

```javascript
import { NextResponse } from 'next/server';
import { requireUser } from '@/middleware/userAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const user = await requireUser(request);
    
    const body = await request.json();
    const { confirmation } = body;
    
    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { success: false, error: 'Please type DELETE to confirm' },
        { status: 400 }
      );
    }
    
    const db = adminFirestore();
    const userRef = db.collection('users').doc(user.uid);
    
    // Calculate deletion date (30 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);
    
    await userRef.update({
      accountDeletionRequested: true,
      accountDeletionRequestedAt: FieldValue.serverTimestamp(),
      accountDeletionScheduledFor: deletionDate,
    });
    
    // TODO: Send confirmation email
    // TODO: Add cron job to process deletions
    
    return NextResponse.json({
      success: true,
      message: 'Account scheduled for deletion',
      deletionDate: deletionDate.toISOString(),
    });
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process request' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// Cancel deletion request
export async function DELETE(request) {
  try {
    const user = await requireUser(request);
    
    const db = adminFirestore();
    const userRef = db.collection('users').doc(user.uid);
    
    await userRef.update({
      accountDeletionRequested: false,
      accountDeletionRequestedAt: null,
      accountDeletionScheduledFor: null,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Deletion request cancelled',
    });
  } catch (error) {
    console.error('Error cancelling deletion:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel request' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
```

---

### 5.3 Phase 1C: Privacy & Data Page (2-3 days)

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
   - Generates JSON with all user data
   - Includes: profile, campaigns, notifications

4. **Connected Apps** (Placeholder for Phase 2)
   - Show "Coming Soon" for OAuth connections

#### Task 8: Create Privacy APIs

**File:** `src/app/api/settings/privacy/visibility/route.js`

```javascript
import { NextResponse } from 'next/server';
import { requireUser } from '@/middleware/userAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(request) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    
    // Validate settings
    const allowedSettings = [
      'profileVisibility',
      'showInCreatorLeaderboard', 
      'allowSearchEngineIndexing',
      'showSupportCount'
    ];
    
    const updates = {};
    for (const key of allowedSettings) {
      if (body.hasOwnProperty(key)) {
        updates[`privacySettings.${key}`] = body[key];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid settings to update' },
        { status: 400 }
      );
    }
    
    const db = adminFirestore();
    await db.collection('users').doc(user.uid).update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
```

**File:** `src/app/api/settings/privacy/export/route.js`

```javascript
import { NextResponse } from 'next/server';
import { requireUser } from '@/middleware/userAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const user = await requireUser(request);
    
    const db = adminFirestore();
    
    // Gather all user data
    const userData = {};
    
    // 1. User profile
    const userDoc = await db.collection('users').doc(user.uid).get();
    userData.profile = userDoc.data();
    
    // 2. User campaigns
    const campaignsSnapshot = await db.collection('campaigns')
      .where('creatorId', '==', user.uid)
      .get();
    userData.campaigns = campaignsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 3. User notifications (last 100)
    const notificationsSnapshot = await db.collection('users')
      .doc(user.uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    userData.notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 4. Export metadata
    userData.exportMetadata = {
      exportedAt: new Date().toISOString(),
      userId: user.uid,
      email: user.email,
    };
    
    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export data' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
```

---

### 5.4 Phase 1D: Preferences Page (1-2 days)

#### Task 9: Create Preferences Page
**File:** `src/app/(chrome)/settings/preferences/page.js`

**Sections:**
1. **Appearance** (Placeholder)
   - Theme selector: Light / Dark / System
   - Note: "Theme switching coming soon" - requires ThemeContext provider

2. **Language** (Placeholder for i18n)
   - Dropdown: English (more languages in future)

**Note:** Full theme implementation requires:
- CSS variables in `globals.css` (partially exists with `prefers-color-scheme`)
- ThemeContext provider
- localStorage persistence
- **Defer full implementation to Phase 2**

#### Task 10: Create Preferences API
**File:** `src/app/api/settings/preferences/route.js`

```javascript
import { NextResponse } from 'next/server';
import { requireUser } from '@/middleware/userAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(request) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    
    // Validate preferences
    const allowedPreferences = ['theme', 'language'];
    const validThemes = ['light', 'dark', 'system'];
    const validLanguages = ['en']; // Add more as i18n is implemented
    
    const updates = {};
    
    if (body.theme) {
      if (!validThemes.includes(body.theme)) {
        return NextResponse.json(
          { success: false, error: 'Invalid theme value' },
          { status: 400 }
        );
      }
      updates['preferences.theme'] = body.theme;
    }
    
    if (body.language) {
      if (!validLanguages.includes(body.language)) {
        return NextResponse.json(
          { success: false, error: 'Invalid language value' },
          { status: 400 }
        );
      }
      updates['preferences.language'] = body.language;
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid preferences to update' },
        { status: 400 }
      );
    }
    
    const db = adminFirestore();
    await db.collection('users').doc(user.uid).update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update preferences' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
```

---

## 6. Reusable Components

### 6.1 SettingsCard Component
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

### 6.2 SettingsToggle Component
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

### 6.3 SettingsSection Component
**File:** `src/components/settings/SettingsSection.js`

```javascript
export default function SettingsSection({ title, description, children }) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
```

---

## 7. Security Considerations

### 7.1 Authentication Requirements
- All settings pages require authentication (enforced in layout)
- Password changes require current password verification (client-side reauthentication)
- Account deletion requires typed confirmation ("DELETE")
- All API routes use Bearer token authentication

### 7.2 Rate Limiting (Phase 2)
- Password change: 3 attempts per hour
- Data export: 1 per 24 hours
- Account deletion: 1 pending request at a time

### 7.3 Audit Logging
Log all sensitive actions to `users/{userId}/activityLog`:
- Password changes (client-side, log via API call after success)
- Privacy setting changes
- Data exports
- Account deletion requests

---

## 8. UI/UX Consistency

### 8.1 Follow Existing Patterns
- **Header Style:** Yellow background with emerald text (like `/profile/edit`)
- **Card Style:** White with gray border, rounded-xl
- **Button Style:** Use `btn-base` + variant classes from `BUTTON_STYLE_GUIDE.md`
- **Form Validation:** Red border + error message below field
- **Loading States:** Emerald spinner with message
- **Success Feedback:** Green toast notification or inline message
- **Danger Zone:** Red border, red header background

### 8.2 Responsive Design
- **Desktop:** Sidebar on left (256px), content on right
- **Tablet:** Sidebar collapses to icons (80px)
- **Mobile:** Horizontal tabs at top, content below

### 8.3 Accessibility
- All toggles have proper `role="switch"` and `aria-checked`
- Form fields have associated labels
- Keyboard navigation support
- Focus indicators on all interactive elements (handled by btn-base)

---

## 9. Implementation Order

### Week 1: Foundation
1. ✅ Create `src/middleware/userAuth.js` - User authentication middleware
2. ✅ Create settings layout structure (`layout.js`, `page.js`)
3. ✅ Create SettingsSidebar component
4. ✅ Create reusable components (Card, Toggle, Section)
5. ✅ Add Settings link to MobileMenu.js
6. ✅ Create Account page with password change (client-side)

### Week 2: Core Features
7. ✅ Create Privacy settings page
8. ✅ Implement visibility toggles API
9. ✅ Implement data export API
10. ✅ Create Preferences page (theme placeholder)
11. ✅ Add account deletion with confirmation

### Future Enhancements (Post-Launch)
- Two-factor authentication (2FA)
- Session management (view/revoke sessions)
- Full theme implementation (dark mode toggle)
- Multi-language support (i18n)
- Connected apps/OAuth management
- Email change functionality
- Account deletion cron job (add to `vercel.json`)

---

## 10. Testing Checklist

### Functional Tests
- [ ] Settings layout loads correctly
- [ ] Sidebar navigation works on all screen sizes
- [ ] Password change with correct current password (client-side)
- [ ] Password change rejected with wrong current password
- [ ] Privacy toggles save correctly
- [ ] Data export generates valid JSON
- [ ] Account deletion shows proper confirmation
- [ ] Account deletion can be cancelled
- [ ] Preferences save correctly

### Security Tests
- [ ] Unauthenticated users redirected to signin
- [ ] API routes return 401 without valid token
- [ ] Password validation enforces minimum requirements
- [ ] Banned users cannot access settings

### UI/UX Tests
- [ ] Mobile responsive layout
- [ ] Loading states display correctly
- [ ] Error messages are clear and helpful
- [ ] Success feedback shows after actions
- [ ] Keyboard navigation works
- [ ] All buttons use btn-base + btn-variant

---

## 11. Files to Create/Modify

### New Files
```
src/middleware/userAuth.js                    # User authentication middleware

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
│   └── delete/route.js
├── privacy/
│   ├── visibility/route.js
│   └── export/route.js
└── preferences/route.js
```

### Modified Files
```
src/components/MobileMenu.js    # Add Settings link after Profile
TASKS.md                        # Update Phase 1 status
replit.md                       # Update with settings architecture
CODEBASE_STRUCTURE.md           # Add settings files documentation
```

---

## 12. Dependencies

### No New Packages Required
All functionality can be built with existing dependencies:
- Firebase Client SDK (password change, email change)
- Firebase Admin SDK (API authentication, Firestore operations)
- Next.js API routes (backend)
- Tailwind CSS (styling)
- Existing component patterns

---

## 13. Success Criteria

Phase 1 is complete when:
1. Users can access `/settings` and see the settings hub
2. Users can change their password (client-side)
3. Users can control profile visibility
4. Users can export their data
5. Users can access preferences page (theme placeholder)
6. Account deletion flow works with proper confirmation
7. All pages are responsive and accessible
8. Settings link appears in mobile menu for authenticated users
9. Documentation is updated

---

**End of Implementation Plan**
