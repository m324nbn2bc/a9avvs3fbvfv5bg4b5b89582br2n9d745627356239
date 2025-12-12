import "server-only";
import { adminFirestore } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Send in-app notification (Firestore only)
 * Saves notification to user's notifications subcollection
 */
export async function sendInAppNotification({
  userId,
  title,
  body,
  actionUrl,
  icon,
  type,
  metadata = {},
}) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log("[IN-APP NOTIFICATION] Sending to userId:", userId);
      console.log("[IN-APP NOTIFICATION] Details:", {
        title,
        body,
        actionUrl,
        type,
      });
    }

    if (!userId || !title || !body) {
      throw new Error("Missing required fields: userId, title, and body");
    }

    const db = adminFirestore();

    const notificationRef = db
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .doc();

    const notificationData = {
      title,
      body,
      actionUrl: actionUrl || "/profile",
      icon: icon || "/icon-192x192.png",
      type: type || "general",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      metadata: metadata || {},
    };

    await notificationRef.set(notificationData);

    if (process.env.NODE_ENV === 'development') {
      console.log(
        "[IN-APP NOTIFICATION] Notification saved successfully:",
        notificationRef.id,
      );
    }

    return {
      success: true,
      notificationId: notificationRef.id,
      message: "In-app notification sent successfully",
    };
  } catch (error) {
    console.error("[IN-APP NOTIFICATION] Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
