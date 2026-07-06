import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;
const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const isDev = process.env.NODE_ENV !== "production";

export interface EmailResult {
  sent: boolean;
  devMode: boolean;
}

function getResendClient(): Resend | null {
  if (!resendApiKey) {
    console.warn(
      "[Email] RESEND_API_KEY is not set. Emails will not be sent. " +
        "Set RESEND_API_KEY in your environment variables to enable email delivery.",
    );
    return null;
  }
  return new Resend(resendApiKey);
}

export function isEmailConfigured(): boolean {
  return !!resendApiKey;
}

function logDevVerificationUrl(email: string, token: string) {
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  console.log("");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║           DEVELOPMENT MODE — EMAIL NOT SENT             ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  To:   ${email.padEnd(47)}║`);
  console.log("║                                                          ║");
  console.log("║  Verification URL:                                      ║");
  console.log(`║  ${verifyUrl.substring(0, 55).padEnd(55)}║`);
  console.log("║                                                          ║");
  console.log(`║  Token: ${token.substring(0, 48).padEnd(48)}║`);
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");
}

export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<EmailResult> {
  const resend = getResendClient();

  if (!resend) {
    if (isDev) {
      logDevVerificationUrl(email, token);
      return { sent: false, devMode: true };
    }
    return { sent: false, devMode: false };
  }

  const from = emailFrom ?? "VaultIQ <onboarding@resend.dev>";
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

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
      console.error("[Email] Resend API error:", response.error);
      if (isDev) {
        logDevVerificationUrl(email, token);
        return { sent: false, devMode: true };
      }
      return { sent: false, devMode: false };
    }
    console.log("[Email] Verification email sent to", email);
    return { sent: true, devMode: false };
  } catch (error) {
    console.error("[Email] Failed to send verification email:", error);
    if (isDev) {
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
    if (isDev) {
      const resetUrl = `${appUrl}/reset-password?token=${token}`;
      console.log("");
      console.log("╔══════════════════════════════════════════════════════════╗");
      console.log("║           DEVELOPMENT MODE — EMAIL NOT SENT             ║");
      console.log("╠══════════════════════════════════════════════════════════╣");
      console.log(`║  To:   ${email.padEnd(47)}║`);
      console.log("║                                                          ║");
      console.log("║  Password Reset URL:                                    ║");
      console.log(`║  ${resetUrl.substring(0, 55).padEnd(55)}║`);
      console.log("║                                                          ║");
      console.log(`║  Token: ${token.substring(0, 48).padEnd(48)}║`);
      console.log("╚══════════════════════════════════════════════════════════╝");
      console.log("");
      return { sent: false, devMode: true };
    }
    return { sent: false, devMode: false };
  }

  const from = emailFrom ?? "VaultIQ <onboarding@resend.dev>";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

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
      console.error("[Email] Resend API error:", response.error);
      if (isDev) {
        console.log("");
        console.log("[Email] DEVELOPMENT MODE — Password reset URL:");
        console.log("[Email]", resetUrl);
        console.log("[Email] Token:", token);
        console.log("");
        return { sent: false, devMode: true };
      }
      return { sent: false, devMode: false };
    }
    console.log("[Email] Password reset email sent to", email);
    return { sent: true, devMode: false };
  } catch (error) {
    console.error("[Email] Failed to send password reset email:", error);
    if (isDev) {
      console.log("");
      console.log("[Email] DEVELOPMENT MODE — Password reset URL:");
      console.log("[Email]", resetUrl);
      console.log("[Email] Token:", token);
      console.log("");
      return { sent: false, devMode: true };
    }
    return { sent: false, devMode: false };
  }
}
