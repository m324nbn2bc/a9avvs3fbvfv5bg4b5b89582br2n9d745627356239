import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(request, { params }) {
  try {
    const adminUser = await requireAdmin(request);
    
    const { campaignId } = params;
    const body = await request.json();
    const { confirmed, deleteReason } = body;
    
    if (!confirmed) {
      return NextResponse.json(
        { success: false, error: 'Deletion must be confirmed' },
        { status: 400 }
      );
    }
    
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
    
    try {
      if (campaignData.imageUrl) {
        const imagePath = campaignData.imageUrl;
        
        const { error: storageError } = await supabaseAdmin.storage
          .from('uploads')
          .remove([imagePath]);
        
        if (storageError) {
          console.error('Supabase storage deletion error:', storageError);
        }
      }
    } catch (storageError) {
      console.error('Error deleting campaign image from storage:', storageError);
    }
    
    await campaignRef.delete();
    
    const deletionLog = {
      campaignId: campaignId,
      campaignTitle: campaignData.title,
      campaignSlug: campaignData.slug,
      creatorId: campaignData.creatorId,
      deletedBy: adminUser.uid,
      deletedAt: new Date().toISOString(),
      deleteReason: deleteReason || 'No reason provided',
      moderationStatus: campaignData.moderationStatus,
      reportsCount: campaignData.reportsCount || 0,
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Campaign deleted by admin:', deletionLog);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Campaign permanently deleted',
      data: deletionLog,
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    
    if (error.message.includes('Unauthorized') || error.message.includes('Admin access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
