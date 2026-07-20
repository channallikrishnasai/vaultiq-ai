import { requireAuth } from "@/lib/auth";
import { createAlertSchema } from "@/validations/trading";
import { alertService } from "@/services/market/alert.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { NotFoundError, ValidationError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requireAuth();
    const alerts = await alertService.getAlerts(session.user.id);
    return successResponse(alerts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = createAlertSchema.parse(body);
    const alert = await alertService.createAlert(session.user.id, data);
    return successResponse(alert, "Alert created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) throw new ValidationError("Alert id required");
    const result = await alertService.deleteAlert(id, session.user.id);
    if (!result) throw new NotFoundError("Alert not found");
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
