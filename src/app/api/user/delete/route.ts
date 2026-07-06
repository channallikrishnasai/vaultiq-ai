import { requireAuth } from "@/lib/auth";
import { userRepository } from "@/repositories/user.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function DELETE() {
  try {
    const session = await requireAuth();
    await userRepository.delete(session.user.id);
    return successResponse(null, "Account deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
