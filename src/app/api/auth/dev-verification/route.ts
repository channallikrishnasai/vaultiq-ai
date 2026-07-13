import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  if (env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: normalizedEmail,
      expires: { gt: new Date() },
    },
    orderBy: { expires: "desc" },
  });

  if (!token) {
    return NextResponse.json(
      { error: "No pending verification found for this email" },
      { status: 404 },
    );
  }

  const verificationUrl = `${env.APP_URL}/verify-email?token=${token.token}`;

  return NextResponse.json({
    email: normalizedEmail,
    token: token.token,
    verificationUrl,
    expires: token.expires,
  });
}
