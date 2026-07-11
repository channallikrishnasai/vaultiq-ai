import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/data-safe?from=/dashboard");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { onboardingCompleted: true },
  });

  if (!profile?.onboardingCompleted) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
