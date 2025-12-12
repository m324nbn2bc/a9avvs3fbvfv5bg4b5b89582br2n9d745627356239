import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const limitParam = searchParams.get('limit') || '100';
    const limitValue = parseInt(limitParam, 10);
    
    const db = adminFirestore();
    const users = [];
    
    if (search) {
      let query = db.collection('users');
      if (role && role !== 'all') {
        query = query.where('role', '==', role);
      }
      query = query.orderBy('createdAt', 'desc');
      
      let hasMore = true;
      let lastDoc = null;
      const batchSize = 100;
      const searchLower = search.toLowerCase();
      
      while (hasMore && users.length < limitValue) {
        let batchQuery = lastDoc ? query.startAfter(lastDoc).limit(batchSize) : query.limit(batchSize);
        const snapshot = await batchQuery.get();
        
        if (snapshot.empty) {
          break;
        }
        
        for (const doc of snapshot.docs) {
          if (users.length >= limitValue) {
            hasMore = false;
            break;
          }
          
          const userData = { id: doc.id, ...doc.data() };
          
          const matchesSearch = 
            (userData.displayName && userData.displayName.toLowerCase().includes(searchLower)) ||
            (userData.email && userData.email.toLowerCase().includes(searchLower)) ||
            (userData.username && userData.username.toLowerCase().includes(searchLower));
          
          if (matchesSearch) {
            if (userData.createdAt && userData.createdAt.toDate) {
              userData.createdAt = userData.createdAt.toDate().toISOString();
            }
            if (userData.updatedAt && userData.updatedAt.toDate) {
              userData.updatedAt = userData.updatedAt.toDate().toISOString();
            }
            if (userData.bannedAt && userData.bannedAt.toDate) {
              userData.bannedAt = userData.bannedAt.toDate().toISOString();
            }
            
            users.push(userData);
          }
        }
        
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        
        if (snapshot.docs.length < batchSize) {
          hasMore = false;
        }
      }
      
      const userIds = users.map(u => u.id);
      
      if (userIds.length > 0) {
        const campaignsByCreator = {};
        
        const chunkSize = 10;
        for (let i = 0; i < userIds.length; i += chunkSize) {
          const chunk = userIds.slice(i, i + chunkSize);
          const campaignsSnapshot = await db.collection('campaigns')
            .where('creatorId', 'in', chunk)
            .where('moderationStatus', '==', 'active')
            .get();
          
          campaignsSnapshot.docs.forEach(campaignDoc => {
            const campaignData = campaignDoc.data();
            const creatorId = campaignData.creatorId;
            
            if (!campaignsByCreator[creatorId]) {
              campaignsByCreator[creatorId] = {
                count: 0,
                totalSupports: 0
              };
            }
            
            campaignsByCreator[creatorId].count++;
            campaignsByCreator[creatorId].totalSupports += campaignData.supportersCount || 0;
          });
        }
        
        users.forEach(user => {
          const stats = campaignsByCreator[user.id] || { count: 0, totalSupports: 0 };
          user.campaignsCount = stats.count;
          user.totalSupports = stats.totalSupports;
        });
      } else {
        users.forEach(user => {
          user.campaignsCount = 0;
          user.totalSupports = 0;
        });
      }
    } else {
      let query = db.collection('users');
      if (role && role !== 'all') {
        query = query.where('role', '==', role);
      }
      query = query.orderBy('createdAt', 'desc').limit(limitValue);
      
      const snapshot = await query.get();
      
      snapshot.docs.forEach(doc => {
        const userData = { id: doc.id, ...doc.data() };
        
        if (userData.createdAt && userData.createdAt.toDate) {
          userData.createdAt = userData.createdAt.toDate().toISOString();
        }
        if (userData.updatedAt && userData.updatedAt.toDate) {
          userData.updatedAt = userData.updatedAt.toDate().toISOString();
        }
        if (userData.bannedAt && userData.bannedAt.toDate) {
          userData.bannedAt = userData.bannedAt.toDate().toISOString();
        }
        
        users.push(userData);
      });
      
      const userIds = users.map(u => u.id);
      
      if (userIds.length > 0) {
        const campaignsByCreator = {};
        
        const chunkSize = 10;
        for (let i = 0; i < userIds.length; i += chunkSize) {
          const chunk = userIds.slice(i, i + chunkSize);
          const campaignsSnapshot = await db.collection('campaigns')
            .where('creatorId', 'in', chunk)
            .where('moderationStatus', '==', 'active')
            .get();
          
          campaignsSnapshot.docs.forEach(campaignDoc => {
            const campaignData = campaignDoc.data();
            const creatorId = campaignData.creatorId;
            
            if (!campaignsByCreator[creatorId]) {
              campaignsByCreator[creatorId] = {
                count: 0,
                totalSupports: 0
              };
            }
            
            campaignsByCreator[creatorId].count++;
            campaignsByCreator[creatorId].totalSupports += campaignData.supportersCount || 0;
          });
        }
        
        users.forEach(user => {
          const stats = campaignsByCreator[user.id] || { count: 0, totalSupports: 0 };
          user.campaignsCount = stats.count;
          user.totalSupports = stats.totalSupports;
        });
      } else {
        users.forEach(user => {
          user.campaignsCount = 0;
          user.totalSupports = 0;
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    
    if (error.message.includes('Unauthorized') || error.message.includes('Admin access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
