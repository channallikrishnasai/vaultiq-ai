import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AICommandCenter from "@/components/dashboard/AICommandCenter";

export default async function AICommandCenterPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/data-safe?from=/dashboard/ai-command-center");

  return <AICommandCenter userId={session.user.id} />;
}
