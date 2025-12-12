/**
 * Admin Validation Utilities
 * Input validation for admin actions
 */

/**
 * Valid report status values
 */
const VALID_REPORT_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'];

/**
 * Valid moderation status values
 */
const VALID_MODERATION_STATUSES = ['active', 'under-review', 'under-review-hidden', 'removed-temporary', 'removed-permanent'];

/**
 * Valid user role values
 */
const VALID_USER_ROLES = ['admin', 'user'];

/**
 * Validate report status
 * @param {string} status - Status to validate
 * @returns {boolean} Whether status is valid
 */
export function validateReportStatus(status) {
  return VALID_REPORT_STATUSES.includes(status);
}

/**
 * Validate moderation status
 * @param {string} status - Status to validate
 * @returns {boolean} Whether status is valid
 */
export function validateModerationStatus(status) {
  return VALID_MODERATION_STATUSES.includes(status);
}

/**
 * Validate user role
 * @param {string} role - Role to validate
 * @returns {boolean} Whether role is valid
 */
export function validateUserRole(role) {
  return VALID_USER_ROLES.includes(role);
}

/**
 * Validate ban reason is provided
 * @param {string} reason - Ban reason
 * @returns {boolean} Whether reason is valid (not empty)
 */
export function validateBanReason(reason) {
  return typeof reason === 'string' && reason.trim().length > 0;
}

/**
 * Validate report action
 * @param {string} action - Action to validate
 * @returns {boolean} Whether action is valid
 */
export function validateReportAction(action) {
  const validActions = ['removed', 'warned', 'no-action'];
  return validActions.includes(action);
}

/**
 * Get validation error message
 * @param {string} field - Field name
 * @param {string} value - Field value
 * @returns {string|null} Error message or null if valid
 */
export function getValidationError(field, value) {
  switch (field) {
    case 'reportStatus':
      return validateReportStatus(value) ? null : 'Invalid report status';
    case 'moderationStatus':
      return validateModerationStatus(value) ? null : 'Invalid moderation status';
    case 'userRole':
      return validateUserRole(value) ? null : 'Invalid user role';
    case 'banReason':
      return validateBanReason(value) ? null : 'Ban reason is required';
    default:
      return null;
  }
}
