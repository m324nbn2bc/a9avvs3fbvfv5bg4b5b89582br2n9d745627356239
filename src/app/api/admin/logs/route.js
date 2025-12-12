import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'all';
    const targetType = searchParams.get('targetType') || 'all';
    const adminId = searchParams.get('adminId') || 'all';
    const limitParam = searchParams.get('limit') || '50';
    const limitValue = parseInt(limitParam, 10);
    
    const db = adminFirestore();
    let logsQuery = db.collection('adminLogs');
    
    // Filter by action (dismissed, warned, removed, or all)
    if (action !== 'all') {
      logsQuery = logsQuery.where('action', '==', action);
    }
    
    // Filter by target type (campaign, user, or all)
    if (targetType !== 'all') {
      logsQuery = logsQuery.where('targetType', '==', targetType);
    }
    
    // Filter by admin ID
    if (adminId !== 'all') {
      logsQuery = logsQuery.where('adminId', '==', adminId);
    }
    
    // Order by timestamp (newest first) and limit
    logsQuery = logsQuery.orderBy('timestamp', 'desc').limit(limitValue);
    
    const logsSnapshot = await logsQuery.get();
    
    const logs = logsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore timestamp to ISO string
      if (data.timestamp && data.timestamp.toDate) {
        data.timestamp = data.timestamp.toDate().toISOString();
      }
      
      return {
        id: doc.id,
        ...data
      };
    });
    
    // Get unique admins for filter dropdown
    const adminsSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .get();
    
    const admins = adminsSnapshot.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email,
      displayName: doc.data().displayName || doc.data().username || doc.data().email,
    }));
    
    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
      admins: admins,
    });
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    
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
      { success: false, error: 'Failed to fetch admin logs' },
      { status: 500 }
    );
  }
}
