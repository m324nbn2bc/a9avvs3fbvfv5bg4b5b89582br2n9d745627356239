import { NextResponse } from 'next/server'
import { verifyIdToken } from '../../../../lib/firebaseAdmin'
import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { headers } from 'next/headers'

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

    const { fileName, fileType, fileSize, folder = 'uploads' } = await request.json()
    
    // Validate folder (whitelist allowed folders)
    const allowedFolders = ['uploads', 'profile-images', 'documents', 'temp', 'campaigns']
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json({ success: false, error: 'Invalid folder' }, { status: 400 })
    }
    
    // Validate required fields
    if (!fileName) {
      return NextResponse.json({ success: false, error: 'fileName is required' }, { status: 400 })
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

    // Validate file size (5MB max for campaigns and profile-images, 10MB max for others)
    const maxFileSize = (folder === 'campaigns' || folder === 'profile-images') ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (fileSize > maxFileSize) {
      const maxSizeMB = (folder === 'campaigns' || folder === 'profile-images') ? 5 : 10
      return NextResponse.json({ 
        success: false,
        error: `File size exceeds ${maxSizeMB}MB limit` 
      }, { status: 400 })
    }

    // Validate file type for campaigns
    if (folder === 'campaigns') {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
      if (!allowedTypes.includes(fileType.toLowerCase())) {
        return NextResponse.json({ 
          success: false,
          error: 'Invalid file type for campaigns. Only PNG, JPG, and WEBP are allowed.' 
        }, { status: 400 })
      }
    }

    // Create user-specific path
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${folder}/${decodedToken.uid}/${timestamp}-${sanitizedFileName}`

    // Generate signed upload URL (valid for 1 hour)
    const { data, error } = await supabaseAdmin.storage
      .from('uploads')
      .createSignedUploadUrl(filePath)

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
    console.error('Upload URL generation error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}