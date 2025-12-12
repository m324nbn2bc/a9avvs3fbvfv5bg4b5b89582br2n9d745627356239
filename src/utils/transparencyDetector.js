/**
 * Transparency Detection Utility for Frame Validation
 * 
 * Uses Canvas API to analyze images for transparency.
 * Frames must have at least 5% transparent pixels to be valid.
 * 
 * Based on algorithm from CAMPAIGN_SYSTEM.md
 */

/**
 * Check if an image file has sufficient transparency for a frame
 * 
 * @param {File} imageFile - Image file to analyze
 * @param {number} minTransparencyPercent - Minimum transparency required (default: 5%)
 * @returns {Promise<{hasTransparency: boolean, transparencyPercent: number, error?: string}>}
 * 
 * @example
 * const result = await checkTransparency(file);
 * if (result.hasTransparency) {
 *   console.log(`Valid frame with ${result.transparencyPercent.toFixed(2)}% transparency`);
 * } else {
 *   console.error(result.error);
 * }
 */
export async function checkTransparency(imageFile, minTransparencyPercent = 5) {
  if (!imageFile) {
    return {
      hasTransparency: false,
      transparencyPercent: 0,
      error: 'No image file provided'
    };
  }

  // Check if file is an image
  if (!imageFile.type.startsWith('image/')) {
    return {
      hasTransparency: false,
      transparencyPercent: 0,
      error: 'File is not an image'
    };
  }

  // PNG is required for transparency (check file type)
  if (!imageFile.type.includes('png')) {
    return {
      hasTransparency: false,
      transparencyPercent: 0,
      error: 'Frame must be a PNG image with transparency. Please use PNG format.'
    };
  }

  try {
    const result = await analyzeImageTransparency(imageFile);
    
    if (result.error) {
      return {
        hasTransparency: false,
        transparencyPercent: 0,
        error: result.error
      };
    }

    const hasTransparency = result.transparencyPercent >= minTransparencyPercent;

    if (!hasTransparency) {
      return {
        hasTransparency: false,
        transparencyPercent: result.transparencyPercent,
        error: `Frame must have at least ${minTransparencyPercent}% transparent area for photos. Current: ${result.transparencyPercent.toFixed(2)}%`
      };
    }

    return {
      hasTransparency: true,
      transparencyPercent: result.transparencyPercent
    };
  } catch (error) {
    return {
      hasTransparency: false,
      transparencyPercent: 0,
      error: `Failed to analyze image: ${error.message}`
    };
  }
}

/**
 * Analyze image transparency using Canvas API
 * 
 * @param {File} imageFile - Image file to analyze
 * @returns {Promise<{transparencyPercent: number, error?: string}>}
 */
async function analyzeImageTransparency(imageFile) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0);

        // Get image data (RGBA pixel array)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        let transparentPixels = 0;
        const totalPixels = canvas.width * canvas.height;

        // Check alpha channel of each pixel
        // pixels array format: [r, g, b, a, r, g, b, a, ...]
        // Alpha channel is every 4th value (index 3, 7, 11, ...)
        for (let i = 3; i < pixels.length; i += 4) {
          // Alpha value < 255 means some transparency
          if (pixels[i] < 255) {
            transparentPixels++;
          }
        }

        const transparencyPercent = (transparentPixels / totalPixels) * 100;

        // Clean up
        URL.revokeObjectURL(img.src);

        resolve({
          transparencyPercent,
          totalPixels,
          transparentPixels
        });
      } catch (error) {
        reject(new Error(`Canvas analysis failed: ${error.message}`));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    // Create object URL for the image file
    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Quick check if file type supports transparency
 * 
 * @param {File} imageFile - Image file to check
 * @returns {boolean} True if file type supports transparency
 */
export function supportsTransparency(imageFile) {
  if (!imageFile || !imageFile.type) {
    return false;
  }
  
  // PNG supports transparency, JPG/JPEG does not
  return imageFile.type.includes('png');
}

/**
 * Get transparency info for display purposes
 * 
 * @param {File} imageFile - Image file to analyze
 * @returns {Promise<{valid: boolean, message: string, percent?: number}>}
 */
export async function getTransparencyInfo(imageFile) {
  const result = await checkTransparency(imageFile);
  
  if (result.hasTransparency) {
    return {
      valid: true,
      message: `Valid frame with ${result.transparencyPercent.toFixed(1)}% transparency`,
      percent: result.transparencyPercent
    };
  } else {
    return {
      valid: false,
      message: result.error || 'Invalid transparency',
      percent: result.transparencyPercent
    };
  }
}
