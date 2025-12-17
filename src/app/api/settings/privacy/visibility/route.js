import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();

    const allowedSettings = [
      'profileVisibility',
      'showInCreatorLeaderboard',
      'allowSearchEngineIndexing',
      'showSupportCount'
    ];

    const updates = {};
    for (const key of allowedSettings) {
      if (body.hasOwnProperty(key)) {
        if (typeof body[key] !== 'boolean' && key !== 'profileVisibility') {
          return NextResponse.json(
            { success: false, error: `Invalid value for ${key}. Expected boolean.` },
            { status: 400 }
          );
        }
        if (key === 'profileVisibility') {
          if (!['public', 'private'].includes(body[key]) && typeof body[key] !== 'boolean') {
            return NextResponse.json(
              { success: false, error: 'profileVisibility must be "public", "private", or boolean' },
              { status: 400 }
            );
          }
          const value = typeof body[key] === 'boolean' 
            ? (body[key] ? 'public' : 'private')
            : body[key];
          updates[`privacySettings.${key}`] = value;
        } else {
          updates[`privacySettings.${key}`] = body[key];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid settings to update' },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
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
    const privacySettings = userData.privacySettings || {};

    return NextResponse.json({
      success: true,
      settings: {
        profileVisibility: privacySettings.profileVisibility || 'public',
        showInCreatorLeaderboard: privacySettings.showInCreatorLeaderboard !== false,
        allowSearchEngineIndexing: privacySettings.allowSearchEngineIndexing !== false,
        showSupportCount: privacySettings.showSupportCount !== false,
      }
    });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
