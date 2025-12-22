# Code Inconsistencies - Twibbonize Platform

## HIGH PRIORITY - Form Logic Duplication (3 Auth Pages)

### 1. scrollToField Function (Lines: signin 33-50, signup 34-52, forgot-password 32-48)
**Issue**: Identical scroll & focus logic repeated 3 times. Only `fieldRefs` object differs.  
**Solution**: Extract to `/src/utils/formHelpers.js` - accept fieldRefs as parameter.

### 2. validateFormFields Function (Lines: signin 52-63, signup 54-65, forgot-password 50-61)
**Issue**: Identical validation flow repeated 3 times. Only `formType` parameter differs.  
**Solution**: Extract to `/src/utils/formHelpers.js` - pass formType as parameter.

### 3. Form State Pattern (signin, signup, forgot-password)
**Issue**: Identical state initialization in all 3 pages:
```javascript
const [validationErrors, setValidationErrors] = useState({});
const [fieldValidation, setFieldValidation] = useState({});
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
```
**Solution**: Create custom hook `/src/hooks/useFormValidation.js`.

---

## MEDIUM PRIORITY - Settings Page Duplication

### 4. Firebase Error Handling (Lines: password 273-281, email 340-353)
**Issue**: Same error code mapping repeated twice in `/settings/account/page.js`.  
**Solution**: Create `/src/utils/firebaseErrorHandler.js` with centralized error messages.

### 5. API Token Pattern (Lines: 67, 100, 132, 366, 401 in settings/account)
**Issue**: Same `getIdToken()` + `fetch()` + headers pattern repeated 5+ times.  
**Solution**: Create `/src/utils/apiClient.js` with `authenticatedFetch(url, options, user)`.

### 6. Date Formatters (Lines: 189-208, 424-432 in settings/account)
**Issue**: Two separate date formatting functions in same file.  
**Solution**: Create `/src/utils/dateFormatter.js` with `formatRelativeTime()` and `formatFullDate()`.

---

## Summary

| Pattern | Locations | Type | Impact |
|---------|-----------|------|--------|
| scrollToField | 3 pages | Function | ~20 lines duplicated |
| validateFormFields | 3 pages | Function | ~15 lines duplicated |
| Form state | 3 pages | Hook | 4 lines × 3 = 12 lines |
| Firebase errors | 2 functions | Function | ~15 lines duplicated |
| API token pattern | 5+ calls | Function | ~10 lines × 5 = 50 lines |
| Date formatters | 2 functions | Function | ~20 lines in same file |

**Total Duplication**: ~130 lines of repeated code
