import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';

export async function GET(request) {
  try {
    await requireAdmin(request);
    
    const db = adminFirestore();
    const campaignsRef = db.collection('campaigns');
    const snapshot = await campaignsRef.get();
    
    const stats = {
      total: snapshot.size,
      withStoragePath: 0,
      needsMigration: 0,
      noImageUrl: 0
    };
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      if (data.storagePath) {
        stats.withStoragePath++;
      } else if (data.imageUrl) {
        stats.needsMigration++;
      } else {
        stats.noImageUrl++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Migration preview',
      stats,
      note: 'Use POST to run the migration'
    });
  } catch (error) {
    console.error('Migration preview error:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get migration preview' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await requireAdmin(request);
    
    const db = adminFirestore();
    const campaignsRef = db.collection('campaigns');
    const snapshot = await campaignsRef.get();
    
    const results = {
      total: snapshot.size,
      migrated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };
    
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      if (data.storagePath) {
        results.skipped++;
        continue;
      }
      
      if (!data.imageUrl) {
        results.skipped++;
        continue;
      }
      
      try {
        let storagePath = null;
        
        if (data.imageUrl.includes('/storage/v1/object/public/uploads/')) {
          storagePath = data.imageUrl.split('/storage/v1/object/public/uploads/')[1];
        }
        
        if (storagePath) {
          batch.update(doc.ref, { storagePath });
          batchCount++;
          results.migrated++;
          
          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            batchCount = 0;
          }
        } else {
          results.failed++;
          results.errors.push({
            campaignId: doc.id,
            imageUrl: data.imageUrl,
            reason: 'Could not parse storage path from imageUrl'
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          campaignId: doc.id,
          error: error.message
        });
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results
    });
  } catch (error) {
    console.error('Migration error:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
