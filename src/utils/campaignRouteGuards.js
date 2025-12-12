/**
 * Route guard utilities for 3-page campaign flow
 * Ensures users follow the proper flow: Upload → Adjust → Result
 */

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

/**
 * Check if session has expired (24 hours)
 * @param {number} timestamp - Session creation timestamp
 * @returns {boolean} - True if expired
 */
export function isSessionExpired(timestamp) {
  if (!timestamp) return true;
  return Date.now() - timestamp > TWENTY_FOUR_HOURS;
}

/**
 * Check if photo is uploaded, redirect to upload page if not
 * Used for: Adjust page, Result page
 * @param {Object} session - Current campaign session
 * @param {Object} router - Next.js router
 * @param {string} slug - Campaign slug
 * @returns {boolean} - True if photo exists, false if redirected
 */
export function requirePhotoUpload(session, router, slug) {
  // No session or no photo data
  if (!session || !session.userPhotoPreview) {
    router.push(`/campaign/${slug}`);
    return false;
  }
  
  // Session expired
  if (isSessionExpired(session.timestamp)) {
    router.push(`/campaign/${slug}`);
    return false;
  }
  
  return true;
}

/**
 * Check if image is downloaded, redirect appropriately if not
 * Used for: Result page
 * @param {Object} session - Current campaign session
 * @param {Object} router - Next.js router
 * @param {string} slug - Campaign slug
 * @returns {boolean} - True if downloaded, false if redirected
 */
export function requireDownloadComplete(session, router, slug) {
  // No session
  if (!session) {
    router.push(`/campaign/${slug}`);
    return false;
  }
  
  // Session expired
  if (isSessionExpired(session.timestamp)) {
    router.push(`/campaign/${slug}`);
    return false;
  }
  
  // No photo uploaded - go to upload page
  if (!session.userPhotoPreview) {
    router.push(`/campaign/${slug}`);
    return false;
  }
  
  // Photo uploaded but not downloaded - go to adjust page
  if (!session.downloaded) {
    router.push(`/campaign/${slug}/adjust`);
    return false;
  }
  
  return true;
}

/**
 * Get the appropriate redirect destination based on session state
 * @param {Object} session - Current campaign session
 * @param {string} slug - Campaign slug
 * @returns {string} - Redirect path
 */
export function getRedirectPath(session, slug) {
  if (!session || !session.userPhotoPreview || isSessionExpired(session.timestamp)) {
    return `/campaign/${slug}`;
  }
  
  if (!session.downloaded) {
    return `/campaign/${slug}/adjust`;
  }
  
  return `/campaign/${slug}/result`;
}
