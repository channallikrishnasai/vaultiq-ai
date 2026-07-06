import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      throw new ValidationError("Reset token is required");
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new ValidationError("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
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
