# Duplicated Code Analysis - Twibbonize Platform

## HIGH PRIORITY (Form Pages: signin, signup, forgot-password)

### Issue 1: scrollToField Function
- **Files**: `/src/app/signin/page.js` (lines 33-50), `/src/app/signup/page.js` (lines 34-52), `/src/app/forgot-password/page.js` (lines 32-48)
- **Duplication**: 18 lines × 3 pages = 54 lines
- **What's duplicated**: Scroll and focus logic - identical except `fieldRefs` object changes
- **Solution**: Extract to `/src/utils/formHelpers.js` as `scrollToField(fieldName, fieldRefs)`

### Issue 2: validateFormFields Function
- **Files**: signin (lines 52-63), signup (lines 54-65), forgot-password (lines 50-61)
- **Duplication**: 12 lines × 3 pages = 36 lines
- **What's duplicated**: Validation flow + error scrolling - only `formType` differs
- **Solution**: Extract to `/src/utils/formHelpers.js` as `validateFormFields(formData, formType, ...)`

### Issue 3: handleInputChange Function
- **Files**: signin (lines 114-141), signup (lines 114-144), forgot-password (lines 63-87)
- **Duplication**: ~25 lines × 3 pages = 75 lines
- **What's duplicated**: Clear errors, validate field, update state - validators differ per field
- **Solution**: Extract to `/src/utils/formHelpers.js` with field validator map

### Issue 4: Form State Initialization
- **Files**: signin, signup, forgot-password (all have same 4 state variables)
- **Duplication**: 4 lines × 3 pages = 12 lines
```javascript
const [validationErrors, setValidationErrors] = useState({});
const [fieldValidation, setFieldValidation] = useState({});
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
```
- **Solution**: Create custom hook `/src/hooks/useFormValidation.js`

### Issue 5: Frame Logo Header
- **Files**: signin (lines 148-155), signup (lines 151-158), forgot-password (lines ~129-136)
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

### Issue 6: Error Display Pattern (Inline JSX)
- **Files**: signin (lines 170-189), signup (lines 173-177), settings (multiple places)
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

## MEDIUM PRIORITY (Settings Page)

### Issue 7: Firebase Error Handling
- **Files**: `/src/app/(chrome)/settings/account/page.js`
- **Locations**: `handlePasswordChange()` (lines 273-281) + `handleEmailChange()` (lines 340-353)
- **Duplication**: Error code mapping repeated in 2 functions
- **What's duplicated**: Error codes like `auth/wrong-password`, `auth/weak-password`, etc.
- **Solution**: Create `/src/utils/firebaseErrorHandler.js` with centralized error messages

### Issue 8: API Token Fetching Pattern
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

### Issue 9: Date Formatting Functions
- **Files**: `/src/app/(chrome)/settings/account/page.js`
- **Locations**: `formatSessionDate()` (lines 189-208) + `formatDeletionDate()` (lines 424-432)
- **What's duplicated**: Two separate date formatting functions in same file
- **Solution**: Create `/src/utils/dateFormatter.js` with `formatRelativeTime()` and `formatFullDate()`

---

## Summary

| Issue | Duplication | Type | Lines |
|-------|-------------|------|-------|
| scrollToField | 3 pages | Function | ~54 |
| validateFormFields | 3 pages | Function | ~36 |
| handleInputChange | 3 pages | Function | ~75 |
| Form state | 3 pages | Hook | ~12 |
| Frame Logo | 3 pages | Component | ~24 |
| Error display | 4+ places | Component | ~40 |
| Firebase errors | Settings | Function | ~15 |
| API token pattern | Settings | Function | ~50 |
| Date formatters | Settings | Function | ~25 |
| **TOTAL** | **9 issues** | - | **~330 lines** |

**Recommendation**: Start HIGH PRIORITY (form pages) = -270 lines, then MEDIUM PRIORITY (settings utilities) = -90 lines
