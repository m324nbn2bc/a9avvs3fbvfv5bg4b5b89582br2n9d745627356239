import { NextResponse } from 'next/server'
import { verifyIdToken } from '../../../../lib/firebaseAdmin'
import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { headers } from 'next/headers'

// Force Node.js runtime for server-side operations
export const runtime = 'nodejs'

export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'uploads'
    const limit = Math.min(parseInt(searchParams.get('limit')) || 100, 1000) // Cap at 1000
    const offset = Math.max(parseInt(searchParams.get('offset')) || 0, 0) // Ensure non-negative
    
    // Validate folder
    const allowedFolders = ['uploads', 'profile-images', 'documents', 'temp', 'campaigns']
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json({ success: false, error: 'Invalid folder' }, { status: 400 })
    }

    // List files in user's folder only
    const userFolder = `${folder}/${decodedToken.uid}`
    
    const { data, error } = await supabaseAdmin.storage
      .from('uploads')
      .list(userFolder, {
        limit,
        offset,
        sortBy: { column: 'name', order: 'desc' }
      })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ success: false, error: 'Failed to list files' }, { status: 500 })
    }

    // Add full paths to the response
    const filesWithPaths = data.map(file => ({
      ...file,
      fullPath: `${userFolder}/${file.name}`
    }))

    return NextResponse.json({ 
      success: true,
      files: filesWithPaths
    })

  } catch (error) {
    console.error('File listing error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}