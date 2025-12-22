# Duplicated Code Analysis - Twibbonize Platform

## HIGH PRIORITY (Form Pages: signin, signup, forgot-password)

### Issue 1: scrollToField Function
- **Files**: `/src/app/signin/page.js` (lines 33-50), `/src/app/signup/page.js` (lines 34-52), `/src/app/forgot-password/page.js` (lines 32-48)
- **Duplication**: 18 lines × 3 = 54 lines
- **What's duplicated**: Scroll and focus logic - identical except `fieldRefs` object changes
- **Solution**: Move to `/src/utils/formHelpers.js` as `scrollToField(fieldName, fieldRefs)`

### Issue 2: validateFormFields Function
- **Files**: signin (lines 52-63), signup (lines 54-65), forgot-password (lines 50-61)
- **Duplication**: 12 lines × 3 = 36 lines
- **What's duplicated**: Validation flow + error scrolling - only `formType` differs
- **Solution**: Move to `/src/utils/formHelpers.js` as `validateFormFields(formData, formType, ...)`

### Issue 3: Form State Initialization
- **Files**: signin, signup, forgot-password (all have same 4 state variables)
- **Duplication**: 4 lines × 3 = 12 lines
```javascript
const [validationErrors, setValidationErrors] = useState({});
const [fieldValidation, setFieldValidation] = useState({});
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
```
- **Solution**: Create custom hook `/src/hooks/useFormValidation.js`

---

## MEDIUM PRIORITY (Settings Page)

### Issue 4: Firebase Error Handling
- **Files**: `/src/app/(chrome)/settings/account/page.js` 
- **Locations**: `handlePasswordChange()` (lines 273-281) + `handleEmailChange()` (lines 340-353)
- **Duplication**: Similar error code mapping appears twice
- **What's duplicated**: Error codes like `auth/wrong-password`, `auth/weak-password`, etc.
- **Solution**: Create `/src/utils/firebaseErrorHandler.js` with centralized error messages

### Issue 5: API Token Fetching Pattern
- **Files**: `/src/app/(chrome)/settings/account/page.js`
- **Locations**: Lines 67, 100, 132, 366, 401
- **Duplication**: Same pattern repeated 5+ times (~10 lines each)
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
- **Locations**: `formatSessionDate()` (lines 189-208) + `formatDeletionDate()` (lines 424-432)
- **What's duplicated**: Two separate date formatting functions in same file
- **Solution**: Create `/src/utils/dateFormatter.js` with `formatRelativeTime()` and `formatFullDate()`

---

## Summary

| Issue | Duplication | Type | Lines |
|-------|-------------|------|-------|
| scrollToField | 3 pages | Function | ~54 |
| validateFormFields | 3 pages | Function | ~36 |
| Form state | 3 pages | Hook | ~12 |
| Firebase errors | Settings | Function | ~15 |
| API token pattern | Settings | Function | ~50 |
| Date formatters | Settings | Function | ~25 |
| **TOTAL** | **6 issues** | - | **~190 lines** |

**Recommendation**: Start with HIGH PRIORITY (eliminates 102 lines), then MEDIUM PRIORITY utilities.
