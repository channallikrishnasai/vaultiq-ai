import { requireAuth } from "@/lib/auth";
import { createBillSchema } from "@/validations/bill";
import { billRepository } from "@/repositories/bill.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const bills = await billRepository.findAll(session.user.id);
    return successResponse(bills);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = createBillSchema.parse(body);
    const bill = await billRepository.create(session.user.id, data);
    return successResponse(bill, "Bill registered", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
