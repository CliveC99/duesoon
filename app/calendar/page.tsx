import type { Metadata } from "next";
import Link from "next/link";

import { ManageShell } from "@/app/components/manage-shell";
import { MonthCalendar } from "@/app/components/month-calendar";
import { auth } from "@/auth";
import { adjacentMonth, calendarGrid, calendarMonthKey, parseCalendarMonth } from "@/lib/calendar";
import { irishDateKey } from "@/lib/formatting";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  const userId = await requireUserId();
  const query = await searchParams;
  const now = new Date();
  const todayKey = irishDateKey(now);
  const currentMonthKey = todayKey.slice(0, 7);
  const { year, monthIndex } = parseCalendarMonth(query.month ?? currentMonthKey, now);
  const monthKey = calendarMonthKey(year, monthIndex);
  const { days, queryStart, queryEnd } = calendarGrid(year, monthIndex);
  const [session, activeSemester, deadlines] = await Promise.all([
    auth(),
    prisma.semester.findFirst({ where: { userId, isActive: true }, select: { id: true, name: true, academicYear: true }, orderBy: { updatedAt: "desc" } }),
    prisma.deadline.findMany({
      where: { userId, dueAt: { gte: queryStart, lt: queryEnd } },
      select: { id: true, title: true, type: true, dueAt: true, status: true, module: { select: { name: true, code: true, colour: true, semesterId: true } } },
      orderBy: { dueAt: "asc" },
    }),
  ]);
  const sortedDeadlines = deadlines.sort((left, right) => {
    const leftActive = left.module.semesterId === activeSemester?.id ? 0 : 1;
    const rightActive = right.module.semesterId === activeSemester?.id ? 0 : 1;
    return leftActive - rightActive || left.dueAt.getTime() - right.dueAt.getTime();
  });
  const deadlinesByDate = sortedDeadlines.reduce<Record<string, typeof deadlines>>((groups, deadline) => {
    const key = irishDateKey(deadline.dueAt);
    (groups[key] ??= []).push(deadline);
    return groups;
  }, {});
  const heading = new Intl.DateTimeFormat("en-IE", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthIndex, 1)));

  return <ManageShell user={session!.user!} title="Calendar" description={activeSemester ? `${activeSemester.name} · ${activeSemester.academicYear} is prioritised. Browse any month to see all your deadlines.` : "Browse your deadlines month by month."}><div className="calendar-toolbar"><div className="calendar-navigation"><Link className="calendar-nav-button" href={`/calendar?month=${adjacentMonth(year, monthIndex, -1)}`} aria-label="Previous month">←</Link><Link className="calendar-today-button" href="/calendar">Today</Link><Link className="calendar-nav-button" href={`/calendar?month=${adjacentMonth(year, monthIndex, 1)}`} aria-label="Next month">→</Link></div><h2>{heading}</h2><Link className="add-button" href="/deadlines/new">Add deadline</Link></div><MonthCalendar key={monthKey} days={days} deadlinesByDate={deadlinesByDate} monthKey={monthKey} activeSemesterId={activeSemester?.id ?? null} todayKey={todayKey} now={now.getTime()} /></ManageShell>;
}
