import { redirect } from "next/navigation";

import { DashboardView } from "@/app/page";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return <DashboardView user={session.user} />;
}
