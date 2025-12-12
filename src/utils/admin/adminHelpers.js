/**
 * Admin Helper Utilities
 * Reusable formatting and helper functions for admin dashboard
 */

/**
 * Convert report reason to human-readable text
 * @param {string} reason - Report reason code
 * @returns {string} Human-readable reason
 */
export function formatReportReason(reason) {
  switch (reason) {
    case 'inappropriate':
      return 'Inappropriate Content';
    case 'spam':
      return 'Spam';
    case 'copyright':
      return 'Copyright Violation';
    case 'inappropriate_avatar':
      return 'Inappropriate Profile Picture';
    case 'offensive_username':
      return 'Offensive Username';
    case 'spam_bio':
      return 'Spam in Bio';
    case 'impersonation':
      return 'Impersonation';
    case 'other':
      return 'Other';
    default:
      return reason;
  }
}

/**
 * Get badge color class for moderation status
 * @param {string} status - Moderation status
 * @returns {string} Tailwind CSS classes
 */
export function getModerationStatusColor(status) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'under-review':
      return 'bg-yellow-100 text-yellow-800';
    case 'under-review-hidden':
      return 'bg-orange-100 text-orange-800';
    case 'removed':
    case 'removed-temporary':
      return 'bg-red-100 text-red-800';
    case 'removed-permanent':
      return 'bg-red-200 text-red-900';
    case 'banned-temporary':
      return 'bg-red-100 text-red-800';
    case 'banned-permanent':
      return 'bg-red-200 text-red-900';
    case 'deleted':
      return 'bg-gray-200 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get badge color class for report status
 * @param {string} status - Report status
 * @returns {string} Tailwind CSS classes
 */
export function getReportStatusColor(status) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'reviewed':
      return 'bg-blue-100 text-blue-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'dismissed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get badge color class for user role
 * @param {string} role - User role
 * @returns {string} Tailwind CSS classes
 */
export function getRoleBadgeColor(role) {
  return role === 'admin' 
    ? 'bg-purple-100 text-purple-800' 
    : 'bg-gray-100 text-gray-800';
}

/**
 * Format timestamp to human-readable date
 * @param {string|Date} dateString - Date string or Date object
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date
 */
export function formatTimestamp(dateString, includeTime = false) {
  if (!dateString) return '-';
  
  try {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return new Date(dateString).toLocaleDateString('en-US', options);
  } catch {
    return '-';
  }
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text with ellipsis
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString();
}
