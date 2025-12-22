# Code Inconsistencies & Issues - Twibbonize Platform

REPEATED CODE FOUND - Analysis Without Changes:
1. scrollToField Function ❌ DUPLICATED (3 places)
Locations: /signin/page.js, /signup/page.js, /forgot-password/page.js

Lines 33-50 (signin), 34-52 (signup), 32-48 (forgot-password)

const scrollToField = (fieldName) => {
  const fieldRefs = {
    email: emailRef,
    password: passwordRef  // varies per page
  };
  // ... scroll and focus logic (IDENTICAL)
}
Issue: Same logic, only fieldRefs object changes. Should be a reusable utility.

2. validateFormFields Function ❌ DUPLICATED (3 places)
Locations: /signin/page.js, /signup/page.js, /forgot-password/page.js

Lines 52-63 (signin), 54-65 (signup), 50-61 (forgot-password)

const validateFormFields = (formData) => {
  const validation = validateForm(formData, 'signin'); // only param changes
  setValidationErrors(validation.errors);
  if (validation.firstErrorField) {
    setTimeout(() => scrollToField(validation.firstErrorField), 100);
  }
  return validation.isValid;
};
Issue: Identical logic, only formType parameter differs. Should be centralized.

3. handleInputChange Function ❌ DUPLICATED (3 places)
Locations: /signin/page.js, /signup/page.js, /forgot-password/page.js

Lines 114-141 (signin), 114-144 (signup), 63-87 (forgot-password)

Same pattern:

Clear validation errors on input
Validate field based on type
Update fieldValidation state
Only difference: which validators are called (email vs password vs name)
Issue: ~25 lines of identical code repeated 3 times. Should be one centralized function.

4. Form State Initialization Pattern ❌ DUPLICATED (4 places)
Locations: /signin/page.js, /signup/page.js, /forgot-password/page.js, and implicitly in settings

Repeated in all form pages:

const [validationErrors, setValidationErrors] = useState({});
const [fieldValidation, setFieldValidation] = useState({});
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
Issue: Same state pattern in every form. Could be a custom hook: useFormValidation()

5. Firebase Auth Error Handling ❌ DUPLICATED (2 places in settings)
Locations: /settings/account/page.js - in both handlePasswordChange and handleEmailChange

Lines 273-281 (password) and 340-353 (email)

Similar pattern:

if (error.code === "auth/wrong-password") {
  setError("Current password is incorrect");
} else if (error.code === "auth/weak-password") {
  setError("...");
} else if (error.code === "auth/requires-recent-login") {
  setError("...");
} else {
  setError(error.message || "Failed...");
}
Issue: Similar Firebase error code handling appears in multiple places. Should be a utility function.

6. Date Formatting Functions ⚠️ COULD BE CENTRALIZED
Locations: /settings/account/page.js only (currently)

Lines 189-208 (formatSessionDate) and lines 424-432 (formatDeletionDate)

Both convert dates to formatted strings. Could be consolidated into a date utils file.

Issue: If you add more date formatting in future, duplication will increase.

7. Frame Logo Header ❌ DUPLICATED (4 places)
Locations: /signin/page.js, /signup/page.js, /forgot-password/page.js, and similar pattern

Lines 148-154 (signin, similar in signup, forgot-password)

<div className="absolute top-6 left-6 z-50 mb-8">
  <Link 
    href="/" 
    className={`${caveat.className} text-2xl md:text-3xl font-bold text-emerald-700 ...`}
  >
    Frame
  </Link>
</div>
Issue: Identical header component repeated in multiple pages. Should be a reusable component.

8. Error Display Pattern ❌ DUPLICATED (Multiple places)
Error alert boxes appear in:

/signin/page.js (lines 170-189)
/signup/page.js (lines 173-177)
/settings/account/page.js (lines 445-449, 571-575)
Similar pattern:

{error && (
  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
    {error}
  </div>
)}
Issue: Should be a reusable <ErrorAlert /> component.

9. Success/Status Display Pattern ❌ DUPLICATED
Repeated in:

/settings/account/page.js (lines 576-580 - password success)
Various other places
{passwordSuccess && (
  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
    {passwordSuccess}
  </div>
)}
Issue: Should be a reusable <SuccessAlert /> component.

10. API Token Fetching Pattern ⚠️ REPEATED in settings
Locations: /settings/account/page.js - appears 5+ times

Lines 67, 100, 132, 366, 401

const token = await user.getIdToken();
const response = await fetch('/api/...', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
Issue: Same API call pattern repeated. Could be wrapped in a utility function.

Summary Table - Priority for Centralization:
Pattern	Locations	Type	Priority
scrollToField	3 pages	Function	🔴 HIGH
validateFormFields	3 pages	Function	🔴 HIGH
handleInputChange	3 pages	Function	🔴 HIGH
Form state pattern	4 pages	Hook	🔴 HIGH
Logo header	3+ pages	Component	🟡 MEDIUM
Error alert display	4 places	Component	🟡 MEDIUM
Success alert display	2+ places	Component	🟡 MEDIUM
Firebase error handling	2 places	Function	🟡 MEDIUM
Date formatting	1 file (future risk)	Function	🟡 MEDIUM
API token pattern	Settings (5+ times)	Function	🟡 MEDIUM
Recommended Refactoring Plan:
HIGH PRIORITY (Form Logic):

Create useFormValidation() custom hook
Extract scrollToField() to utils
Extract validateFormFields() logic to utils
Extract handleInputChange() logic to utils
MEDIUM PRIORITY (UI Components):
5. Create <FrameLogo /> component

Create <ErrorAlert /> component
Create <SuccessAlert /> component
MEDIUM PRIORITY (Utilities):
8. Create Firebase error handler utility

Create date formatting utilities
Create API call wrapper for auth headers