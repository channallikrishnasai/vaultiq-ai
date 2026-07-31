import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { searchService } from "@/services/ai/search.service";
import { handleApiError } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const results = await searchService.search(session.user.id, query);
    return successResponse(results);
  } catch (error) {
    return handleApiError(error);
  }
}
