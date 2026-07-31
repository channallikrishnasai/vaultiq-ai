import { requireAuth } from "@/lib/auth";
import { learningProgressSchema } from "@/validations/learning";
import { learningRepository } from "@/repositories/learning.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId");
    
    const progress = await learningRepository.getProgress(session.user.id);
    
    if (courseId) {
      const filtered = progress.filter((p) => p.courseId === courseId);
      return successResponse(filtered);
    }
    
    return successResponse(progress);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = learningProgressSchema.parse(body);
    const progress = await learningRepository.upsertProgress(
      session.user.id,
      data.courseId,
      data.lessonId,
      data.completed,
    );
    return successResponse(progress, "Progress updated");
  } catch (error) {
    return handleApiError(error);
  }
}
