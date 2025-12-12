import { adminFirestore } from '@/lib/firebaseAdmin';

export async function logAdminAction({
  adminId,
  adminEmail,
  adminName,
  action,
  targetType,
  targetId,
  targetTitle,
  reason,
  summaryId,
  additionalData = {}
}) {
  try {
    const db = adminFirestore();
    const logRef = db.collection('adminLogs').doc();
    
    const logData = {
      adminId,
      adminEmail,
      adminName: adminName || adminEmail || 'Unknown Admin',
      action,
      targetType,
      targetId,
      targetTitle: targetTitle || 'Unknown',
      reason: reason || null,
      summaryId: summaryId || null,
      timestamp: new Date(),
      ...additionalData
    };
    
    await logRef.set(logData);
    
    return { success: true, logId: logRef.id };
  } catch (error) {
    console.error('Failed to log admin action:', error);
    return { success: false, error: error.message };
  }
}
