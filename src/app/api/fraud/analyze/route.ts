import { requireAuth } from "@/lib/auth";
import { fraudAnalyzeSchema } from "@/validations/fraud";
import { fraudDetectorService } from "@/services/fraud/detector.service";
import { fraudRepository } from "@/repositories/fraud.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = fraudAnalyzeSchema.parse(body);

    const analysis = fraudDetectorService.analyze(data.inputType, data.content);
    const report = await fraudRepository.create(session.user.id, {
      inputType: data.inputType,
      content: data.content,
      riskScore: analysis.riskScore,
      threatCategory: analysis.threatCategory,
      explanation: analysis.explanation,
      actions: analysis.actions,
    });

    return successResponse({ ...analysis, reportId: report.id });
  } catch (error) {
    return handleApiError(error);
  }
}
