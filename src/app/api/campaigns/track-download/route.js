import { NextResponse } from 'next/server';
import { adminFirestore } from '../../../../lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { campaignId } = body;
    
    // Validate required field
    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }
    
    // Get Firestore instance
    const db = adminFirestore();
    
    // Run transaction to update campaign supports count
    const result = await db.runTransaction(async (transaction) => {
      // Get campaign document
      const campaignRef = db.collection('campaigns').doc(campaignId);
      const campaignDoc = await transaction.get(campaignRef);
      
      if (!campaignDoc.exists) {
        throw new Error('Campaign not found');
      }
      
      const campaignData = campaignDoc.data();
      
      // Create a download record in subcollection with timestamp
      const downloadRef = db.collection('campaigns').doc(campaignId).collection('downloads').doc();
      transaction.set(downloadRef, {
        downloadedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp()
      });
      
      // Update campaign supportersCount (tracks total downloads/supports)
      transaction.update(campaignRef, {
        supportersCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
        // Set firstUsedAt on first download
        ...(campaignData.supportersCount === 0 ? { firstUsedAt: FieldValue.serverTimestamp() } : {})
      });
      
      return {
        success: true
      };
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error tracking download:', error);
    
    // Return appropriate error message
    if (error.message === 'Campaign not found') {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to track download' },
      { status: 500 }
    );
  }
}
