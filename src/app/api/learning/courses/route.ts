import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    // Fetch all published courses with their modules and lessons
    const courses = await prisma.course.findMany({
      where: { published: true },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    return successResponse(courses);
  } catch (error) {
    return handleApiError(error);
  }
}
