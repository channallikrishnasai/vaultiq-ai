import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LearningHubClient } from "@/components/learning/LearningHubClient";

export default async function LearningPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/data-safe?from=/dashboard/learning");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  });

  if (!user) redirect("/data-safe?from=/dashboard/learning");

  return <LearningHubClient user={user} />;
}
