import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { financialHubService } from "@/services/ai/financial-hub.service";
import { handleApiError } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const summary = await financialHubService.getDashboardSummary(session.user.id);
    return successResponse(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
