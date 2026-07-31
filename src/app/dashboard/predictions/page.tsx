import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PredictiveFinanceClient from "@/components/dashboard/PredictiveFinanceClient";

export default async function PredictionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/data-safe?from=/dashboard/predictions");

  return <PredictiveFinanceClient />;
}
