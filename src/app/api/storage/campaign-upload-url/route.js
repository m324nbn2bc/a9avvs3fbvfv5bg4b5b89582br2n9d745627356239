import { NextResponse } from 'next/server'
import { verifyIdToken } from '../../../../lib/firebaseAdmin'
import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { headers } from 'next/headers'

/**
 * Campaign Upload URL Generation Endpoint
 * 
 * Creates signed upload URLs for campaign images with the correct path structure:
 * campaigns/{userId}/{campaignId}.png
 * 
 * This ensures:
 * - Predictable file paths (easy deletion)
 * - One image per campaign (no duplicates)
 * - Clear ownership structure
 * - PNG format enforcement (required for transparency)
 */

// Force Node.js runtime for server-side operations
export const runtime = 'nodejs'

export async function POST(request) {
  try {
    // Get the authorization header
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No authorization token provided' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    
    // Verify Firebase ID token
    let decodedToken
    try {
      decodedToken = await verifyIdToken(token)
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const { campaignId, fileSize, fileType } = await request.json()
    
    // Validate required fields
    if (!campaignId) {
      return NextResponse.json({ success: false, error: 'campaignId is required' }, { status: 400 })
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ 
        success: false,
        error: 'fileSize is required and must be a positive number' 
      }, { status: 400 })
    }

    if (!fileType || typeof fileType !== 'string' || fileType.trim() === '') {
      return NextResponse.json({ 
        success: false,
        error: 'fileType is required and must be a non-empty string' 
      }, { status: 400 })
    }

    // Validate campaignId format (alphanumeric, hyphens, underscores only)
    const campaignIdRegex = /^[a-zA-Z0-9_-]+$/
    if (!campaignIdRegex.test(campaignId)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid campaignId format. Use only letters, numbers, hyphens, and underscores.' 
      }, { status: 400 })
    }

    // Validate file size (5MB max for campaigns as per CAMPAIGN_SYSTEM.md)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        success: false,
        error: 'File size exceeds 5MB limit for campaigns' 
      }, { status: 400 })
    }

    // Validate file type (only image formats allowed)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(fileType.toLowerCase())) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid file type. Only PNG, JPG, and WEBP images are allowed for campaigns.' 
      }, { status: 400 })
    }

    // Create campaign-specific path as documented: campaigns/{userId}/{campaignId}.png
    const filePath = `campaigns/${decodedToken.uid}/${campaignId}.png`

    // Generate signed upload URL (valid for 1 hour)
    const { data, error } = await supabaseAdmin.storage
      .from('uploads')
      .createSignedUploadUrl(filePath, {
        upsert: true  // Allow overwriting if user re-uploads campaign image
      })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ success: false, error: 'Failed to create upload URL' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      uploadUrl: data.signedUrl,
      path: filePath,
      token: data.token
    })

  } catch (error) {
    console.error('Campaign upload URL generation error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
