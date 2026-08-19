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
  const [activeDeadlines, recentDeadlines, completedCount, moduleCount, deadlineCount] = await Promise.all([
    prisma.deadline.findMany({
      where: { userId: session.user.id, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
      select: { id: true, title: true, type: true, dueAt: true, weighting: true, status: true, notes: true, module: { select: { name: true, code: true, colour: true } } },
      orderBy: { dueAt: "asc" },
    }),
    prisma.deadline.findMany({
      where: { userId: session.user.id, status: { in: ["SUBMITTED", "COMPLETED"] } },
      select: { id: true, title: true, type: true, dueAt: true, weighting: true, status: true, notes: true, module: { select: { name: true, code: true, colour: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.deadline.count({ where: { userId: session.user.id, status: "COMPLETED" } }),
    prisma.module.count({ where: { userId: session.user.id } }),
    prisma.deadline.count({ where: { userId: session.user.id } }),
  ]);

  return <DashboardView user={session.user} activeDeadlines={activeDeadlines} recentDeadlines={recentDeadlines} deadlineCount={deadlineCount} completedCount={completedCount} moduleCount={moduleCount} renderedAt={now.getTime()} />;
}
