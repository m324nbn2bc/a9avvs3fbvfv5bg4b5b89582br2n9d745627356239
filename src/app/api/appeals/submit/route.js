import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendInAppNotification } from '@/utils/notifications/sendInAppNotification';

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
    const { type, targetId, reason } = body;

    if (!type || !targetId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, targetId, reason' },
        { status: 400 }
      );
    }

    if (!['campaign', 'account'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid appeal type. Must be "campaign" or "account"' },
        { status: 400 }
      );
    }

    if (reason.trim().length < 20) {
      return NextResponse.json(
        { success: false, error: 'Appeal reason must be at least 20 characters' },
        { status: 400 }
      );
    }

    let targetDoc;
    let appealDeadline;

    if (type === 'campaign') {
      const campaignRef = adminDb.collection('campaigns').doc(targetId);
      targetDoc = await campaignRef.get();

      if (!targetDoc.exists) {
        return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
      }

      const campaignData = targetDoc.data();

      if (campaignData.creatorId !== userId) {
        return NextResponse.json(
          { success: false, error: 'You can only appeal your own campaigns' },
          { status: 403 }
        );
      }

      if (campaignData.moderationStatus !== 'removed-temporary') {
        return NextResponse.json(
          { success: false, error: 'This campaign is not eligible for appeal' },
          { status: 400 }
        );
      }

      appealDeadline = campaignData.appealDeadline;
    } else {
      const userRef = adminDb.collection('users').doc(userId);
      targetDoc = await userRef.get();

      if (!targetDoc.exists) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      const userData = targetDoc.data();

      if (userData.accountStatus !== 'banned-temporary') {
        return NextResponse.json(
          { success: false, error: 'Your account is not eligible for appeal' },
          { status: 400 }
        );
      }

      appealDeadline = userData.appealDeadline;
    }

    if (!appealDeadline) {
      return NextResponse.json(
        { success: false, error: 'No appeal deadline found for this item' },
        { status: 400 }
      );
    }

    const now = new Date();
    const deadline = appealDeadline.toDate ? appealDeadline.toDate() : new Date(appealDeadline);

    if (now > deadline) {
      return NextResponse.json(
        { success: false, error: 'Appeal deadline has passed' },
        { status: 400 }
      );
    }

    const existingAppealsQuery = await adminDb
      .collection('appeals')
      .where('userId', '==', userId)
      .where('targetId', '==', targetId)
      .where('type', '==', type)
      .where('status', '==', 'pending')
      .get();

    if (!existingAppealsQuery.empty) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted an appeal for this item' },
        { status: 400 }
      );
    }

    const appealData = {
      userId,
      type,
      targetId,
      reason: reason.trim(),
      status: 'pending',
      submittedAt: new Date(),
      createdAt: new Date(),
    };

    const appealRef = await adminDb.collection('appeals').add(appealData);

    if (type === 'campaign') {
      await adminDb
        .collection('campaigns')
        .doc(targetId)
        .update({
          appealCount: FieldValue.increment(1),
        });
    }

    await sendInAppNotification(userId, {
      type: 'appealSubmitted',
      title: '✅ Appeal Submitted',
      message: `Your appeal for ${type} removal has been submitted and is under review.`,
      actionUrl: '/profile/notifications',
      actionLabel: 'View Notifications',
    });

    return NextResponse.json({
      success: true,
      appealId: appealRef.id,
      message: 'Appeal submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting appeal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit appeal' },
      { status: 500 }
    );
  }
}
