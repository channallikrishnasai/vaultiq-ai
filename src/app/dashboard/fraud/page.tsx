import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FraudPageClient } from "@/components/fraud/FraudPageClient";

export default async function FraudPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/data-safe?from=/dashboard/fraud");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  });

  if (!user) redirect("/data-safe?from=/dashboard/fraud");

  return <FraudPageClient user={user} />;
}
