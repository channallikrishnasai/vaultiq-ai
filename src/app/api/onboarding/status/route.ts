import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { onboardingCompleted: true },
    });

    return NextResponse.json({ completed: profile?.onboardingCompleted ?? false });
  } catch (error) {
    return handleApiError(error);
  }
}
