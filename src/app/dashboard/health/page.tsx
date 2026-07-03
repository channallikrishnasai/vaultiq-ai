import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FinancialHealthClient } from "@/components/health/FinancialHealthClient";

export default async function HealthPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/data-safe?from=/dashboard/health");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  });

  if (!user) redirect("/data-safe?from=/dashboard/health");

  return <FinancialHealthClient user={user} />;
}
