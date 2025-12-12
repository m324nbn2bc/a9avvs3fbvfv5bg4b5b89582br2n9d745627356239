import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import { adminFirestore } from '@/lib/firebaseAdmin';

export async function PATCH(request, { params }) {
  try {
    const adminUser = await requireAdmin(request);
    
    const { userId } = params;
    const body = await request.json();
    const { role } = body;
    
    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role must be either "admin" or "user"' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const db = adminFirestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    await userRef.update({
      role: role,
      updatedAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      data: {
        userId,
        role,
        updatedBy: adminUser.uid,
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    
    if (error.message.includes('Unauthorized') || error.message.includes('Admin access required')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}
