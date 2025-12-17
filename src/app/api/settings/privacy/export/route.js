import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const userData = {};

    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userProfile = userDoc.data();
    userData.profile = {
      id: userDoc.id,
      username: userProfile.username,
      displayName: userProfile.displayName,
      email: userProfile.email,
      bio: userProfile.bio,
      country: userProfile.country,
      profileImage: userProfile.profileImage,
      bannerImage: userProfile.bannerImage,
      createdAt: userProfile.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: userProfile.updatedAt?.toDate?.()?.toISOString() || null,
      privacySettings: userProfile.privacySettings || {},
      preferences: userProfile.preferences || {},
    };

    const campaignsSnapshot = await adminDb.collection('campaigns')
      .where('creatorId', '==', userId)
      .get();

    userData.campaigns = campaignsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        slug: data.slug,
        status: data.status,
        moderationStatus: data.moderationStatus,
        supportCount: data.supportCount,
        downloadCount: data.downloadCount,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });

    const notificationsSnapshot = await adminDb.collection('users')
      .doc(userId)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    userData.notifications = notificationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        title: data.title,
        message: data.message,
        read: data.read,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    userData.exportMetadata = {
      exportedAt: new Date().toISOString(),
      userId: userId,
      email: decodedToken.email,
      dataIncluded: ['profile', 'campaigns', 'notifications'],
      version: '1.0',
    };

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
