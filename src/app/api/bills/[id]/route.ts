import { requireAuth } from "@/lib/auth";
import { billRepository } from "@/repositories/bill.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const bill = await billRepository.findById(id, session.user.id);
    if (!bill) throw new NotFoundError("Bill not found");
    return successResponse(bill);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const bill = await billRepository.togglePaid(id, session.user.id);
    return successResponse(bill, "Bill status toggled");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const result = await billRepository.delete(id, session.user.id);
    if (result.count === 0) throw new NotFoundError("Bill not found");
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
