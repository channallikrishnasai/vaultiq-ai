import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BillsClient } from "@/components/dashboard/BillsClient";
import { prisma } from "@/lib/prisma";

export default async function BillsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  });

  if (!user) redirect("/sign-in");

  return <BillsClient user={user} />;
}
