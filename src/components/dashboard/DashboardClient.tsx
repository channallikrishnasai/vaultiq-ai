"use client";

import { OrbProvider } from "@/contexts/OrbContext";
import { SceneProvider } from "@/contexts/SceneContext";
import DashboardLayout from "./DashboardLayout";
import { DashboardData } from "@/types/dashboard";

interface Props { data: DashboardData; userId: string; user: { name?: string | null; email?: string | null; image?: string | null } }

export default function DashboardClient({ data, userId, user }: Props) {
  return (
    <OrbProvider>
      <SceneProvider>
        <DashboardLayout data={data} userId={userId} user={user} />
      </SceneProvider>
    </OrbProvider>
  );
}