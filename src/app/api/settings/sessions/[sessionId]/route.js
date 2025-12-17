import { NextResponse } from 'next/server';
import { verifyIdToken, adminDb, adminAuth } from '@/lib/firebaseAdmin';

export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const sessionRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('sessions')
      .doc(sessionId);

    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data();

    if (sessionData.isCurrent) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot revoke current session. Use logout instead.' 
      }, { status: 400 });
    }

    await sessionRef.delete();

    try {
      await adminAuth.revokeRefreshTokens(userId);
    } catch (revokeError) {
      console.error('Error revoking refresh tokens:', revokeError);
    }

    return NextResponse.json({ success: true, message: 'Session revoked', tokensRevoked: true });
  } catch (error) {
    console.error('Error revoking session:', error);
    return NextResponse.json({ success: false, error: 'Failed to revoke session' }, { status: 500 });
  }
}
