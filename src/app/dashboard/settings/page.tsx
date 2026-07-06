import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/dashboard/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/data-safe?from=/dashboard/settings");

  return (
    <SettingsClient
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }}
    />
  );
}
