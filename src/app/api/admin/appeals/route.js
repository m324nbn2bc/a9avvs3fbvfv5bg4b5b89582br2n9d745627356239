import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const type = searchParams.get('type') || 'all';
    const limitParam = parseInt(searchParams.get('limit')) || 50;

    let appealsQuery = adminDb.collection('appeals');

    if (status !== 'all') {
      appealsQuery = appealsQuery.where('status', '==', status);
    }

    if (type !== 'all') {
      appealsQuery = appealsQuery.where('type', '==', type);
    }

    appealsQuery = appealsQuery.orderBy('submittedAt', 'desc').limit(limitParam);

    const appealsSnapshot = await appealsQuery.get();
    const appeals = [];

    for (const doc of appealsSnapshot.docs) {
      const appealData = { id: doc.id, ...doc.data() };

      const userRef = adminDb.collection('users').doc(appealData.userId);
      const userDoc = await userRef.get();

      if (userDoc.exists()) {
        const userData = userDoc.data();
        appealData.userInfo = {
          username: userData.username || 'Unknown',
          displayName: userData.displayName || userData.username || 'Unknown User',
          profileImage: userData.profileImage || null,
          email: userData.email || null,
        };
      }

      if (appealData.type === 'campaign') {
        const campaignRef = adminDb.collection('campaigns').doc(appealData.targetId);
        const campaignDoc = await campaignRef.get();

        if (campaignDoc.exists()) {
          const campaignData = campaignDoc.data();
          appealData.targetInfo = {
            title: campaignData.title,
            slug: campaignData.slug,
            imageUrl: campaignData.imageUrl,
            moderationStatus: campaignData.moderationStatus,
            removalReason: campaignData.removalReason,
          };
        } else {
          appealData.targetInfo = {
            title: '[Deleted Campaign]',
            deleted: true,
          };
        }
      } else {
        const targetUserRef = adminDb.collection('users').doc(appealData.targetId);
        const targetUserDoc = await targetUserRef.get();

        if (targetUserDoc.exists()) {
          const targetUserData = targetUserDoc.data();
          appealData.targetInfo = {
            username: targetUserData.username,
            displayName: targetUserData.displayName || targetUserData.username,
            profileImage: targetUserData.profileImage,
            accountStatus: targetUserData.accountStatus,
            banReason: targetUserData.banReason,
          };
        } else {
          appealData.targetInfo = {
            username: '[Deleted User]',
            deleted: true,
          };
        }
      }

      appeals.push(appealData);
    }

    return NextResponse.json({ success: true, appeals });
  } catch (error) {
    console.error('Error fetching appeals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appeals' },
      { status: 500 }
    );
  }
}
