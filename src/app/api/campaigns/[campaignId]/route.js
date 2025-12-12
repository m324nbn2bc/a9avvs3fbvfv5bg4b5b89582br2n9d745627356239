import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebaseAdmin';
import { adminFirestore } from '@/lib/firebaseAdmin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function DELETE(request, { params }) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authorization.replace('Bearer ', '');
    
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const { campaignId } = params;

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const db = adminFirestore();
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const campaignData = campaignDoc.data();

    if (campaignData.creatorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to delete this campaign' },
        { status: 403 }
      );
    }

    try {
      if (campaignData.storagePath || campaignData.imageUrl) {
        let imagePath = campaignData.storagePath;
        
        if (!imagePath && campaignData.imageUrl) {
          if (campaignData.imageUrl.includes('/storage/v1/object/public/uploads/')) {
            imagePath = campaignData.imageUrl.split('/storage/v1/object/public/uploads/')[1];
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Could not parse storage path from imageUrl:', campaignData.imageUrl);
            }
          }
        }
        
        if (imagePath) {
          const { error: storageError } = await supabaseAdmin.storage
            .from('uploads')
            .remove([imagePath]);
          
          if (storageError) {
            console.error('Supabase storage deletion error for path:', imagePath, storageError);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('Successfully deleted storage file:', imagePath);
            }
          }
        }
      }
    } catch (storageError) {
      console.error('Error deleting campaign image from storage:', storageError);
    }

    const summaryId = `campaign-${campaignId}`;
    const summaryRef = db.collection('reportSummary').doc(summaryId);

    let reportsDismissed = 0;

    await db.runTransaction(async (transaction) => {
      const summaryDoc = await transaction.get(summaryRef);
      
      transaction.delete(campaignRef);

      if (summaryDoc.exists) {
        const summaryData = summaryDoc.data();
        reportsDismissed = summaryData.reportsCount || 0;
        
        transaction.update(summaryRef, {
          status: 'dismissed',
          reportsCount: 0,
          reasonCounts: {},
          moderationStatus: 'deleted',
          updatedAt: new Date(),
          deletionNote: 'Campaign deleted by creator',
        });
      }

      const userRef = db.collection('users').doc(userId);
      transaction.update(userRef, {
        campaignsCount: FieldValue.increment(-1),
        updatedAt: new Date(),
      });
    });

    if (reportsDismissed > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Auto-dismissed ${reportsDismissed} reports for deleted campaign ${campaignId}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully',
      data: {
        campaignId,
        title: campaignData.title,
        reportsDismissed,
      },
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
