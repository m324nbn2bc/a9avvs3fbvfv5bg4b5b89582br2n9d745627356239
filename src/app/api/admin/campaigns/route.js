import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const moderationStatus = searchParams.get('moderationStatus');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const limitParam = searchParams.get('limit') || '50';
    const limitValue = parseInt(limitParam, 10);
    
    const db = adminFirestore();
    let campaignsQuery = db.collection('campaigns');
    
    if (moderationStatus && moderationStatus !== 'all') {
      campaignsQuery = campaignsQuery.where('moderationStatus', '==', moderationStatus);
    }
    
    switch (sortBy) {
      case 'reports':
        campaignsQuery = campaignsQuery.orderBy('reportsCount', 'desc');
        break;
      case 'supporters':
        campaignsQuery = campaignsQuery.orderBy('supportersCount', 'desc');
        break;
      case 'createdAt':
      default:
        campaignsQuery = campaignsQuery.orderBy('createdAt', 'desc');
        break;
    }
    
    campaignsQuery = campaignsQuery.limit(limitValue);
    
    const campaignsSnapshot = await campaignsQuery.get();
    
    const campaigns = [];
    
    for (const doc of campaignsSnapshot.docs) {
      const campaignData = { id: doc.id, ...doc.data() };
      
      if (campaignData.creatorId) {
        const creatorDoc = await db.collection('users').doc(campaignData.creatorId).get();
        if (creatorDoc.exists) {
          const creatorData = creatorDoc.data();
          campaignData.creator = {
            uid: creatorDoc.id,
            displayName: creatorData.displayName,
            username: creatorData.username,
            profileImage: creatorData.profileImage,
          };
        } else {
          campaignData.creator = {
            uid: campaignData.creatorId,
            displayName: '[Deleted User]',
            username: null,
            profileImage: null,
          };
        }
      }
      
      if (campaignData.createdAt && campaignData.createdAt.toDate) {
        campaignData.createdAt = campaignData.createdAt.toDate().toISOString();
      }
      if (campaignData.updatedAt && campaignData.updatedAt.toDate) {
        campaignData.updatedAt = campaignData.updatedAt.toDate().toISOString();
      }
      if (campaignData.firstUsedAt && campaignData.firstUsedAt.toDate) {
        campaignData.firstUsedAt = campaignData.firstUsedAt.toDate().toISOString();
      }
      
      campaigns.push(campaignData);
    }
    
    return NextResponse.json({
      success: true,
      data: campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    
    if (error.message.includes('Unauthorized') || error.message.includes('Admin access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
