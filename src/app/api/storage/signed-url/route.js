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

    const { path, expiresIn = 3600 } = await request.json()
    
    if (!path) {
      return NextResponse.json({ success: false, error: 'path is required' }, { status: 400 })
    }

    // Verify user owns this file - handle different folder structures
    const allowedPrefixes = [
      `uploads/${decodedToken.uid}/`,
      `profile-images/${decodedToken.uid}/`,
      `documents/${decodedToken.uid}/`,
      `temp/${decodedToken.uid}/`,
      `campaigns/${decodedToken.uid}/`
    ]
    
    const hasValidPrefix = allowedPrefixes.some(prefix => path.startsWith(prefix))
    if (!hasValidPrefix) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Generate signed download URL
    const { data, error } = await supabaseAdmin.storage
      .from('uploads')
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ success: false, error: 'Failed to create signed URL' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl
    })

  } catch (error) {
    console.error('Signed URL generation error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}