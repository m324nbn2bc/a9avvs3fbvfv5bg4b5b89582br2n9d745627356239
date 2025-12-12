/**
 * Canvas-based image composition utility for Twibbonize
 * Handles overlaying user photos with frames and backgrounds
 */

/**
 * Load an image from a File object or URL
 * @param {File|string} source - Image file or URL
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
export const loadImage = (source) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for external images
    
    img.onload = () => {
      resolve(img);
    };
    
    img.onerror = (error) => {
      reject(new Error('Failed to load image'));
    };
    
    // Handle File object vs URL string
    if (source instanceof File || source instanceof Blob) {
      const objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
      // Store URL for cleanup
      img.dataset.objectUrl = objectUrl;
    } else {
      img.src = source;
    }
  });
};

/**
 * Compose user photo with campaign image
 * @param {File} userPhotoFile - User's uploaded photo
 * @param {string} campaignImageUrl - URL of campaign image (frame or background)
 * @param {object} adjustments - Photo adjustments {scale: 1.0, x: 0, y: 0, rotation: 0}
 * @param {string} campaignType - 'frame' or 'background'
 * @returns {Promise<{canvas: HTMLCanvasElement, blob: Blob}>} Composed canvas and blob for download
 */
export const composeImages = async (userPhotoFile, campaignImageUrl, adjustments = {}, campaignType = 'frame') => {
  // Default adjustments
  const { scale = 1.0, x = 0, y = 0, rotation = 0 } = adjustments;
  
  try {
    // Load both images
    const [userPhoto, campaignImage] = await Promise.all([
      loadImage(userPhotoFile),
      loadImage(campaignImageUrl)
    ]);
    
    // Create canvas matching campaign image dimensions
    const canvas = document.createElement('canvas');
    canvas.width = campaignImage.width;
    canvas.height = campaignImage.height;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Compose based on campaign type
    if (campaignType === 'frame') {
      // Frame: User photo UNDER frame (frame overlays on top)
      drawUserPhotoWithAdjustments(ctx, userPhoto, canvas.width, canvas.height, scale, x, y, rotation);
      ctx.drawImage(campaignImage, 0, 0, canvas.width, canvas.height);
    } else {
      // Background: User photo ON TOP of background
      ctx.drawImage(campaignImage, 0, 0, canvas.width, canvas.height);
      drawUserPhotoWithAdjustments(ctx, userPhoto, canvas.width, canvas.height, scale, x, y, rotation);
    }
    
    // Convert to blob for download
    const blob = await canvasToBlob(canvas, 'image/png');
    
    // Cleanup object URLs
    cleanupImage(userPhoto);
    cleanupImage(campaignImage);
    
    return { canvas, blob };
  } catch (error) {
    console.error('Image composition error:', error);
    throw error;
  }
};

/**
 * Draw user photo with scale, position, and rotation adjustments
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLImageElement} img - User photo image
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @param {number} scale - Zoom level (0.1 - 10.0)
 * @param {number} x - Horizontal offset
 * @param {number} y - Vertical offset
 * @param {number} rotation - Rotation angle in degrees (0 - 360)
 */
const drawUserPhotoWithAdjustments = (ctx, img, canvasWidth, canvasHeight, scale, x, y, rotation = 0) => {
  // Save the current context state
  ctx.save();
  
  // Calculate center point for rotation
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  // Move to center, apply rotation, then move back
  ctx.translate(centerX + x, centerY + y);
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Calculate scaled dimensions
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  
  // Draw the image centered at the rotation point
  ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  
  // Restore the context state
  ctx.restore();
};

/**
 * Apply adjustments to canvas and return preview
 * Used for real-time preview without full composition
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {File} userPhotoFile - User photo file
 * @param {string} campaignImageUrl - Campaign image URL
 * @param {object} adjustments - Adjustments object
 * @param {string} campaignType - Campaign type
 * @returns {Promise<HTMLCanvasElement>} Updated canvas
 */
