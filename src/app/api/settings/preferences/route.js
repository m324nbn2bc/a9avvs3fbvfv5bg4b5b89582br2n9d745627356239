import { NextResponse } from 'next/server';
import { requireUser } from '@/middleware/userAuth';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const validThemes = ['light', 'dark', 'system'];
const validLanguages = ['en'];

export async function PATCH(request) {
  try {
    const user = await requireUser(request);
    const userId = user.uid;

    const body = await request.json();
    const updates = {};

    if (body.hasOwnProperty('theme')) {
      if (!validThemes.includes(body.theme)) {
        return NextResponse.json(
          { success: false, error: `Invalid theme. Must be one of: ${validThemes.join(', ')}` },
          { status: 400 }
        );
      }
      updates['preferences.theme'] = body.theme;
    }

    if (body.hasOwnProperty('language')) {
      if (!validLanguages.includes(body.language)) {
        return NextResponse.json(
          { success: false, error: `Invalid language. Must be one of: ${validLanguages.join(', ')}` },
          { status: 400 }
        );
      }
      updates['preferences.language'] = body.language;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid preferences to update' },
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
    console.error('Error updating preferences:', error);
    if (error.message === 'Unauthorized' || error.message?.includes('token')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const preferences = user.preferences || {};

    return NextResponse.json({
      success: true,
      preferences: {
        theme: preferences.theme || 'system',
        language: preferences.language || 'en',
      }
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    if (error.message === 'Unauthorized' || error.message?.includes('token')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}
