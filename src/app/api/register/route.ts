import bcrypt from "bcryptjs";
import crypto from "crypto";
import { registerSchema } from "@/validations/auth";
import { userRepository } from "@/repositories/user.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0] ?? "unknown";
    const rateLimitResult = checkRateLimit(`register:${ip}`, RATE_LIMITS.register);
    if (!rateLimitResult.allowed) {
      return Response.json({ error: "Too many requests. Please try again later." }, {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      });
    }

    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await userRepository.findByEmail(data.email.toLowerCase());
    if (existing) {
      return successResponse(
        {
          id: existing.id,
          email: existing.email,
          name: existing.name,
          redirectUrl: `/verify-email/dev?email=${encodeURIComponent(data.email.toLowerCase())}`,
        },
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

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    });

    return successResponse(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        redirectUrl: `/verify-email/dev?email=${encodeURIComponent(user.email)}`,
      },
      "Account created successfully.",
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