export const updatePreview = async (canvas, userPhotoFile, campaignImageUrl, adjustments, campaignType) => {
  const ctx = canvas.getContext('2d', { alpha: true });
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Load and compose images
  const [userPhoto, campaignImage] = await Promise.all([
    loadImage(userPhotoFile),
    loadImage(campaignImageUrl)
  ]);
  
  // Ensure canvas matches campaign dimensions
  canvas.width = campaignImage.width;
  canvas.height = campaignImage.height;
  
  const { scale = 1.0, x = 0, y = 0, rotation = 0 } = adjustments;
  
  // Compose based on type
  if (campaignType === 'frame') {
    drawUserPhotoWithAdjustments(ctx, userPhoto, canvas.width, canvas.height, scale, x, y, rotation);
    ctx.drawImage(campaignImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(campaignImage, 0, 0, canvas.width, canvas.height);
    drawUserPhotoWithAdjustments(ctx, userPhoto, canvas.width, canvas.height, scale, x, y, rotation);
  }
  
  // Cleanup
  cleanupImage(userPhoto);
  cleanupImage(campaignImage);
  
  return canvas;
};

/**
 * Calculate optimal fit for user photo within canvas
 * @param {File} userPhotoFile - User photo file
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {Promise<{scale: number, x: number, y: number}>} Optimal adjustments
 */
export const calculateFitAdjustments = async (userPhotoFile, canvasWidth, canvasHeight) => {
  const img = await loadImage(userPhotoFile);
  
  // Calculate scale to fit image within canvas (contain mode)
  const scaleX = canvasWidth / img.width;
  const scaleY = canvasHeight / img.height;
  const scale = Math.min(scaleX, scaleY);
  
  // Center the image
  const x = 0;
  const y = 0;
  
  cleanupImage(img);
  
  return { scale, x, y };
};

/**
 * Calculate scale to fill canvas (cover mode)
 * @param {File} userPhotoFile - User photo file
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {Promise<{scale: number, x: number, y: number}>} Optimal adjustments
 */
export const calculateCoverAdjustments = async (userPhotoFile, canvasWidth, canvasHeight) => {
  const img = await loadImage(userPhotoFile);
  
  // Calculate scale to cover canvas (may crop image)
  const scaleX = canvasWidth / img.width;
  const scaleY = canvasHeight / img.height;
  const scale = Math.max(scaleX, scaleY);
  
  // Center the image
  const x = 0;
  const y = 0;
  
  cleanupImage(img);
  
  return { scale, x, y };
};

/**
 * Convert canvas to blob for download
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} format - Image format ('image/png' or 'image/jpeg')
 * @param {number} quality - Image quality (0-1) for JPEG
 * @returns {Promise<Blob>} Image blob
 */
export const canvasToBlob = (canvas, format = 'image/png', quality = 0.95) => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      format,
      quality
    );
  });
};

/**
 * Export canvas as downloadable file
 * @param {HTMLCanvasElement} canvas - Canvas to export
 * @param {string} filename - Download filename
 * @param {string} format - Image format ('png' or 'jpeg')
 */
export const downloadCanvas = async (canvas, filename = 'campaign-image', format = 'png') => {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await canvasToBlob(canvas, mimeType);
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${format}`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup
  URL.revokeObjectURL(url);
};

/**
 * Cleanup object URL from image element
 * @param {HTMLImageElement} img - Image element
 */
const cleanupImage = (img) => {
  if (img.dataset.objectUrl) {
    URL.revokeObjectURL(img.dataset.objectUrl);
    delete img.dataset.objectUrl;
  }
};

/**
 * Get image dimensions from file
 * @param {File} imageFile - Image file
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export const getImageDimensions = async (imageFile) => {
  const img = await loadImage(imageFile);
  const dimensions = {
    width: img.width,
    height: img.height
  };
  cleanupImage(img);
  return dimensions;
};

/**
 * Validate image aspect ratio
 * @param {File} imageFile - Image file
 * @param {number} minRatio - Minimum aspect ratio
 * @param {number} maxRatio - Maximum aspect ratio
 * @returns {Promise<boolean>} True if aspect ratio is valid
 */
export const validateAspectRatio = async (imageFile, minRatio = 0.5, maxRatio = 2.0) => {
  const { width, height } = await getImageDimensions(imageFile);
  const ratio = width / height;
  return ratio >= minRatio && ratio <= maxRatio;
};
