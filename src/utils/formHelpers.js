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
