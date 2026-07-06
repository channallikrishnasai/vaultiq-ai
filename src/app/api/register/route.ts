import bcrypt from "bcryptjs";
import crypto from "crypto";
import { registerSchema } from "@/validations/auth";
import { userRepository } from "@/repositories/user.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, isEmailConfigured } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await userRepository.findByEmail(data.email.toLowerCase());
    if (existing) {
      // Return success to prevent email enumeration. The user will receive
      // a verification email if the account exists but is unverified, or
      // nothing if the account is already verified.
      return successResponse(
        { id: existing.id, email: existing.email, name: existing.name },
        "If an account with that email exists and is unverified, a verification link has been sent.",
        200,
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await userRepository.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, token);

    if (!isEmailConfigured()) {
      return successResponse(
        { id: user.id, email: user.email, name: user.name },
        "Account created successfully. Email service is not configured. Verification emails cannot be sent in this environment.",
        201,
      );
    }

    if (emailResult.devMode) {
      return successResponse(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          devMode: true,
          token,
        },
        "Account created successfully. Check the server terminal for the verification link.",
        201,
      );
    }

    return successResponse(
      { id: user.id, email: user.email, name: user.name },
      emailResult.sent
        ? "Account created successfully. Please check your email to verify your account."
        : "Account created successfully. Failed to send verification email. Please try again later.",
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
