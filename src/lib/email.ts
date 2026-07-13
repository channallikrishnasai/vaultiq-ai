import { Resend } from "resend";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const TAG = "Email";

export interface EmailResult {
  sent: boolean;
  devMode: boolean;
}

function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    logger.warn(TAG, "RESEND_API_KEY is not set. Emails will not be sent.");
    return null;
  }
  return new Resend(env.RESEND_API_KEY);
}

export function isEmailConfigured(): boolean {
  return !!env.RESEND_API_KEY;
}

function logDevVerificationUrl(email: string, token: string) {
  const verifyUrl = `${env.APP_URL}/verify-email?token=${token}`;
  logger.info(TAG, `Dev mode — verification URL for ${email}: ${verifyUrl}`);
}

export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<EmailResult> {
  const resend = getResendClient();

  if (!resend) {
    if (env.NODE_ENV !== "production") {
      logDevVerificationUrl(email, token);
      return { sent: false, devMode: true };
    }
    return { sent: false, devMode: false };
  }

  const from = env.EMAIL_FROM ?? "VaultIQ <onboarding@resend.dev>";
  const verifyUrl = `${env.APP_URL}/verify-email?token=${token}`;

  try {
    const response = await resend.emails.send({
      from,
      to: email,
      subject: "Verify your VaultIQ email address",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; background: #0a0a0a; color: #e4e4e7; padding: 40px;">
          <div style="max-width: 480px; margin: 0 auto;">
            <h1 style="font-size: 24px; color: #ffffff;">Verify your email</h1>
            <p style="margin-top: 16px; line-height: 1.6;">
              Thanks for signing up for VaultIQ. Please verify your email address by clicking the button below.
            </p>
            <a href="${verifyUrl}" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #eab308; color: #18181b; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Verify Email Address
            </a>
            <p style="margin-top: 24px; font-size: 14px; color: #71717a;">
              If you did not create an account, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });
    if (response.error) {
      logger.error(TAG, "Resend API error", response.error);
      if (env.NODE_ENV !== "production") {
        logDevVerificationUrl(email, token);
        return { sent: false, devMode: true };
      }
      return { sent: false, devMode: false };
    }
    logger.info(TAG, `Verification email sent to ${email}`);
    return { sent: true, devMode: false };
  } catch (error) {
    logger.error(TAG, "Failed to send verification email", error);
    if (env.NODE_ENV !== "production") {
      logDevVerificationUrl(email, token);
      return { sent: false, devMode: true };
    }
    return { sent: false, devMode: false };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<EmailResult> {
  const resend = getResendClient();

  if (!resend) {
    if (env.NODE_ENV !== "production") {
      const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
      logger.info(TAG, `Dev mode — password reset URL for ${email}: ${resetUrl}`);
      return { sent: false, devMode: true };
    }
    return { sent: false, devMode: false };
  }

  const from = env.EMAIL_FROM ?? "VaultIQ <onboarding@resend.dev>";
  const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;

  try {
    const response = await resend.emails.send({
      from,
      to: email,
      subject: "Reset your VaultIQ password",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; background: #0a0a0a; color: #e4e4e7; padding: 40px;">
          <div style="max-width: 480px; margin: 0 auto;">
            <h1 style="font-size: 24px; color: #ffffff;">Reset your password</h1>
            <p style="margin-top: 16px; line-height: 1.6;">
              You requested a password reset for your VaultIQ account. Click the button below to set a new password.
            </p>
            <a href="${resetUrl}" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #eab308; color: #18181b; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Reset Password
            </a>
            <p style="margin-top: 24px; font-size: 14px; color: #71717a;">
              This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });
    if (response.error) {
      logger.error(TAG, "Resend API error", response.error);
      if (env.NODE_ENV !== "production") {
        logger.info(TAG, `Dev mode — password reset URL: ${resetUrl}`);
        return { sent: false, devMode: true };
      }
      return { sent: false, devMode: false };
    }
    logger.info(TAG, `Password reset email sent to ${email}`);
    return { sent: true, devMode: false };
  } catch (error) {
    logger.error(TAG, "Failed to send password reset email", error);
    if (env.NODE_ENV !== "production") {
      logger.info(TAG, `Dev mode — password reset URL: ${resetUrl}`);
      return { sent: false, devMode: true };
    }
    return { sent: false, devMode: false };
  }
}
