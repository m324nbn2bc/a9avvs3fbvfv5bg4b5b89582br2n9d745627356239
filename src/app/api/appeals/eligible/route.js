import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const items = [];

    const campaignsSnapshot = await adminDb
      .collection('campaigns')
      .where('creatorId', '==', userId)
      .where('moderationStatus', '==', 'removed-temporary')
      .get();

    campaignsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.appealDeadline) {
        items.push({
          type: 'campaign',
          id: doc.id,
          title: data.title,
          imageUrl: data.imageUrl,
          removalReason: data.removalReason,
          appealDeadline: data.appealDeadline,
          appealCount: data.appealCount || 0,
        });
      }
    });

    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (
        userData.accountStatus === 'banned-temporary' &&
        userData.appealDeadline
      ) {
        items.push({
          type: 'account',
          id: userId,
          title: 'Your Account',
          banReason: userData.banReason,
          appealDeadline: userData.appealDeadline,
        });
      }
    }

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching eligible items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch eligible items' },
      { status: 500 }
    );
  }
}
