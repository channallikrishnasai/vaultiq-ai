import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
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

      // Generate new reset token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: expires },
      });

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
