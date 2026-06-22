import { requireAuth } from "@/lib/auth";
import { roadmapGenerateSchema } from "@/validations/roadmap";
import { roadmapGeneratorService } from "@/services/roadmap/generator.service";
import { roadmapRepository } from "@/repositories/roadmap.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const input = roadmapGenerateSchema.parse(body);
    const output = roadmapGeneratorService.generate(input);
    const roadmap = await roadmapRepository.create(session.user.id, input, output);
    return successResponse({ ...output, id: roadmap.id });
  } catch (error) {
    return handleApiError(error);
  }
}
