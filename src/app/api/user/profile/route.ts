import { requireAuth } from "@/lib/auth";
import { updateProfileSchema } from "@/validations/user";
import { userRepository } from "@/repositories/user.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const user = await userRepository.findById(session.user.id);
    return successResponse({
      id: user?.id,
      name: user?.name,
      email: user?.email,
      image: user?.image,
      profile: user?.profile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = updateProfileSchema.parse(body);
    const profile = await userRepository.updateProfile(session.user.id, data);
    return successResponse(profile, "Profile updated");
  } catch (error) {
    return handleApiError(error);
  }
}
