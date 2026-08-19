import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardView } from "@/app/page";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { semesterTiming } from "@/lib/semester";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const now = new Date();
  const activeSemester = await prisma.semester.findFirst({ where: { userId: session.user.id, isActive: true }, select: { id: true, name: true, academicYear: true, startDate: true, endDate: true }, orderBy: { updatedAt: "desc" } });
  const semesterFilter = activeSemester ? { module: { semesterId: activeSemester.id } } : {};
  const [activeDeadlines, recentDeadlines, completedCount, moduleCount, deadlineCount] = await Promise.all([
    prisma.deadline.findMany({
      where: { userId: session.user.id, status: { in: ["NOT_STARTED", "IN_PROGRESS"] }, ...semesterFilter },
      select: { id: true, title: true, type: true, dueAt: true, weighting: true, status: true, notes: true, module: { select: { name: true, code: true, colour: true } } },
      orderBy: { dueAt: "asc" },
    }),
    prisma.deadline.findMany({
      where: { userId: session.user.id, status: { in: ["SUBMITTED", "COMPLETED"] }, ...semesterFilter },
      select: { id: true, title: true, type: true, dueAt: true, weighting: true, status: true, notes: true, module: { select: { name: true, code: true, colour: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.deadline.count({ where: { userId: session.user.id, status: "COMPLETED", ...semesterFilter } }),
    prisma.module.count({ where: { userId: session.user.id, ...(activeSemester ? { semesterId: activeSemester.id } : {}) } }),
    prisma.deadline.count({ where: { userId: session.user.id, ...semesterFilter } }),
  ]);

  const semesterOverview = activeSemester ? { ...activeSemester, ...semesterTiming(activeSemester.startDate, activeSemester.endDate, now) } : null;
  return <DashboardView user={session.user} activeDeadlines={activeDeadlines} recentDeadlines={recentDeadlines} deadlineCount={deadlineCount} completedCount={completedCount} moduleCount={moduleCount} semester={semesterOverview} renderedAt={now.getTime()} />;
}
