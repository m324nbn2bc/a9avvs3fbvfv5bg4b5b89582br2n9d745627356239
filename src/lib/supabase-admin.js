// Server-side Supabase client with service role key
import 'server-only'
import { createClient } from '@supabase/supabase-js'

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate required environment variables
const missingVars = [];
if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

let supabaseAdmin

if (missingVars.length > 0) {
  const errorMessage = `Missing required Supabase configuration: ${missingVars.join(', ')}`;
  
  if (isProduction) {
    // Production: Fail fast
    throw new Error(`[PRODUCTION] ${errorMessage}. Please add these environment variables in Vercel.`);
  }
  
  if (isDevelopment) {
    // Development: Warn clearly
    console.warn(`[DEV WARNING] ${errorMessage}`);
    console.warn('[DEV WARNING] Supabase storage will not be available. Add these variables in Vercel for production.');
  }
  
  // Create a mock client that fails at runtime with clear errors
  supabaseAdmin = {
    storage: {
      from: () => ({
        list: () => Promise.reject(new Error('Supabase not configured - missing environment variables')),
        remove: () => Promise.reject(new Error('Supabase not configured - missing environment variables')),
        createSignedUrl: () => Promise.reject(new Error('Supabase not configured - missing environment variables')),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  }
} else {
  // Validate Supabase URL format
  try {
    const url = new URL(supabaseUrl);
    
    if (isProduction && !supabaseUrl.includes('supabase.co')) {
      throw new Error('[PRODUCTION] NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase URL (*.supabase.co)');
    }
  } catch (error) {
    const errorMessage = `Invalid NEXT_PUBLIC_SUPABASE_URL format: ${error.message}`;
    
    if (isProduction) {
      throw new Error(`[PRODUCTION] ${errorMessage}. Please check the URL in Vercel.`);
    }
    
    if (isDevelopment) {
      console.warn(`[DEV WARNING] ${errorMessage}`);
    }
    
    throw error;
  }
  
  // Create admin client with service role key (server-side only)
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  if (isDevelopment) {
    console.log('[DEV] Supabase Admin client initialized successfully');
  }
}

export { supabaseAdmin }
export default supabaseAdmin
