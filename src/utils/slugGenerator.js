/**
 * Generate URL-friendly slug from campaign title
 * 
 * Algorithm (from CAMPAIGN_SYSTEM.md):
 * 1. Convert title to lowercase
 * 2. Replace spaces with hyphens
 * 3. Remove special characters
 * 4. Append random 4-character suffix (alphanumeric, base36)
 * 5. No uniqueness check needed (collision probability extremely low)
 * 
 * @param {string} title - Campaign title
 * @returns {string} URL-friendly slug
 * 
 * @example
 * generateSlug("Save Earth 2025") // => "save-earth-2025-k8m3"
 * generateSlug("My Frame!") // => "my-frame-a7b2"
 */
export function generateSlug(title) {
  if (!title || typeof title !== 'string') {
    throw new Error('Title is required and must be a string');
  }
  
  // Step 1-3: Convert to lowercase, remove special chars, replace spaces
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars (keep letters, numbers, spaces, hyphens)
    .replace(/\s+/g, '-')           // Spaces to hyphens
    .replace(/-+/g, '-')            // Multiple hyphens to single
    .substring(0, 50);              // Max 50 chars for base slug
  
  // Handle edge case: empty slug after sanitization
  if (!baseSlug) {
    return `campaign-${generateRandomSuffix()}`;
  }
  
  // Step 4: Generate 4-char random suffix (0-9, a-z)
  const suffix = generateRandomSuffix();
  
  return `${baseSlug}-${suffix}`;
}

/**
 * Generate random 4-character alphanumeric suffix
 * Uses base36 (0-9, a-z) for URL-safe characters
 * 
 * @returns {string} 4-character random suffix
 */
function generateRandomSuffix() {
  return Math.random().toString(36).substring(2, 6).padEnd(4, '0');
}

/**
 * Validate if a string is a valid slug format
 * 
 * @param {string} slug - Slug to validate
 * @returns {boolean} True if valid slug format
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  
  // Valid slug: lowercase letters, numbers, hyphens only
  // Must end with 4-character suffix pattern
  const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*-[a-z0-9]{4}$/;
  return slugPattern.test(slug);
}
