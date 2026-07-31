import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DocumentsClient from "@/components/dashboard/DocumentsClient";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/data-safe?from=/dashboard/documents");

  return <DocumentsClient />;
}
