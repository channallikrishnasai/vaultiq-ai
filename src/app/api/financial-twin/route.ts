import { requireAuth } from "@/lib/auth";
import { financialTwinSchema } from "@/validations/financial-twin";
import { financialTwinService } from "@/services/financial-twin/twin.service";
import { financialTwinRepository } from "@/repositories/financial-twin.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { RiskAppetite } from "@/generated/prisma/enums";

export async function GET() {
  try {
    const session = await requireAuth();
    const twin = await financialTwinRepository.findActive(session.user.id);
    const all = await financialTwinRepository.findAll(session.user.id);
    return successResponse({ active: twin, history: all });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = financialTwinSchema.parse(body);
    const generated = await financialTwinService.generate(session.user.id, data);

    const twin = await financialTwinRepository.upsert(session.user.id, {
      name: generated.name,
      healthScore: generated.healthScore,
      riskAppetite: (generated.riskAppetite as RiskAppetite) ?? RiskAppetite.MODERATE,
      snapshot: generated.snapshot,
      projections: generated.projections,
      recommendations: { items: generated.recommendations, summary: generated.twinSummary },
    });

    return successResponse({ ...generated, id: twin.id });
  } catch (error) {
    return handleApiError(error);
  }
}
