import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    await requireAdmin(request);
    
    const db = adminFirestore();
    
    // Use parallel queries with count aggregation for efficiency
    const [
      totalCampaignsSnap,
      activeCampaignsSnap,
      underReviewCampaignsSnap,
      removedTempCampaignsSnap,
      removedPermCampaignsSnap,
      frameCampaignsSnap,
      backgroundCampaignsSnap,
      totalUsersSnap,
      adminUsersSnap,
      bannedTempUsersSnap,
      bannedPermUsersSnap,
      totalReportsSnap,
      pendingReportsSnap,
      resolvedReportsSnap,
      dismissedReportsSnap,
    ] = await Promise.all([
      // Campaign counts by status
      db.collection('campaigns').count().get(),
      db.collection('campaigns').where('moderationStatus', '==', 'active').count().get(),
      db.collection('campaigns').where('moderationStatus', '==', 'under-review-hidden').count().get(),
      db.collection('campaigns').where('moderationStatus', '==', 'removed-temporary').count().get(),
      db.collection('campaigns').where('moderationStatus', '==', 'removed-permanent').count().get(),
      
      // Campaign counts by type
      db.collection('campaigns').where('type', '==', 'frame').count().get(),
      db.collection('campaigns').where('type', '==', 'background').count().get(),
      
      // User counts
      db.collection('users').count().get(),
      db.collection('users').where('role', '==', 'admin').count().get(),
      db.collection('users').where('accountStatus', '==', 'banned-temporary').count().get(),
      db.collection('users').where('accountStatus', '==', 'banned-permanent').count().get(),
      
      // Report counts by status (using reportSummary collection)
      db.collection('reportSummary').count().get(),
      db.collection('reportSummary').where('status', '==', 'pending').count().get(),
      db.collection('reportSummary').where('status', '==', 'resolved').count().get(),
      db.collection('reportSummary').where('status', '==', 'dismissed').count().get(),
    ]);
    
    // Extract counts from aggregation results
    const totalCampaigns = totalCampaignsSnap.data().count;
    const activeCampaigns = activeCampaignsSnap.data().count;
    const underReviewCampaigns = underReviewCampaignsSnap.data().count;
    const removedCampaigns = removedTempCampaignsSnap.data().count + removedPermCampaignsSnap.data().count;
    const frameCampaigns = frameCampaignsSnap.data().count;
    const backgroundCampaigns = backgroundCampaignsSnap.data().count;
    
    const totalUsers = totalUsersSnap.data().count;
    const adminUsers = adminUsersSnap.data().count;
    const bannedUsers = bannedTempUsersSnap.data().count + bannedPermUsersSnap.data().count;
    const regularUsers = totalUsers - adminUsers;
    
    const totalReports = totalReportsSnap.data().count;
    const pendingReports = pendingReportsSnap.data().count;
    const resolvedReports = resolvedReportsSnap.data().count;
    const dismissedReports = dismissedReportsSnap.data().count;
    
    // Calculate resolution rate
    const resolvedOrDismissed = resolvedReports + dismissedReports;
    const resolutionRate = totalReports > 0 ? Math.round((resolvedOrDismissed / totalReports) * 100) : 0;
    
    // For engagement metrics, we need to fetch active campaigns with supports
    // Using select() to only fetch the field we need
    const campaignsWithSupportsSnap = await db.collection('campaigns')
      .where('moderationStatus', '==', 'active')
      .select('supportersCount')
      .get();
    
    let totalSupports = 0;
    campaignsWithSupportsSnap.docs.forEach(doc => {
      totalSupports += doc.data().supportersCount || 0;
    });
    
    const avgSupportsPerCampaign = activeCampaigns > 0 ? Math.round(totalSupports / activeCampaigns) : 0;
    
    // Get top 5 reported campaigns using efficient query with orderBy and limit
    const topReportedCampaignsSnap = await db.collection('campaigns')
      .where('reportsCount', '>', 0)
      .orderBy('reportsCount', 'desc')
      .limit(5)
      .select('title', 'reportsCount', 'moderationStatus')
      .get();
    
    const topReportedCampaigns = topReportedCampaignsSnap.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      reportsCount: doc.data().reportsCount || 0,
      moderationStatus: doc.data().moderationStatus
    }));
    
    const stats = {
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        underReview: underReviewCampaigns,
        removed: removedCampaigns,
        frames: frameCampaigns,
        backgrounds: backgroundCampaigns,
      },
      users: {
        total: totalUsers,
        admins: adminUsers,
        regular: regularUsers,
        banned: bannedUsers,
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
        resolved: resolvedReports,
        dismissed: dismissedReports,
        resolutionRate: resolutionRate,
      },
      engagement: {
        totalSupports: totalSupports,
        avgSupportsPerCampaign: avgSupportsPerCampaign,
      },
      insights: {
        topReportedCampaigns: topReportedCampaigns,
      },
      timestamp: new Date().toISOString(),
    };
    
    // Cache headers for 2 minutes to reduce repeated queries
    return NextResponse.json(
      { success: true, data: stats },
      {
        headers: {
          'Cache-Control': 'private, max-age=120',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching analytics:', error);
    
    if (error.message.includes('Unauthorized') || error.message.includes('Admin access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
