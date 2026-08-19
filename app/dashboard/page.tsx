import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardView } from "@/app/page";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const now = new Date();
  const [deadlines, completedCount, moduleCount] = await Promise.all([
    prisma.deadline.findMany({
      where: { userId: session.user.id, dueAt: { gte: now } },
      select: { id: true, title: true, type: true, dueAt: true, weighting: true, status: true, notes: true, module: { select: { name: true, code: true, colour: true } } },
      orderBy: { dueAt: "asc" },
    }),
    prisma.deadline.count({ where: { userId: session.user.id, status: "COMPLETED" } }),
    prisma.module.count({ where: { userId: session.user.id } }),
  ]);

  return <DashboardView user={session.user} deadlines={deadlines} completedCount={completedCount} moduleCount={moduleCount} renderedAt={now.getTime()} />;
}
