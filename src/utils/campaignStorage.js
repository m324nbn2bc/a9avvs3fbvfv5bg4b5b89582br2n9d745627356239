/**
 * Campaign Storage Utilities
 * 
 * Helper functions for working with campaign image storage paths.
 * Ensures consistent path structure: campaigns/{userId}/{campaignId}.png
 */

/**
 * Build the storage path for a campaign image
 * 
 * @param {string} userId - User ID (creator of the campaign)
 * @param {string} campaignId - Campaign ID
 * @returns {string} Storage path: campaigns/{userId}/{campaignId}.png
 * 
 * @example
 * const path = buildCampaignImagePath('user123', 'campaign456');
 * // Returns: "campaigns/user123/campaign456.png"
 */
export function buildCampaignImagePath(userId, campaignId) {
  if (!userId || !campaignId) {
    throw new Error('userId and campaignId are required');
  }
  
  return `campaigns/${userId}/${campaignId}.png`;
}

/**
 * Build the public URL for a campaign image
 * 
 * @param {string} userId - User ID (creator of the campaign)
 * @param {string} campaignId - Campaign ID
 * @returns {string} Public URL to the campaign image
 * 
 * @example
 * const url = buildCampaignImageUrl('user123', 'campaign456');
 * // Returns: "https://{project}.supabase.co/storage/v1/object/public/uploads/campaigns/user123/campaign456.png"
 */
export function buildCampaignImageUrl(userId, campaignId) {
  const path = buildCampaignImagePath(userId, campaignId);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  
  return `${supabaseUrl}/storage/v1/object/public/uploads/${path}`;
}

/**
 * Extract userId and campaignId from a campaign image path
 * 
 * @param {string} path - Storage path
 * @returns {{userId: string, campaignId: string} | null} Extracted IDs or null if invalid
 * 
 * @example
 * const ids = parseCampaignImagePath('campaigns/user123/campaign456.png');
 * // Returns: { userId: 'user123', campaignId: 'campaign456' }
 */
export function parseCampaignImagePath(path) {
  if (!path) return null;
  
  // Match pattern: campaigns/{userId}/{campaignId}.png
  const match = path.match(/^campaigns\/([^/]+)\/([^/]+)\.png$/);
  
  if (!match) return null;
  
  return {
    userId: match[1],
    campaignId: match[2]
  };
}

/**
 * Validate if a path matches the campaign storage structure
 * 
 * @param {string} path - Storage path to validate
 * @returns {boolean} True if path matches campaigns/{userId}/{campaignId}.png
 * 
 * @example
 * isValidCampaignPath('campaigns/user123/campaign456.png'); // true
 * isValidCampaignPath('uploads/user123/file.png'); // false
 */
export function isValidCampaignPath(path) {
  return parseCampaignImagePath(path) !== null;
}

/**
 * Get campaign upload URL from API
 * Client-side helper for uploading campaign images
 * 
 * @param {string} campaignId - Campaign ID
 * @param {number} fileSize - File size in bytes
 * @param {string} fileType - MIME type of the file
 * @param {string} authToken - Firebase auth token
 * @returns {Promise<{uploadUrl: string, path: string, token: string}>}
 * 
 * @example
 * const { uploadUrl, path } = await getCampaignUploadUrl(campaignId, file.size, file.type, token);
 * await fetch(uploadUrl, {
 *   method: 'PUT',
 *   body: imageFile,
 *   headers: { 'Content-Type': 'image/png' }
 * });
 */
export async function getCampaignUploadUrl(campaignId, fileSize, fileType, authToken) {
  const response = await fetch('/api/storage/campaign-upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ campaignId, fileSize, fileType })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get upload URL');
  }
  
  return response.json();
}

/**
 * Delete a campaign image from storage
 * Client-side helper for deleting campaign images
 * 
 * @param {string} path - Storage path to delete
 * @param {string} authToken - Firebase auth token
 * @returns {Promise<{success: boolean}>}
 * 
 * @example
 * const path = buildCampaignImagePath(userId, campaignId);
 * await deleteCampaignImage(path, token);
 */
export async function deleteCampaignImage(path, authToken) {
  const response = await fetch('/api/storage/delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ path })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete image');
  }
  
  return response.json();
}
