import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0] ?? "unknown";
    const rateLimitResult = checkRateLimit(`reset-password:${ip}`, RATE_LIMITS.resetPassword);
    if (!rateLimitResult.allowed) {
      return Response.json({ error: "Too many requests. Please try again later." }, {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      });
    }

    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      throw new ValidationError("Reset token is required");
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    // Find users with unexpired reset tokens and verify the hashed token
    const usersWithTokens = await prisma.user.findMany({
      where: {
        resetToken: { not: null },
        resetTokenExpiry: { gt: new Date() },
      },
    });

    let matchedUser: typeof usersWithTokens[0] | null = null;
    for (const u of usersWithTokens) {
      if (u.resetToken && await bcrypt.compare(token, u.resetToken)) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      throw new ValidationError("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return successResponse(
      { reset: true },
      "Password has been reset successfully",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
