/**
 * Image Transformation Utilities
 * 
 * Uses ImageKit.io CDN for optimized image delivery with transformations.
 * ImageKit was chosen over Supabase transforms for better performance,
 * cost efficiency, and no Pro plan requirement.
 * 
 * ImageKit Documentation:
 * https://docs.imagekit.io/features/image-transformations
 */

/**
 * Extract storage path from a full Supabase URL or return path as-is
 * 
 * @param {string} imageUrlOrPath - Full URL or storage path
 * @returns {string} Storage path (e.g., "campaigns/user123/campaign456.png")
 */
function extractStoragePath(imageUrlOrPath) {
  if (!imageUrlOrPath) return '';
  
  if (imageUrlOrPath.includes('/storage/v1/object/public/uploads/')) {
    const parts = imageUrlOrPath.split('/storage/v1/object/public/uploads/');
    return parts[1] || '';
  }
  
  if (imageUrlOrPath.includes('/storage/v1/render/image/public/uploads/')) {
    const parts = imageUrlOrPath.split('/storage/v1/render/image/public/uploads/');
    const pathWithParams = parts[1] || '';
    return pathWithParams.split('?')[0];
  }
  
  return imageUrlOrPath;
}

/**
 * Generate ImageKit transformation URL
 * 
 * @param {string} imageUrlOrPath - Original image URL or path
 * @param {Object} options - Transformation options
 * @param {number} options.width - Target width in pixels
 * @param {number} options.height - Target height in pixels (optional, maintains aspect ratio if omitted)
 * @param {string} options.format - Output format: 'webp', 'png', 'jpeg' (default: 'webp')
 * @param {number} options.quality - Image quality 1-100 (default: 80)
 * @returns {string} Transformed image URL
 * 
 * @example
 * const url = getTransformedImageUrl('campaigns/user123/campaign456.png', {
 *   width: 300,
 *   format: 'webp',
 *   quality: 75
 * });
 */
export function getTransformedImageUrl(imageUrlOrPath, options = {}) {
  const { width, height, format = 'webp', quality = 80 } = options;
  
  if (!imageUrlOrPath) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DEV ERROR] Image path is required for transformation');
    }
    return '';
  }
  
  const imagePath = extractStoragePath(imageUrlOrPath);
  
  if (!imagePath) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DEV ERROR] Could not extract storage path from:', imageUrlOrPath);
    }
    return imageUrlOrPath;
  }
  
  const imagekitUrl = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  
  if (!imagekitUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DEV ERROR] NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is not configured');
    }
    return '';
  }
  
  // Build ImageKit transformation parameters
  const transformParams = [];
  
  if (width) transformParams.push(`w-${width}`);
  if (height) transformParams.push(`h-${height}`);
  if (format) transformParams.push(`f-${format}`);
  if (quality) transformParams.push(`q-${quality}`);
  
  const queryString = transformParams.length > 0 ? `?tr=${transformParams.join(',')}` : '';
  
  return `${imagekitUrl}/${imagePath}${queryString}`;
}

/**
 * Get campaign preview (800px width WebP, quality 80)
 * Used in: Gallery grids, campaign view pages, campaign cards
 * 
 * @param {string} imageUrlOrPath - Campaign image URL or path
 * @returns {string} Preview URL (~400 KB)
 */
export function getCampaignPreview(imageUrlOrPath) {
  return getTransformedImageUrl(imageUrlOrPath, { 
    width: 800, 
    format: 'webp', 
    quality: 80 
  });
}

/**
 * Get full-size campaign image (no transformation)
 * Used in: Canvas operations (adjust page), downloads
 * 
 * @param {string} imageUrlOrPath - Campaign image URL or path
 * @returns {string} Original image URL (~800 KB - 2.5 MB)
 */
export function getCampaignCanvas(imageUrlOrPath) {
  if (!imageUrlOrPath) {
    return '';
  }
  
  const imagePath = extractStoragePath(imageUrlOrPath);
  
  if (!imagePath) {
    return imageUrlOrPath;
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DEV ERROR] NEXT_PUBLIC_SUPABASE_URL is not configured');
    }
    return '';
  }
  
  // Canvas operations need full-size original from Supabase (no CDN transformation)
  return `${supabaseUrl}/storage/v1/object/public/uploads/${imagePath}`;
}

/**
 * Get profile avatar (150x150 WebP, quality 80)
 * Used in: User avatars, creator cards, comments
 * 
 * @param {string} imageUrlOrPath - Profile image URL, path, or Firebase photoURL
 * @returns {string} Avatar URL (~100 KB)
 */
export function getProfileAvatar(imageUrlOrPath) {
  if (!imageUrlOrPath) {
    return '';
  }
  
  // Firebase/Google photos - use as-is (already optimized)
  if (imageUrlOrPath.includes('firebasestorage') || 
      imageUrlOrPath.includes('googleusercontent')) {
    return imageUrlOrPath;
  }
  
  return getTransformedImageUrl(imageUrlOrPath, { 
    width: 150, 
    height: 150, 
    format: 'webp', 
    quality: 80 
  });
}

/**
 * Get profile banner (800x200 WebP, quality 85)
 * Used in: Profile page headers
 * 
 * @param {string} imagePath - Banner image path
 * @returns {string} Banner URL (~150 KB)
 */
export function getProfileBanner(imagePath) {
  return getTransformedImageUrl(imagePath, { 
    width: 800, 
    height: 200, 
    format: 'webp', 
    quality: 85 
  });
}

/**
 * Get optimized image for any use case
 * 
 * @param {string} imagePath - Image path
 * @param {string} size - Preset size: 'thumbnail', 'preview', 'avatar', 'banner', 'full'
 * @returns {string} Optimized image URL
 */
export function getOptimizedImage(imagePath, size = 'preview') {
  switch (size) {
    case 'thumbnail':
    case 'preview':
      return getCampaignPreview(imagePath);
    case 'avatar':
      return getProfileAvatar(imagePath);
    case 'banner':
      return getProfileBanner(imagePath);
    case 'full':
      return getCampaignCanvas(imagePath);
    default:
      return getCampaignPreview(imagePath);
  }
}
