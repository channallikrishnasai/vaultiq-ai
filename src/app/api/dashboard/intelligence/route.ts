import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateIntelligence } from "@/services/ai/intelligence.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const intelligence = await generateIntelligence(session.user.id);
    return NextResponse.json(intelligence);
  } catch (error) {
    console.error("[Intelligence API]", error);
    return NextResponse.json(
      { error: "Failed to generate intelligence" },
      { status: 500 },
    );
  }
}
