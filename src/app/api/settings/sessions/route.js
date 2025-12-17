import { NextResponse } from 'next/server';
import { verifyIdToken, adminDb, adminAuth } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const sessionsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('sessions')
      .orderBy('lastActiveAt', 'desc')
      .get();

    const sessions = sessionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        deviceType: data.deviceType || 'Unknown',
        browser: data.browser || 'Unknown',
        os: data.os || 'Unknown',
        location: data.location || 'Unknown',
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : null,
        lastActiveAt: data.lastActiveAt?.toDate?.() ? data.lastActiveAt.toDate().toISOString() : null,
        isCurrent: data.isCurrent || false,
      };
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { sessionId, deviceType, browser, os, userAgent } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const existingSessionsSnapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('sessions')
      .get();

    const batch = adminDb.batch();
    existingSessionsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isCurrent: false });
    });

    const sessionRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('sessions')
      .doc(sessionId);

    const existingSession = await sessionRef.get();
    const now = new Date();

    if (existingSession.exists) {
      batch.update(sessionRef, {
        lastActiveAt: now,
        isCurrent: true,
      });
    } else {
      batch.set(sessionRef, {
        deviceType: deviceType || 'Unknown',
        browser: browser || 'Unknown',
        os: os || 'Unknown',
        userAgent: userAgent || '',
        location: 'Unknown',
        createdAt: now,
        lastActiveAt: now,
        isCurrent: true,
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error('Error creating/updating session:', error);
    return NextResponse.json({ success: false, error: 'Failed to create session' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const revokeAll = searchParams.get('all') === 'true';
    const currentSessionId = searchParams.get('currentSessionId');

    const sessionsRef = adminDb.collection('users').doc(userId).collection('sessions');

    if (revokeAll) {
      const sessionsSnapshot = await sessionsRef.get();
      const batch = adminDb.batch();
      
      sessionsSnapshot.docs.forEach(doc => {
        if (doc.id !== currentSessionId) {
          batch.delete(doc.ref);
        }
      });

      await batch.commit();

      try {
        await adminAuth.revokeRefreshTokens(userId);
      } catch (revokeError) {
        console.error('Error revoking refresh tokens:', revokeError);
      }

      return NextResponse.json({ success: true, message: 'All other sessions revoked', tokensRevoked: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error revoking sessions:', error);
    return NextResponse.json({ success: false, error: 'Failed to revoke sessions' }, { status: 500 });
  }
}
