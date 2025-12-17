import { NextResponse } from 'next/server';
import { requireUser } from '@/middleware/userAuth';
import { adminDb } from '@/lib/firebaseAdmin';

export async function DELETE(request, { params }) {
  try {
    const user = await requireUser(request);
    const userId = user.uid;

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

    return NextResponse.json({ success: true, message: 'Session removed' });
  } catch (error) {
    console.error('Error revoking session:', error);
    if (error.message === 'Unauthorized' || error.message?.includes('token') || error.message === 'Account is banned') {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to revoke session' }, { status: 500 });
  }
}
