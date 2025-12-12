/**
 * Status Transition Validator
 * 
 * Validates state transitions for campaigns and users to enforce business rules.
 * Prevents invalid transitions like restoring permanently removed/banned content.
 * 
 * Updated: October 25, 2025
 * - Added support for 'under-review' as intermediate status
 * - Enforces permanent status restrictions (no transitions out)
 */

/**
 * Valid transitions for campaign moderation statuses
 * 
 * Status meanings:
 * - active: Campaign visible to public
 * - under-review: 1-2 reports received, still visible but flagged
 * - under-review-hidden: 3+ reports received, hidden from public
 * - removed-temporary: Admin removed, 30-day appeal window
 * - removed-permanent: Permanent removal, no recovery
 */
const VALID_CAMPAIGN_TRANSITIONS = {
  'active': ['under-review', 'under-review-hidden', 'removed-temporary', 'removed-permanent'],
  'under-review': ['active', 'under-review-hidden', 'removed-temporary', 'removed-permanent'],
  'under-review-hidden': ['active', 'under-review', 'removed-temporary', 'removed-permanent'],
  'removed-temporary': ['active', 'removed-permanent'],
  'removed-permanent': [], // NO transitions out - truly permanent
};

/**
 * Valid transitions for user account statuses
 * 
 * Status meanings:
 * - active: User can log in, account fully functional
 * - under-review: 1-9 reports received, profile still visible
 * - under-review-hidden: 10+ reports received, profile hidden
 * - banned-temporary: Cannot log in, 30-day appeal window
 * - banned-permanent: Permanent ban, no recovery
 */
const VALID_ACCOUNT_TRANSITIONS = {
  'active': ['under-review', 'under-review-hidden', 'banned-temporary', 'banned-permanent'],
  'under-review': ['active', 'under-review-hidden', 'banned-temporary', 'banned-permanent'],
  'under-review-hidden': ['active', 'under-review', 'banned-temporary', 'banned-permanent'],
  'banned-temporary': ['active', 'banned-permanent'],
  'banned-permanent': [], // NO transitions out - truly permanent
};

/**
 * Validates a campaign moderation status transition
 * 
 * @param {string} currentStatus - Current moderation status
 * @param {string} newStatus - Desired new status
 * @returns {Object} { valid: boolean, error?: string }
 * 
 * @example
 * validateCampaignTransition('active', 'under-review')
 * // Returns: { valid: true }
 * 
 * @example
 * validateCampaignTransition('removed-permanent', 'active')
 * // Returns: { valid: false, error: '...' }
 */
export function validateCampaignTransition(currentStatus, newStatus) {
  // If status isn't changing, always allow
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  // Check if current status exists in transition map
  if (!VALID_CAMPAIGN_TRANSITIONS.hasOwnProperty(currentStatus)) {
    return { 
      valid: false, 
      error: `Invalid current campaign status: ${currentStatus}` 
    };
  }

  // Check if transition is allowed
  if (!VALID_CAMPAIGN_TRANSITIONS[currentStatus].includes(newStatus)) {
    // Special error message for permanent status
    if (currentStatus === 'removed-permanent') {
      return {
        valid: false,
        error: 'Cannot restore permanently removed campaigns. Permanent removals are final and cannot be reversed.'
      };
    }

    return { 
      valid: false, 
      error: `Invalid transition: Cannot change campaign status from '${currentStatus}' to '${newStatus}'.` 
    };
  }

  return { valid: true };
}

/**
 * Validates a user account status transition
 * 
 * @param {string} currentStatus - Current account status
 * @param {string} newStatus - Desired new status
 * @returns {Object} { valid: boolean, error?: string }
 * 
 * @example
 * validateAccountTransition('active', 'under-review')
 * // Returns: { valid: true }
 * 
 * @example
 * validateAccountTransition('banned-permanent', 'active')
 * // Returns: { valid: false, error: '...' }
 */
export function validateAccountTransition(currentStatus, newStatus) {
  // If status isn't changing, always allow
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  // Check if current status exists in transition map
  if (!VALID_ACCOUNT_TRANSITIONS.hasOwnProperty(currentStatus)) {
    return { 
      valid: false, 
      error: `Invalid current account status: ${currentStatus}` 
    };
  }

  // Check if transition is allowed
  if (!VALID_ACCOUNT_TRANSITIONS[currentStatus].includes(newStatus)) {
    // Special error message for permanent status
    if (currentStatus === 'banned-permanent') {
      return {
        valid: false,
        error: 'Cannot unban permanently banned users. Permanent bans are final and cannot be reversed.'
      };
    }

    return { 
      valid: false, 
      error: `Invalid transition: Cannot change account status from '${currentStatus}' to '${newStatus}'.` 
    };
  }

  return { valid: true };
}

/**
 * Gets list of valid next statuses for a campaign
 * 
 * @param {string} currentStatus - Current moderation status
 * @returns {string[]} Array of valid next statuses
 */
export function getValidCampaignStatuses(currentStatus) {
  return VALID_CAMPAIGN_TRANSITIONS[currentStatus] || [];
}

/**
 * Gets list of valid next statuses for a user account
 * 
 * @param {string} currentStatus - Current account status
 * @returns {string[]} Array of valid next statuses
 */
export function getValidAccountStatuses(currentStatus) {
  return VALID_ACCOUNT_TRANSITIONS[currentStatus] || [];
}
