import { requireAuth } from "@/lib/auth";
import { coursesService } from "@/services/learning/courses.service";
import { learningRepository } from "@/repositories/learning.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const courses = coursesService.getAllCourses();
    const progress = await learningRepository.getProgress(session.user.id);

    const enriched = courses.map((course) => ({
      ...course,
      completedLessons: progress.filter(
        (p) => p.courseId === course.id && p.completed,
      ).length,
      totalLessons: course.lessons.length,
    }));

    return successResponse(enriched);
  } catch (error) {
    return handleApiError(error);
  }
}
