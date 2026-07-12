import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { aggregateDashboardData } from "@/services/dashboard/dashboard-aggregation.service";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/data-safe?from=/dashboard");

  const data = await aggregateDashboardData(session.user.id);

  return <DashboardClient data={data} userId={session.user.id} user={session.user} />;
}
