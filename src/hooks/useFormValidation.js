import { useState } from 'react';

/**
 * Custom hook for managing form validation state
 * Centralizes the common form state initialization across signin, signup, and forgot-password pages
 * 
 * @returns {Object} Object containing state and setters:
 *   - validationErrors: Object tracking field-level validation errors
 *   - setValidationErrors: Setter for validationErrors
 *   - fieldValidation: Object tracking field validation status
 *   - setFieldValidation: Setter for fieldValidation
 *   - error: String containing form-level error message
 *   - setError: Setter for error
 *   - loading: Boolean indicating if form submission is in progress
 *   - setLoading: Setter for loading
 */
export function useFormValidation() {
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldValidation, setFieldValidation] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  return {
    validationErrors,
    setValidationErrors,
    fieldValidation,
    setFieldValidation,
    error,
    setError,
    loading,
    setLoading,
  };
}
