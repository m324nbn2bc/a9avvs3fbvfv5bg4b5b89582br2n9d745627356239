import 'server-only';
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin';

export async function requireAdmin(request) {
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
    
    if (userData.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userData.role,
      ...userData
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin auth error:', error);
    }
    throw new Error(error.message || 'Unauthorized');
  }
}

export async function getAdminUser(userId) {
  try {
    const db = adminFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    
    if (userData.role !== 'admin') {
      return null;
    }
    
    return {
      uid: userId,
      ...userData
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting admin user:', error);
    }
    return null;
  }
}
