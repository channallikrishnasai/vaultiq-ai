import { requireAuth } from "@/lib/auth";
import { quizSubmitSchema } from "@/validations/learning";
import { coursesService } from "@/services/learning/courses.service";
import { learningRepository } from "@/repositories/learning.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = quizSubmitSchema.parse(body);

    const result = coursesService.gradeQuiz(data.courseId, data.answers);
    if (!result) throw new NotFoundError("Course not found");

    await learningRepository.saveQuizResult(
      session.user.id,
      data.courseId,
      result.score,
      result.total,
      result.passed,
    );

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
