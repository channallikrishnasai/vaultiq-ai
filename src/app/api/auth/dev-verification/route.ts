import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find the most recent unused token for this email
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

  const verificationUrl = `${appUrl}/verify-email?token=${token.token}`;

  return NextResponse.json({
    email: normalizedEmail,
    token: token.token,
    verificationUrl,
    expires: token.expires,
  });
}
