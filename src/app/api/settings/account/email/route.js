import { NextResponse } from 'next/server';
import { verifyIdToken, adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

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
    return NextResponse.json({ success: false, error: 'Failed to sync email' }, { status: 500 });
  }
}
