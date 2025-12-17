# Settings Hub Phase 2 Implementation Plan

**Created:** December 17, 2025  
**Last Updated:** December 17, 2025  
**Status:** In Progress (2 of 6 tasks completed)  
**Priority:** Phase 2  
**Prerequisite:** Phase 1 Complete

---

## Overview

This document outlines the remaining features for the Settings Hub that were deferred from Phase 1. These items enhance user account management, security, and personalization capabilities.

---

## 1. Account Deletion Cron Job ✅ COMPLETED

**Priority:** High  
**Complexity:** Medium  
**Status:** ✅ Implemented via Vercel Cron Job (December 17, 2025)

### Implementation Summary

**Files Created/Modified:**
- `src/app/api/cron/process-account-deletions/route.js` - Main cron job endpoint
- `vercel.json` - Cron schedule configuration

**Configuration:**
- **Schedule:** `0 3 * * *` (daily at 3 AM UTC)
- **Path:** `/api/cron/process-account-deletions`
- **Authorization:** `CRON_SECRET` environment variable (required in Vercel)
- **Timeout:** 60 seconds max duration

**Features Implemented:**
1. ✅ **Query eligible accounts:** Finds users where `accountDeletionRequested === true` AND `accountDeletionScheduledFor <= now()`
2. ✅ **Delete user campaigns:** Removes all campaigns from `campaigns` collection where `creatorId === userId`
3. ✅ **Delete notifications:** Removes all documents from `users/{userId}/notifications` subcollection
4. ✅ **Delete user document:** Removes the user document from `users` collection
5. ✅ **Delete Firebase Auth user:** Uses Admin SDK `adminAuth.deleteUser()` (handles `auth/user-not-found` gracefully)
6. ✅ **Audit logging:** Uses `logAdminAction()` with action `account_deleted` for each deletion
7. ✅ **Error handling:** Continues processing on individual failures, collects errors in response

**Response Format:**
```json
{
  "success": true,
  "processed": 5,
  "campaignsDeleted": 12,
  "deletedUsers": ["uid1", "uid2", ...],
  "errors": [...],
  "executedAt": "2025-12-17T03:00:00.000Z"
}
```

### Original Problem

When a user requested account deletion, the flags were set but accounts were never actually deleted after the 30-day grace period.

---

## 2. Session Management ✅ COMPLETED

**Priority:** Medium  
**Complexity:** High  
**Status:** ✅ Implemented (December 17, 2025)

### Implementation Summary

**Files Created/Modified:**
- `src/utils/sessionManager.js` - Client-side session ID generation and localStorage management
- `src/app/api/settings/sessions/route.js` - API endpoints for listing, creating sessions
- `src/app/api/settings/sessions/[sessionId]/route.js` - API endpoint for revoking specific session
- `src/hooks/useAuth.js` - Added session tracking on login (signInWithGoogle, signInWithEmail)
- `src/app/(chrome)/settings/account/page.js` - Updated UI with full session management

**Features Implemented:**
1. ✅ **Database schema:** Firestore subcollection `users/{userId}/sessions/{sessionId}` with deviceType, browser, os, userAgent, location, createdAt, lastActiveAt, isCurrent
2. ✅ **Session tracking on login:** Both `signInWithGoogle` and `signInWithEmail` now create/update session documents
3. ✅ **Session tracking on auth restore:** `onAuthStateChanged` callback also tracks sessions for returning users
4. ✅ **Session ID persistence:** localStorage stores session ID, cleared on logout
5. ✅ **Device detection:** Extracts browser, OS, and device type from user agent
6. ✅ **Firebase token revocation:** DELETE endpoints call `adminAuth.revokeRefreshTokens()` to actually invalidate other sessions
7. ✅ **API endpoints:**
   - `GET /api/settings/sessions` - List all active sessions
   - `POST /api/settings/sessions` - Create/update session on login
   - `DELETE /api/settings/sessions?all=true` - Revoke all sessions except current (with token revocation)
   - `DELETE /api/settings/sessions/[sessionId]` - Revoke specific session (with token revocation)
8. ✅ **UI features:**
   - Session list with device icons (Desktop, Mobile, Tablet)
   - "Current" badge for active session
   - "Sign out" button per session
   - "Sign out all other devices" button
   - Relative time display (e.g., "2 hours ago")

### Original Problem

Users could not view or manage their active login sessions.

---

## 3. Dark Mode Implementation

**Priority:** Medium  
**Complexity:** Medium  
**Current State:** Theme preference is saved to Firestore but not applied. UI always shows light theme.

### Problem

Users can select light/dark/system theme in Preferences, and it saves correctly, but:
- The theme is never actually applied to the UI
- No ThemeContext or theme provider exists
- CSS doesn't respond to theme changes

### Implementation Requirements

1. **Create ThemeContext provider:**
   ```javascript
   // src/context/ThemeContext.js
   - Reads theme preference from user profile or localStorage
   - Provides `theme` and `setTheme` to all components
   - Handles "system" preference using `prefers-color-scheme` media query
   - Persists theme choice and syncs with Firestore
   ```

2. **Apply theme to document:**
   - Add `dark` class to `<html>` or `<body>` element
   - Use Tailwind's dark mode classes (`dark:bg-gray-900`, etc.)
   - Configure Tailwind for class-based dark mode:
     ```javascript
     // tailwind.config.js
     darkMode: 'class',
     ```

