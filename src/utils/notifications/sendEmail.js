import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import { validateMailersendKey } from "../validateEnv";

// Validate at build time ONLY for production builds
// This catches invalid keys before deployment while allowing development builds to proceed
if (process.env.NODE_ENV === 'production') {
  validateMailersendKey(process.env.MAILERSEND_API_KEY);
}

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || "",
});

/**
 * Send an email using MailerSend API
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject line
 * @param {string} params.html - HTML email content
 * @param {string} [params.from] - Sender email address (defaults to MailerSend trial domain)
 * @returns {Promise<Object>} - Result object with success status
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = "noreply@test-nrw7gymxx6jg2k8e.mlsender.net", // MailerSend trial domain
}) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log("[EMAIL] Sending to:", to);
      console.log("[EMAIL] Subject:", subject);
    }

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, and html");
    }

    if (!process.env.MAILERSEND_API_KEY) {
      throw new Error("MAILERSEND_API_KEY environment variable is not set");
    }

    const sentFrom = new Sender(from, "Twibbonize");
    const recipients = [new Recipient(to, to)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html);

    const result = await mailerSend.email.send(emailParams);

    if (process.env.NODE_ENV === 'development') {
      console.log("[EMAIL] Sent successfully:", result.body?.messageId || "sent");
    }

    return {
      success: true,
      emailId: result.body?.messageId || "sent",
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error("[EMAIL] Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
