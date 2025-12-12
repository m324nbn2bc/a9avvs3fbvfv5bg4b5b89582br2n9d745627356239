/**
 * Environment Variable Validation Utilities
 *
 * Provides format validation for various environment variables to catch
 * configuration issues early rather than at runtime.
 */

/**
 * Validate MailerSend API Key format
 * @param {string} key - The API key to validate
 * @throws {Error} If the key format is invalid
 */
export function validateMailersendKey(key) {
  const isProduction = process.env.NODE_ENV === "production";

  if (!key) {
    if (isProduction) {
      throw new Error("[PRODUCTION] MAILERSEND_API_KEY is required");
    }
    return false;
  }

  // MailerSend API keys start with 'mlsn.'
  if (!key.startsWith("mlsn.")) {
    const error =
      'MAILERSEND_API_KEY must start with "mlsn." - this appears to be an invalid MailerSend API key';

    if (isProduction) {
      throw new Error(`[PRODUCTION] ${error}`);
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(`[DEV WARNING] ${error}`);
    }
    return false;
  }

  // Basic length check (MailerSend keys are typically 60+ characters)
  if (key.length < 40) {
    const error = `MAILERSEND_API_KEY appears too short (${key.length} chars). Valid keys are typically 60+ characters`;

    if (isProduction) {
      throw new Error(`[PRODUCTION] ${error}`);
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(`[DEV WARNING] ${error}`);
    }
    return false;
  }

  return true;
}

/**
 * Validate Supabase URL format
 * @param {string} url - The Supabase URL to validate
 * @throws {Error} If the URL format is invalid
 */
export function validateSupabaseUrl(url) {
  const isProduction = process.env.NODE_ENV === "production";

  if (!url) {
    if (isProduction) {
      throw new Error("[PRODUCTION] NEXT_PUBLIC_SUPABASE_URL is required");
    }
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    // Supabase URLs should include 'supabase.co' in the hostname
    if (!parsedUrl.hostname.includes("supabase.co")) {
      throw new Error("URL must be a valid Supabase URL (*.supabase.co)");
    }

    // Should use HTTPS
    if (parsedUrl.protocol !== "https:") {
      const error = "Supabase URL must use HTTPS protocol";

      if (isProduction) {
        throw new Error(`[PRODUCTION] ${error}`);
      }

      if (process.env.NODE_ENV === "development") {
        console.warn(`[DEV WARNING] ${error}`);
      }
      return false;
    }

    return true;
  } catch (error) {
    const errorMsg = `Invalid NEXT_PUBLIC_SUPABASE_URL format: ${error.message}`;

    if (isProduction) {
      throw new Error(`[PRODUCTION] ${errorMsg}`);
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(`[DEV WARNING] ${errorMsg}`);
    }
    return false;
  }
}

/**
 * Validate Firebase Service Account Key format
 * @param {string} keyJson - The JSON string of the service account key
 * @throws {Error} If the key format is invalid
 */
export function validateFirebaseServiceKey(keyJson) {
  const isProduction = process.env.NODE_ENV === "production";

  if (!keyJson) {
    if (isProduction) {
      throw new Error("[PRODUCTION] FIREBASE_SERVICE_ACCOUNT_KEY is required");
    }
    return false;
  }

  try {
    const key = JSON.parse(keyJson);

    // Check required fields for Firebase service account
    const requiredFields = [
      "type",
      "project_id",
      "private_key",
      "client_email",
    ];
    const missingFields = requiredFields.filter((field) => !key[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Validate type
    if (key.type !== "service_account") {
      throw new Error('Service account key type must be "service_account"');
    }

    // Validate private key format
    if (!key.private_key.includes("BEGIN PRIVATE KEY")) {
      throw new Error("Invalid private_key format - must be a valid PEM key");
    }

    // Validate client email format
    if (
      !key.client_email.includes("@") ||
      !key.client_email.includes(".iam.gserviceaccount.com")
    ) {
      throw new Error(
        "Invalid client_email format - must be a valid service account email",
      );
    }

    return true;
  } catch (error) {
    const errorMsg = `Invalid FIREBASE_SERVICE_ACCOUNT_KEY format: ${error.message}`;

    if (isProduction) {
      throw new Error(`[PRODUCTION] ${errorMsg}`);
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(`[DEV WARNING] ${errorMsg}`);
    }
    return false;
  }
}

/**
 * Validate ImageKit URL endpoint format
 * @param {string} url - The ImageKit URL endpoint to validate
 * @throws {Error} If the URL format is invalid
 */
export function validateImageKitUrl(url) {
  const isProduction = process.env.NODE_ENV === "production";

  if (!url) {
    if (isProduction) {
      throw new Error(
        "[PRODUCTION] NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is required",
      );
    }
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    // ImageKit URLs should include 'imagekit.io' in the hostname
    if (!parsedUrl.hostname.includes("imagekit.io")) {
      throw new Error("URL must be a valid ImageKit URL (*.imagekit.io)");
    }

    // Should use HTTPS
    if (parsedUrl.protocol !== "https:") {
      const error = "ImageKit URL must use HTTPS protocol";

      if (isProduction) {
        throw new Error(`[PRODUCTION] ${error}`);
      }

      if (process.env.NODE_ENV === "development") {
        console.warn(`[DEV WARNING] ${error}`);
      }
      return false;
    }

    return true;
  } catch (error) {
    const errorMsg = `Invalid NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT format: ${error.message}`;

    if (isProduction) {
      throw new Error(`[PRODUCTION] ${errorMsg}`);
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(`[DEV WARNING] ${errorMsg}`);
    }
    return false;
  }
}

/**
 * Validate CRON_SECRET format
 * @param {string} secret - The cron secret to validate
 * @throws {Error} If the secret format is invalid
 */
export function validateCronSecret(secret) {
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProduction) {
      throw new Error("[PRODUCTION] CRON_SECRET is required");
    }
    return false;
  }

  // CRON_SECRET should be at least 32 characters for security
  if (secret.length < 32) {
    const error = `CRON_SECRET is too short (${secret.length} chars). Should be at least 32 characters for security`;

    if (isProduction) {
      throw new Error(`[PRODUCTION] ${error}`);
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(`[DEV WARNING] ${error}`);
    }
    return false;
  }

  return true;
}
