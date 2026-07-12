"use client";

import { OrbProvider } from "@/contexts/OrbContext";
import { SceneProvider } from "@/contexts/SceneContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import DashboardLayout from "./DashboardLayout";
import { DashboardData } from "@/types/dashboard";

interface Props {
  data: DashboardData;
  userId: string;
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function DashboardClient({ data, userId, user }: Props) {
  return (
    <DashboardProvider initialData={data}>
      <OrbProvider>
        <SceneProvider>
          <DashboardLayout userId={userId} user={user} />
        </SceneProvider>
      </OrbProvider>
    </DashboardProvider>
  );
}
