import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { actionAgent } from "@/services/ai/action-agent.service";
import { handleApiError } from "@/lib/api-handler";
import { successResponse } from "@/lib/api-response";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const actions = actionAgent.getRecentActions(session.user.id, 10);
    const formatted = actions.map((a) => ({
      id: a.request.id,
      type: a.request.type,
      description: a.preview?.description || a.request.type,
      status: a.status,
      timestamp: a.createdAt,
    }));

    return successResponse(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}
