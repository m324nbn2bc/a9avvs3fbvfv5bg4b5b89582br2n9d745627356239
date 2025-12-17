import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { confirmation } = body;

    if (confirmation !== 'DELETE') {
      return NextResponse.json(
        { success: false, error: 'Please type DELETE to confirm' },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    if (userData.accountDeletionRequested) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Account deletion already requested',
          deletionDate: userData.accountDeletionScheduledFor?.toDate?.()?.toISOString() || null
        },
        { status: 400 }
      );
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await userRef.update({
      accountDeletionRequested: true,
      accountDeletionRequestedAt: FieldValue.serverTimestamp(),
      accountDeletionScheduledFor: deletionDate,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Account scheduled for deletion',
      deletionDate: deletionDate.toISOString(),
    });
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    if (!userData.accountDeletionRequested) {
      return NextResponse.json(
        { success: false, error: 'No deletion request to cancel' },
        { status: 400 }
      );
    }

    await userRef.update({
      accountDeletionRequested: false,
      accountDeletionRequestedAt: null,
      accountDeletionScheduledFor: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Deletion request cancelled',
    });
  } catch (error) {
    console.error('Error cancelling deletion:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel request' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    return NextResponse.json({
      success: true,
      deletionRequested: userData.accountDeletionRequested || false,
      deletionScheduledFor: userData.accountDeletionScheduledFor?.toDate?.()?.toISOString() || null,
    });
  } catch (error) {
    console.error('Error fetching deletion status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
