import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return errorResponse("bad_request", "Email is required", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, emailVerified: true },
    });

    // Always return success to prevent email enumeration.
    // If the user doesn't exist or is already verified, we simply don't send anything.
    if (!user || user.emailVerified) {
      return successResponse(
        { sent: true },
        "If an account with that email exists and is unverified, a verification link has been sent.",
      );
    }

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // Generate a new verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(normalizedEmail, token);

    if (emailResult.devMode) {
      return successResponse(
        { token, devMode: true },
        "Verification email resent. Check the server terminal for the new link.",
      );
    }

    if (emailResult.sent) {
      return successResponse({ sent: true }, "Verification email sent successfully.");
    }

    return errorResponse(
      "email_failed",
      "Failed to send verification email. Please try again later.",
      500,
    );
  } catch {
    return errorResponse("internal_error", "An unexpected error occurred", 500);
  }
}
