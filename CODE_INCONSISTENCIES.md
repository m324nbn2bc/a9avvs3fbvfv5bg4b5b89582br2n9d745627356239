# Code Inconsistencies & Refactoring Opportunities

**Project**: Twibbonize Platform  
**Last Updated**: December 22, 2025  
**Status**: Identified and documented for refactoring

---

## Table of Contents
1. [HIGH Priority Issues](#high-priority-issues)
2. [MEDIUM Priority Issues](#medium-priority-issues)
3. [Summary Table](#priority-summary-table)
4. [Recommended Refactoring Plan](#recommended-refactoring-plan)

---

## HIGH PRIORITY ISSUES

### 1. scrollToField Function - Duplicated (3 places)

**Severity**: 🔴 HIGH  
**Locations**: 
- `/src/app/signin/page.js` (lines 33-50)
- `/src/app/signup/page.js` (lines 34-52)
- `/src/app/forgot-password/page.js` (lines 32-48)

**Current Implementation**:
```javascript
const scrollToField = (fieldName) => {
  const fieldRefs = {
    email: emailRef,
    password: passwordRef  // varies per page
  };
  
  const fieldRef = fieldRefs[fieldName];
  if (fieldRef?.current) {
    fieldRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    setTimeout(() => {
      fieldRef.current.focus();
    }, 300);
  }
};
```

**Problem**: Identical logic across 3 pages. Only `fieldRefs` object differs based on available fields.

**Solution**: Extract to `/src/utils/formHelpers.js` as a reusable function that accepts fieldRefs as parameter.

---

### 2. validateFormFields Function - Duplicated (3 places)

**Severity**: 🔴 HIGH  
**Locations**: 
- `/src/app/signin/page.js` (lines 52-63)
- `/src/app/signup/page.js` (lines 54-65)
- `/src/app/forgot-password/page.js` (lines 50-61)

**Current Implementation**:
```javascript
const validateFormFields = (formData) => {
  const validation = validateForm(formData, 'signin'); // only param changes
  setValidationErrors(validation.errors);
  
  if (validation.firstErrorField) {
    setTimeout(() => scrollToField(validation.firstErrorField), 100);
  }
  
  return validation.isValid;
};
```

**Problem**: Identical logic in all 3 locations. Only the `formType` parameter differs ('signin', 'signup', 'forgot-password').

**Solution**: Extract to `/src/utils/formHelpers.js` and pass `formType` as parameter.

---

### 3. handleInputChange Function - Duplicated (3 places)

**Severity**: 🔴 HIGH  
**Locations**: 
- `/src/app/signin/page.js` (lines 114-141)
- `/src/app/signup/page.js` (lines 114-144)
- `/src/app/forgot-password/page.js` (lines 63-87)

**Current Implementation**:
```javascript
const handleInputChange = (field, value) => {
  // Clear form validation errors when user starts typing
  if (validationErrors[field]) {
    setValidationErrors(prev => ({ ...prev, [field]: '' }));
  }
  
  // Perform real-time validation
  let validationError = null;
  let isValid = false;
  
  if (field === 'email' && value.trim()) {
    validationError = validateEmail(value);
    isValid = !validationError;
  } else if (field === 'password' && value.trim()) {
    validationError = validatePassword(value, true);
    isValid = !validationError;
  }
  
  // Update field validation status
  setFieldValidation(prev => ({
    ...prev,
    [field]: {
      isValid,
      error: validationError,
      hasValue: value.trim().length > 0
    }
  }));
};
```

**Problem**: ~25 lines of identical code repeated 3 times. Only validators differ per field.

**Solution**: Create a custom hook `useFormValidation()` or extract logic to `/src/utils/formHelpers.js`.

---

### 4. Form State Initialization Pattern - Duplicated (4 places)

**Severity**: 🔴 HIGH  
**Locations**: 
- `/src/app/signin/page.js`
- `/src/app/signup/page.js`
- `/src/app/forgot-password/page.js`
- `/src/app/(chrome)/settings/account/page.js`

**Current Implementation**:
```javascript
const [validationErrors, setValidationErrors] = useState({});
const [fieldValidation, setFieldValidation] = useState({});
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
```

**Problem**: Same state pattern repeated in every form page.

**Solution**: Create custom hook `useFormValidation()` in `/src/hooks/useFormValidation.js` that returns all 4 state variables and their setters.

---

## MEDIUM PRIORITY ISSUES

### 5. Firebase Auth Error Handling - Duplicated (2 places in settings)

**Severity**: 🟡 MEDIUM  
**Locations**: 
- `/src/app/(chrome)/settings/account/page.js` - `handlePasswordChange()` (lines 273-281)
- `/src/app/(chrome)/settings/account/page.js` - `handleEmailChange()` (lines 340-353)

**Current Implementation**:
```javascript
if (error.code === "auth/wrong-password") {
  setError("Current password is incorrect");
} else if (error.code === "auth/weak-password") {
  setError("New password is too weak. Please use a stronger password.");
} else if (error.code === "auth/requires-recent-login") {
  setError("Please sign out and sign back in before changing your password");
} else {
  setError(error.message || "Failed to update password");
}
```

**Problem**: Similar Firebase error code handling appears in multiple places. Different error messages are set depending on context.

**Solution**: Create utility function `handleFirebaseError(errorCode, context)` in `/src/utils/firebaseErrorHandler.js` that returns appropriate error message based on error code and context.

---

### 6. Frame Logo Header - Duplicated (3+ pages)

**Severity**: 🟡 MEDIUM  
**Locations**: 
- `/src/app/signin/page.js` (lines 148-154)
- `/src/app/signup/page.js` (lines 151-157)
- `/src/app/forgot-password/page.js` (lines 121-127)

**Current Implementation**:
```jsx
<div className="absolute top-6 left-6 z-50 mb-8">
  <Link 
    href="/" 
    className={`${caveat.className} text-2xl md:text-3xl font-bold text-emerald-700 hover:text-emerald-800 transition-all duration-300 hover:scale-110`}
  >
    Frame
  </Link>
</div>
```

**Problem**: Identical header component repeated in multiple auth pages.

**Solution**: Create reusable component `/src/components/FrameLogo.jsx` and import in all auth pages.

---

### 7. Error Alert Display - Duplicated (4+ places)

**Severity**: 🟡 MEDIUM  
**Locations**: 
- `/src/app/signin/page.js` (lines 170-189)
- `/src/app/signup/page.js` (lines 173-177)
- `/src/app/(chrome)/settings/account/page.js` (lines 445-449, 571-575)

**Current Implementation**:
```jsx
{error && (
  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
    {error}
  </div>
)}
```

**Problem**: Should be a reusable component. Some variations exist (signin has additional logic for password reset).

**Solution**: Create component `/src/components/ErrorAlert.jsx` with optional prop for additional content.

---

### 8. Success/Status Alert Display - Duplicated (2+ places)

**Severity**: 🟡 MEDIUM  
**Locations**: 
- `/src/app/(chrome)/settings/account/page.js` (lines 576-580 - password success)
- `/src/app/(chrome)/settings/account/page.js` (emailSuccess pattern)

**Current Implementation**:
```jsx
{passwordSuccess && (
  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
    {passwordSuccess}
  </div>
)}
```

**Problem**: Repeated pattern for success messages. Will increase as new features are added.

**Solution**: Create component `/src/components/SuccessAlert.jsx` for consistent success message display.

---

### 9. Date Formatting Functions - Consolidation Needed

**Severity**: 🟡 MEDIUM (Future Risk)  
**Locations**: 
- `/src/app/(chrome)/settings/account/page.js` (lines 189-208 - `formatSessionDate`)
- `/src/app/(chrome)/settings/account/page.js` (lines 424-432 - `formatDeletionDate`)

**Current Implementation**:
```javascript
// formatSessionDate
const formatSessionDate = (dateString) => {
  // ... relative time logic (just now, 5 minutes ago, etc.)
};

// formatDeletionDate
const formatDeletionDate = (dateString) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
```

**Problem**: Two different date formatting functions in same file. Future features will add more.

**Solution**: Create `/src/utils/dateFormatter.js` with exported functions `formatRelativeTime()` and `formatFullDate()`.

---

### 10. API Token Fetching Pattern - Repeated (5+ times in settings)

**Severity**: 🟡 MEDIUM  
**Locations**: 
- `/src/app/(chrome)/settings/account/page.js` - Lines 67, 100, 132, 366, 401

**Current Implementation**:
```javascript
const token = await user.getIdToken();
const response = await fetch('/api/...', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

**Problem**: Same API call pattern repeated 5+ times in settings page. Error handling varies.

**Solution**: Create utility function `/src/utils/apiClient.js` with `authenticatedFetch(url, options)` that handles token fetching and headers.

---

## Priority Summary Table

| # | Pattern | Locations | Type | Priority |
|---|---------|-----------|------|----------|
| 1 | `scrollToField` | 3 pages | Function | 🔴 HIGH |
| 2 | `validateFormFields` | 3 pages | Function | 🔴 HIGH |
| 3 | `handleInputChange` | 3 pages | Function | 🔴 HIGH |
| 4 | Form state pattern | 4 pages | Hook | 🔴 HIGH |
| 5 | Firebase error handling | 2 places (settings) | Function | 🟡 MEDIUM |
| 6 | Frame logo header | 3+ pages | Component | 🟡 MEDIUM |
| 7 | Error alert display | 4+ places | Component | 🟡 MEDIUM |
| 8 | Success alert display | 2+ places | Component | 🟡 MEDIUM |
| 9 | Date formatting | 1 file (future risk) | Function | 🟡 MEDIUM |
| 10 | API token pattern | Settings (5+ times) | Function | 🟡 MEDIUM |

---

## Recommended Refactoring Plan

### Phase 1: HIGH PRIORITY (Form Logic)

**Expected Impact**: Reduces duplication across 3 authentication pages, eliminates ~75 lines of duplicate code

1. **Create custom hook**: `/src/hooks/useFormValidation.js`
   - Returns: `validationErrors`, `setValidationErrors`, `fieldValidation`, `setFieldValidation`
   - Can be imported in signin, signup, forgot-password pages

2. **Extract utility functions**: `/src/utils/formHelpers.js`
   - `scrollToField(fieldName, fieldRefs)` - reusable scroll and focus logic
   - `validateFormFields(formData, formType, setValidationErrors, scrollToField)` - centralized validation flow
   - `createInputChangeHandler(setValidationErrors, setFieldValidation, validationMap)` - factory for creating handleInputChange

3. **Update pages**:
   - `/src/app/signin/page.js`
   - `/src/app/signup/page.js`
   - `/src/app/forgot-password/page.js`

---

### Phase 2: MEDIUM PRIORITY - UI Components

**Expected Impact**: Improves consistency, easier theme changes

1. **Create component**: `/src/components/FrameLogo.jsx`
   - Props: `className` (optional)
   - Used in: signin, signup, forgot-password pages

2. **Create component**: `/src/components/ErrorAlert.jsx`
   - Props: `message`, `children` (optional for additional content)
   - Used in: signin, signup, settings pages

3. **Create component**: `/src/components/SuccessAlert.jsx`
   - Props: `message`, `icon` (optional)
   - Used in: settings and other pages

---

### Phase 3: MEDIUM PRIORITY - Utility Functions

**Expected Impact**: Cleaner code, easier testing and maintenance

1. **Create utility**: `/src/utils/firebaseErrorHandler.js`
   - Function: `handleFirebaseError(errorCode, context)` 
   - Returns: Human-readable error message based on code and context
   - Used in: settings/account page and future auth pages

2. **Create utility**: `/src/utils/dateFormatter.js`
   - Function: `formatRelativeTime(dateString)` - "just now", "5 mins ago", etc.
   - Function: `formatFullDate(dateString)` - "Monday, December 22, 2025"
   - Used in: settings/account page and future pages

3. **Create utility**: `/src/utils/apiClient.js`
   - Function: `authenticatedFetch(url, options, user)` 
   - Handles token fetching and Authorization header injection
   - Used in: settings/account page

---

## Implementation Order

**Recommended sequence**:
1. Phase 1 (HIGH) - Start with custom hook and utility functions
2. Phase 2 - UI components (can be done in parallel with Phase 1)
3. Phase 3 - Utility functions (can be done in parallel with Phase 1 & 2)

**Parallel Execution**: Phases 2 and 3 can be completed simultaneously as they don't depend on Phase 1.

---

## Code Quality Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Duplicate lines | ~100 lines | ~20 lines | -80% |
| Number of files with form logic | 3 | 1 (utils) + hook | -67% |
| Reusable components | 0 | 3 | N/A |
| Utility functions (validation) | Scattered | Centralized | Better maintainability |
| API call consistency | Inconsistent | Standardized | Better error handling |

---

## Notes

- All refactoring should maintain 100% backward compatibility
- Tests should be added for new utilities and hooks
- Documentation should be updated after refactoring
- Consider creating a migration guide if these changes affect existing code

