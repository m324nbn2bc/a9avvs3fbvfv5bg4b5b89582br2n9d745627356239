# Settings Hub Phase 2 Implementation Plan

**Created:** December 17, 2025  
**Status:** Planning  
**Priority:** Phase 2  
**Prerequisite:** Phase 1 Complete

---

## Overview

This document outlines the remaining features for the Settings Hub that were deferred from Phase 1. These items enhance user account management, security, and personalization capabilities.

---

## 1. Account Deletion Cron Job

**Priority:** High  
**Complexity:** Medium  
**Current State:** Deletion is scheduled with 30-day grace period, but accounts are never actually deleted.

### Problem

When a user requests account deletion:
- `accountDeletionRequested` is set to `true`
- `accountDeletionScheduledFor` is set to 30 days from request
- **Nothing actually processes and deletes accounts after the 30-day period**

### Implementation Requirements

1. **Create a scheduled function/cron job** that runs daily to:
   - Query users where `accountDeletionRequested === true` AND `accountDeletionScheduledFor <= now()`
   - For each matching user:
     - Delete all user campaigns from `campaigns` collection
     - Delete all user notifications from `users/{userId}/notifications` subcollection
     - Delete user document from `users` collection
     - Delete user from Firebase Authentication using Admin SDK
     - Log deletion for audit purposes

2. **Options for implementation:**
   - Firebase Cloud Functions with scheduled trigger (`firebase-functions/v2/scheduler`)
   - External cron service calling a secure API endpoint
   - Replit's scheduled deployments

3. **API endpoint needed:**
   ```
   POST /api/admin/process-deletions
   ```
   - Secured with admin authentication or secret key
   - Called by cron job or Cloud Function

4. **Considerations:**
   - Send final email notification before deletion (optional)
   - Handle partial failures gracefully
   - Maintain deletion audit log

---

## 2. Session Management

**Priority:** Medium  
**Complexity:** High  
**Current State:** Shows "Coming Soon" placeholder in Account Settings UI.

### Problem

Users cannot view or manage their active login sessions. This is a security feature that allows users to:
- See all devices/browsers where they're logged in
- Revoke access from specific sessions
- Sign out from all devices

### Implementation Requirements

1. **Database schema extension:**
   ```javascript
   // Firestore: `users/{userId}/sessions/{sessionId}`
   {
     deviceInfo: string,       // Browser/device user agent
     ipAddress: string,        // Hashed or partial IP for privacy
     location: string,         // Approximate location (city, country)
     createdAt: timestamp,     // When session was created
     lastActiveAt: timestamp,  // Last activity timestamp
     isCurrent: boolean,       // Is this the current session
   }
   ```

2. **Create session on login:**
   - Modify `signInWithEmail`, `signInWithGoogle` to create session document
   - Store session ID in client (localStorage or cookie)
   - Include device fingerprinting for identification

3. **API endpoints needed:**
   ```
   GET /api/settings/sessions          - List all active sessions
   DELETE /api/settings/sessions/:id   - Revoke specific session
   DELETE /api/settings/sessions       - Revoke all sessions except current
   ```

4. **UI updates for Account Settings page:**
   - Replace "Coming Soon" placeholder with session list
   - Show device type icon, location, last active time
   - "Sign out" button per session
   - "Sign out all other devices" button

5. **Considerations:**
   - Firebase Auth has `revokeRefreshTokens()` for server-side session revocation
   - Need to track sessions independently since Firebase doesn't expose session list
   - Consider using Firebase Auth custom claims or separate tracking

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
