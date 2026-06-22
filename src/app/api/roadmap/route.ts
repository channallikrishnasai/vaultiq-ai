import { requireAuth } from "@/lib/auth";
import { roadmapRepository } from "@/repositories/roadmap.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const roadmaps = await roadmapRepository.findAll(session.user.id);
    return successResponse(roadmaps);
  } catch (error) {
    return handleApiError(error);
  }
}
