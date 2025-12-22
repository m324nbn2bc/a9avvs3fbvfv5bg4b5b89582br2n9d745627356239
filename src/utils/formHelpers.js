import { validateForm } from './validation';

// Form Helper Functions - Centralized utilities for form operations

/**
 * Scrolls to a form field and focuses it
 * @param {string} fieldName - Name of the field to scroll to
 * @param {object} fieldRefs - Object mapping field names to React refs
 */
export const scrollToField = (fieldName, fieldRefs) => {
  const fieldRef = fieldRefs[fieldName];
  if (fieldRef?.current) {
    fieldRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    // Focus the field after scrolling
    setTimeout(() => {
      fieldRef.current.focus();
    }, 300);
  }
};

/**
 * Validates form fields and handles errors with scrolling
 * @param {FormData} formData - The form data to validate
 * @param {string} formType - Type of form ('signin', 'signup', 'forgot-password')
 * @param {function} setValidationErrors - State setter for validation errors
 * @param {object} fieldRefs - Object mapping field names to React refs
 * @returns {boolean} - Whether the form is valid
 */
export const validateFormFields = (formData, formType, setValidationErrors, fieldRefs) => {
  const validation = validateForm(formData, formType);
  
  setValidationErrors(validation.errors);
  
  // If there are errors, scroll to the first error field
  if (validation.firstErrorField) {
    setTimeout(() => scrollToField(validation.firstErrorField, fieldRefs), 100);
  }
  
  return validation.isValid;
};

/**
 * Handles real-time input field validation
 * @param {string} field - Field name
 * @param {string} value - Field value
 * @param {object} validationErrors - Current validation errors state
 * @param {function} setValidationErrors - State setter for validation errors
 * @param {function} setFieldValidation - State setter for field validation status
 * @param {object} validatorMap - Map of field names to validator functions
 */
export const handleFieldInputChange = (
  field,
  value,
  validationErrors,
  setValidationErrors,
  setFieldValidation,
  validatorMap
) => {
  // Clear form validation errors when user starts typing
  if (validationErrors[field]) {
    setValidationErrors(prev => ({ ...prev, [field]: '' }));
  }
  
  // Perform real-time validation
  let validationError = null;
  let isValid = false;
  
  if (field in validatorMap && value.trim()) {
    validationError = validatorMap[field](value);
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
