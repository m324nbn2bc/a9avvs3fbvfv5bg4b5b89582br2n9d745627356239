import 'server-only';
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin';

export async function requireUser(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No authorization token provided');
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      throw new Error('Invalid authorization token format');
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    if (!decodedToken || !decodedToken.uid) {
      throw new Error('Invalid token');
    }
    
    const db = adminFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    if (userData.accountStatus?.includes('banned')) {
      throw new Error('Account is banned');
    }
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...userData
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('User auth error:', error);
    }
    throw new Error(error.message || 'Unauthorized');
  }
}

export async function getUser(userId) {
  try {
    const db = adminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    
    return {
      uid: userId,
      ...userData
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting user:', error);
    }
    return null;
  }
}