3. **Update components with dark mode styles:**
   - Add `dark:` variants to key components
   - Focus on: navigation, cards, forms, modals, text colors
   - Ensure sufficient contrast in dark mode

4. **Wrap app with ThemeProvider:**
   - Add to root layout or AuthenticatedLayout
   - Load theme preference early to prevent flash

5. **Considerations:**
   - Prevent flash of wrong theme on page load (use inline script or cookie)
   - Handle SSR/hydration mismatch
   - Test accessibility contrast ratios in dark mode

---

## 4. Email Change

**Priority:** Low  
**Complexity:** Medium  
**Current State:** Disabled with message "Email changes are not currently supported".

### Problem

Users cannot change their email address. This is a valid account management feature that some users may need.

### Implementation Requirements

1. **Client-side implementation (Firebase Auth):**
   ```javascript
   import { updateEmail, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

   async function handleEmailChange(currentPassword, newEmail) {
     const auth = getAuth();
     const user = auth.currentUser;

     // Step 1: Reauthenticate (required for sensitive operations)
     const credential = EmailAuthProvider.credential(user.email, currentPassword);
     await reauthenticateWithCredential(user, credential);

     // Step 2: Update email (Firebase sends verification to new email)
     await updateEmail(user, newEmail);
     
     // Step 3: Update Firestore user document
     // ...update users/{uid} with new email
   }
   ```

2. **UI updates for Account Settings page:**
   - Add "Change Email" section
   - Form with: current password, new email, confirm new email
   - Show verification notice after change

3. **Firestore sync:**
   - Update `email` field in user document after successful change
   - Handle the case where Firebase Auth email differs from Firestore

4. **Error handling:**
   - `auth/email-already-in-use` - New email already registered
   - `auth/invalid-email` - Invalid email format
   - `auth/requires-recent-login` - Need to reauthenticate

5. **Considerations:**
   - Firebase sends verification email to new address automatically
   - Old email receives notification of change
   - Consider requiring email verification before completing change

---

## 5. Connected Apps / OAuth

**Priority:** Low  
**Complexity:** High  
**Current State:** Placeholder section shows "No connected apps" message.

### Problem

Users cannot connect third-party apps or view OAuth authorizations. This becomes relevant when:
- API access is offered to third parties
- OAuth login providers beyond Google are added
- Third-party integrations are built

### Implementation Requirements

1. **Database schema:**
   ```javascript
   // Firestore: `users/{userId}/connectedApps/{appId}`
   {
     appName: string,          // e.g., "Zapier", "IFTTT"
     appIcon: string,          // URL to app icon
     permissions: string[],    // What the app can access
     connectedAt: timestamp,
     lastUsedAt: timestamp,
   }
   ```

2. **API endpoints:**
   ```
   GET /api/settings/connected-apps      - List connected apps
   DELETE /api/settings/connected-apps/:id - Revoke app access
   ```

3. **UI updates:**
   - Replace placeholder with connected apps list
   - Show app name, icon, permissions granted, connection date
   - "Revoke Access" button per app

4. **Considerations:**
   - Only implement when OAuth/API functionality is added
   - Consider showing linked login providers (Google, etc.)
   - May tie into future API key management

---

## 6. Additional Languages (i18n)

**Priority:** Low  
**Complexity:** High  
**Current State:** Only English is available. Language preference saves but no translations exist.

### Implementation Requirements

1. **Choose i18n library:**
   - `next-intl` (recommended for Next.js App Router)
   - `react-i18next`
   - `next-i18next`

2. **Create translation files:**
   ```
   src/locales/
   ├── en/
   │   ├── common.json
   │   ├── settings.json
   │   └── auth.json
   ├── es/
   │   ├── common.json
   │   └── ...
   └── id/  (Indonesian)
       └── ...
   ```

3. **Wrap app with i18n provider:**
   - Configure with user's language preference
   - Fallback to browser language or English

4. **Replace hardcoded strings:**
   - Use translation keys: `t('settings.account.title')`
   - Update all components to use translation function

5. **Language selector in Preferences:**
   - Update dropdown with available languages
   - Store preference in Firestore
   - Apply on next page load or immediately

6. **Priority languages to add:**
   - Spanish (es)
   - Indonesian (id) - if targeting Southeast Asia
   - Portuguese (pt)
   - French (fr)

7. **Considerations:**
   - RTL support for Arabic, Hebrew if needed
   - Date/number formatting per locale
   - URL-based locale (e.g., `/en/settings`, `/es/settings`) vs cookie-based

---

## Implementation Priority Order

| # | Feature | Priority | Effort | Dependencies |
|---|---------|----------|--------|--------------|
| 1 | Account Deletion Cron Job | High | Medium | None |
| 2 | Dark Mode Implementation | Medium | Medium | None |
| 3 | Session Management | Medium | High | None |
| 4 | Email Change | Low | Medium | None |
| 5 | Connected Apps | Low | High | OAuth/API system |
| 6 | Additional Languages | Low | High | Content translation |

---

## Notes

- **Account Deletion Cron** should be prioritized as it completes a critical user flow
- **Dark Mode** offers good UX improvement with moderate effort
- **Session Management** requires significant backend work but enhances security
- **Email Change**, **Connected Apps**, and **Languages** can be deferred until specific user demand
