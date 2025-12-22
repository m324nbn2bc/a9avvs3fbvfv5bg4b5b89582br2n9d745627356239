# Duplicated Code Analysis - Twibbonize Platform

## ✅ FIXED ISSUES (Removed from active list)

### Fixed in `/src/utils/formHelpers.js`:
1. ~~scrollToField Function~~ - Extracted to `scrollToField(fieldName, fieldRefs)` utility
2. ~~validateFormFields Function~~ - Extracted to `validateFormFields(formData, formType, setValidationErrors, fieldRefs)` utility
3. ~~handleInputChange Function~~ - Extracted to `handleFieldInputChange(field, value, ...)` with validator map pattern

### Fixed with custom hooks and components:
4. ~~Form State Initialization~~ - Created custom hook `/src/hooks/useFormValidation.js` used in signin, signup, forgot-password (12 lines eliminated)
5. ~~Frame Logo Header~~ - Created reusable component `/src/components/FrameLogo.jsx` used in signin, signup, forgot-password (24 lines eliminated)

**Result**: ~201 lines of duplication eliminated (165 + 36 from new fixes)

---

## REMAINING HIGH PRIORITY (Form Pages: signin, signup, forgot-password)

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
| ~~Form state~~ | 3 pages | Hook | ~12 | ✅ FIXED |
| ~~Frame Logo~~ | 3 pages | Component | ~24 | ✅ FIXED |
| Error display | 4+ places | Component | ~40 | 🔜 TODO |
| Firebase errors | Settings | Function | ~15 | 🔜 TODO |
| API token pattern | Settings | Function | ~50 | 🔜 TODO |
| Date formatters | Settings | Function | ~25 | 🔜 TODO |
| **REMAINING** | **4 issues** | - | **~130 lines** | |

**Progress**: 5/9 issues fixed = 201 lines eliminated (56% complete)
