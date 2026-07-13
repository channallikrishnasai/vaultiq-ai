import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0] ?? "unknown";
    const rateLimitResult = checkRateLimit(`forgot-password:${ip}`, RATE_LIMITS.forgotPassword);
    if (!rateLimitResult.allowed) {
      return Response.json({ error: "Too many requests. Please try again later." }, {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      });
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      // Always return success to prevent email enumeration
      return successResponse(
        { sent: true },
        "If an account with that email exists, a reset link has been sent.",
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Invalidate any existing reset tokens for this user
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null },
      });

      // Generate new reset token and hash it before storage
      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = await bcrypt.hash(token, 12);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: hashedToken, resetTokenExpiry: expires },
      });

      // Send the raw token in the email (user will present it back for verification)
      await sendPasswordResetEmail(normalizedEmail, token);
    }

    // Always return the same response to prevent email enumeration
    return successResponse(
      { sent: true },
      "If an account with that email exists, a reset link has been sent.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
