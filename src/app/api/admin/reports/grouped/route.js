import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType') || 'all';
    const status = searchParams.get('status') || 'pending';
    const sortBy = searchParams.get('sortBy') || 'lastReportedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limitParam = searchParams.get('limit') || '10';
    const limitValue = parseInt(limitParam, 10);
    
    const db = adminFirestore();
    let summariesQuery = db.collection('reportSummary');
    
    // Filter by target type (campaign, user, or all)
    if (targetType !== 'all') {
      summariesQuery = summariesQuery.where('targetType', '==', targetType);
    }
    
    // Filter by status (pending, resolved, dismissed)
    if (status !== 'all') {
      summariesQuery = summariesQuery.where('status', '==', status);
    }
    
    // Add sorting
    summariesQuery = summariesQuery.orderBy(sortBy, sortOrder).limit(limitValue);
    
    const summariesSnapshot = await summariesQuery.get();
    
    // Step 1: Convert to plain objects and collect all IDs
    const summariesData = summariesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Step 2: Collect unique IDs for batch fetching
    const campaignIds = new Set();
    const userIds = new Set();
    
    summariesData.forEach(summary => {
      if (summary.targetType === 'campaign' && summary.targetId) {
        campaignIds.add(summary.targetId);
        if (summary.creatorId) {
          userIds.add(summary.creatorId);
        }
      } else if (summary.targetType === 'user' && summary.targetId) {
        userIds.add(summary.targetId);
      }
    });
    
    // Step 3: Batch fetch all campaigns and users at once (reduces N+1 queries)
    const campaignRefs = Array.from(campaignIds).map(id => db.collection('campaigns').doc(id));
    const userRefs = Array.from(userIds).map(id => db.collection('users').doc(id));
    
    // Fetch all documents in parallel
    const [campaignDocs, userDocs] = await Promise.all([
      campaignRefs.length > 0 ? db.getAll(...campaignRefs) : Promise.resolve([]),
      userRefs.length > 0 ? db.getAll(...userRefs) : Promise.resolve([])
    ]);
    
    // Step 4: Build lookup maps for O(1) access
    const campaignsMap = new Map();
    campaignDocs.forEach(doc => {
      if (doc.exists) {
        campaignsMap.set(doc.id, doc.data());
      }
    });
    
    const usersMap = new Map();
    userDocs.forEach(doc => {
      if (doc.exists) {
        usersMap.set(doc.id, doc.data());
      }
    });
    
    // Step 5: Populate summaries with fetched data
    const summaries = summariesData.map(summaryData => {
      // Fetch LIVE status from actual target document (campaign or user)
      if (summaryData.targetId) {
        if (summaryData.targetType === 'campaign') {
          const targetData = campaignsMap.get(summaryData.targetId);
          
          if (targetData) {
            summaryData.moderationStatus = targetData.moderationStatus || 'active';
            summaryData.campaignTitle = targetData.title || summaryData.campaignTitle;
            summaryData.campaignImage = targetData.imageUrl || summaryData.campaignImage;
          } else {
            summaryData.targetDeleted = true;
            summaryData.moderationStatus = 'deleted';
          }
        } else {
          const targetData = usersMap.get(summaryData.targetId);
          
          if (targetData) {
            summaryData.accountStatus = targetData.accountStatus || 'active';
            summaryData.displayName = targetData.displayName || summaryData.displayName;
            summaryData.username = targetData.username || summaryData.username;
            summaryData.profileImage = targetData.profileImage || summaryData.profileImage;
          } else {
            summaryData.targetDeleted = true;
            summaryData.accountStatus = 'deleted';
          }
        }
      }
      
      // Add creator info for campaign reports
      if (summaryData.targetType === 'campaign' && summaryData.creatorId) {
        const creatorData = usersMap.get(summaryData.creatorId);
        
        if (creatorData) {
          summaryData.creator = {
            uid: summaryData.creatorId,
            displayName: creatorData.displayName,
            username: creatorData.username,
            profileImage: creatorData.profileImage,
          };
        } else {
          summaryData.creator = {
            uid: summaryData.creatorId,
            displayName: '[Deleted User]',
            username: null,
            profileImage: null,
          };
        }
      }
      
      // Convert Firestore timestamps to ISO strings
      if (summaryData.firstReportedAt && summaryData.firstReportedAt.toDate) {
        summaryData.firstReportedAt = summaryData.firstReportedAt.toDate().toISOString();
      }
      if (summaryData.lastReportedAt && summaryData.lastReportedAt.toDate) {
        summaryData.lastReportedAt = summaryData.lastReportedAt.toDate().toISOString();
      }
      if (summaryData.createdAt && summaryData.createdAt.toDate) {
        summaryData.createdAt = summaryData.createdAt.toDate().toISOString();
      }
      if (summaryData.updatedAt && summaryData.updatedAt.toDate) {
        summaryData.updatedAt = summaryData.updatedAt.toDate().toISOString();
      }
      if (summaryData.resolvedAt && summaryData.resolvedAt.toDate) {
        summaryData.resolvedAt = summaryData.resolvedAt.toDate().toISOString();
      }
      
      return summaryData;
    });
    
    return NextResponse.json({
      success: true,
      data: summaries,
      count: summaries.length,
    });
  } catch (error) {
    console.error('Error fetching grouped reports:', error);
    
    if (error.message.includes('Unauthorized') || error.message.includes('Admin access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    
    // Handle Firestore index errors (FAILED_PRECONDITION)
    if (error.code === 9 || error.message.includes('index') || error.message.includes('FAILED_PRECONDITION')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Firestore indexes are still building. Please wait a few minutes and try again. If the issue persists, check Firebase Console for index status.',
          indexError: true
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grouped reports' },
      { status: 500 }
    );
  }
}
