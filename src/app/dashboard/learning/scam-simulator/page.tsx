import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ScamSimulatorClient } from "@/components/learning/ScamSimulatorClient";

export default async function ScamSimulatorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/data-safe?from=/dashboard/learning/scam-simulator");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  });

  if (!user) redirect("/data-safe?from=/dashboard/learning/scam-simulator");

  return <ScamSimulatorClient user={user} />;
}
