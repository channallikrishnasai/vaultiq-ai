import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";

export async function getSession() {
  return auth();
}

export async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session.user.id;
}
