import bcrypt from "bcryptjs";
import { registerSchema } from "@/validations/auth";
import { userRepository } from "@/repositories/user.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { ConflictError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await userRepository.findByEmail(data.email.toLowerCase());
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await userRepository.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
    });

    return successResponse(
      { id: user.id, email: user.email, name: user.name },
      "Account created successfully",
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
