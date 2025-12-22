# Duplicated Code Analysis - Twibbonize Platform

## ✅ FIXED ISSUES (Removed from active list)

The following issues have been successfully refactored with centralized utilities in `/src/utils/formHelpers.js`:
1. ~~scrollToField Function~~ - Extracted to `scrollToField(fieldName, fieldRefs)` utility
2. ~~validateFormFields Function~~ - Extracted to `validateFormFields(formData, formType, setValidationErrors, fieldRefs)` utility
3. ~~handleInputChange Function~~ - Extracted to `handleFieldInputChange(field, value, ...)` with validator map pattern

**Result**: ~165 lines of duplication eliminated from signin, signup, and forgot-password pages

---

## REMAINING HIGH PRIORITY (Form Pages: signin, signup, forgot-password)

### Issue 1: Form State Initialization
- **Files**: signin, signup, forgot-password (all have same 4 state variables)
- **Duplication**: 4 lines × 3 pages = 12 lines
```javascript
const [validationErrors, setValidationErrors] = useState({});
const [fieldValidation, setFieldValidation] = useState({});
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
```
- **Solution**: Create custom hook `/src/hooks/useFormValidation.js`

### Issue 2: Frame Logo Header
- **Files**: signin (lines 97-104), signup (lines 97-104), forgot-password (lines 73-80)
- **Duplication**: 8 lines × 3 pages = 24 lines
- **What's duplicated**: Same logo, styling, and Link component - identical
```jsx
<div className="absolute top-6 left-6 z-50 mb-8">
  <Link href="/" className={`${caveat.className} text-2xl md:text-3xl font-bold text-emerald-700 hover:text-emerald-800 transition-all duration-300 hover:scale-110`}>
    Frame
  </Link>
</div>
```
- **Solution**: Create component `/src/components/FrameLogo.jsx`

### Issue 3: Error Display Pattern (Inline JSX)
- **Files**: signin (lines 119-155), signup (lines 119-122), settings (multiple places)
- **Duplication**: 5-10 lines × 4+ places = 40+ lines
- **What's duplicated**: Error alert box styling and display
```jsx
{error && (
  <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-lg">
    {error}
  </div>
)}
```
- **Solution**: Create component `/src/components/ErrorAlert.jsx`

---

## REMAINING MEDIUM PRIORITY (Settings Page)

### Issue 4: Firebase Error Handling
- **Files**: `/src/app/(chrome)/settings/account/page.js`
- **Locations**: `handlePasswordChange()` + `handleEmailChange()`
- **Duplication**: Error code mapping repeated in 2 functions
- **What's duplicated**: Error codes like `auth/wrong-password`, `auth/weak-password`, etc.
- **Solution**: Create `/src/utils/firebaseErrorHandler.js` with centralized error messages

### Issue 5: API Token Fetching Pattern
- **Files**: `/src/app/(chrome)/settings/account/page.js`
- **Locations**: Lines 67, 100, 132, 366, 401
- **Duplication**: Same pattern repeated 5+ times (~10 lines each = 50+ lines)
```javascript
const token = await user.getIdToken();
const response = await fetch('/api/...', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
```
- **Solution**: Create `/src/utils/apiClient.js` with `authenticatedFetch(url, options, user)`

### Issue 6: Date Formatting Functions
- **Files**: `/src/app/(chrome)/settings/account/page.js`
- **Locations**: `formatSessionDate()` + `formatDeletionDate()`
- **What's duplicated**: Two separate date formatting functions in same file
- **Solution**: Create `/src/utils/dateFormatter.js` with `formatRelativeTime()` and `formatFullDate()`

---

## Summary

| Issue | Duplication | Type | Lines | Status |
|-------|-------------|------|-------|--------|
| ~~scrollToField~~ | 3 pages | Function | ~54 | ✅ FIXED |
| ~~validateFormFields~~ | 3 pages | Function | ~36 | ✅ FIXED |
| ~~handleInputChange~~ | 3 pages | Function | ~75 | ✅ FIXED |
| Form state | 3 pages | Hook | ~12 | 🔜 TODO |
| Frame Logo | 3 pages | Component | ~24 | 🔜 TODO |
| Error display | 4+ places | Component | ~40 | 🔜 TODO |
| Firebase errors | Settings | Function | ~15 | 🔜 TODO |
| API token pattern | Settings | Function | ~50 | 🔜 TODO |
| Date formatters | Settings | Function | ~25 | 🔜 TODO |
| **REMAINING** | **6 issues** | - | **~165 lines** | |

**Progress**: 3/9 issues fixed = 165 lines eliminated (50% complete)
