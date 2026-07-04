import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FinancialTwinPageClient } from "@/components/financial-twin/FinancialTwinPageClient";
import BudgetPlanner from "@/components/dashboard/BudgetPlanner";

export default async function TwinPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/data-safe?from=/dashboard/twin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  });

  if (!user) redirect("/data-safe?from=/dashboard/twin");

  return (
  <>
    <FinancialTwinPageClient user={user} />
    <BudgetPlanner />
  </>
);
}
