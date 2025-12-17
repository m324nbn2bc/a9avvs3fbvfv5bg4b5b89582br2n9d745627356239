import { NextResponse } from 'next/server';
import { requireUser } from '@/middleware/userAuth';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const userId = user.uid;

    const firebaseUser = await adminAuth.getUser(userId);
    
    const hasGoogleProvider = firebaseUser.providerData?.some(p => p.providerId === 'google.com');
    const hasPasswordProvider = firebaseUser.providerData?.some(p => p.providerId === 'password');
    
    if (hasGoogleProvider && !hasPasswordProvider) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email change not allowed for Google-only accounts' 
      }, { status: 403 });
    }

    const currentAuthEmail = firebaseUser.email;

    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (userData?.email !== currentAuthEmail) {
      await userRef.update({
        email: currentAuthEmail,
        emailUpdatedAt: FieldValue.serverTimestamp()
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Email synced from Firebase Auth',
        email: currentAuthEmail,
        updated: true
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email already in sync',
      email: currentAuthEmail,
      updated: false
    });
  } catch (error) {
    console.error('Error syncing email:', error);
    if (error.message === 'Unauthorized' || error.message?.includes('token') || error.message === 'Account is banned') {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to sync email' }, { status: 500 });
  }
}
