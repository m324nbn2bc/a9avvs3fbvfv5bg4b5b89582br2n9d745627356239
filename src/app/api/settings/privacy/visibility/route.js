import { NextResponse } from 'next/server';
import { requireUser } from '@/middleware/userAuth';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(request) {
  try {
    const user = await requireUser(request);
    const userId = user.uid;

    const body = await request.json();

    const allowedSettings = [
      'profileVisibility',
      'showInCreatorLeaderboard',
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
    if (error.message === 'Unauthorized' || error.message?.includes('token')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const privacySettings = user.privacySettings || {};

    return NextResponse.json({
      success: true,
      settings: {
        profileVisibility: privacySettings.profileVisibility || 'public',
        showInCreatorLeaderboard: privacySettings.showInCreatorLeaderboard !== false,
        showSupportCount: privacySettings.showSupportCount !== false,
      }
    });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    if (error.message === 'Unauthorized' || error.message?.includes('token')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
