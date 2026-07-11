import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
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

    if (!user || user.emailVerified) {
      return successResponse(
        { sent: true },
        "If an account with that email exists and is unverified, a verification link has been sent.",
      );
    }

    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    });

    return successResponse(
      { redirectUrl: `/verify-email/dev?email=${encodeURIComponent(normalizedEmail)}` },
      "Verification email resent.",
    );
  } catch {
    return errorResponse("internal_error", "An unexpected error occurred", 500);
  }
}
