import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateIntelligence } from "@/services/ai/intelligence.service";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const intelligence = await generateIntelligence(session.user.id);
    return NextResponse.json(intelligence);
  } catch (error) {
    return handleApiError(error);
  }
}
