"use client";

import dynamic from "next/dynamic";

const ReportsClient = dynamic(() => import("@/components/dashboard/ReportsClient").then(m => ({ default: m.ReportsClient })), { ssr: false });

interface Props {
  user: { name: string | null; email: string | null; image: string | null };
}

export default function ReportsClientWrapper({ user }: Props) {
  return <ReportsClient user={{ ...user, email: user.email ?? "" }} />;
}
