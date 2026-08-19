import type { DeadlineStatus } from "@prisma/client";

import { irishDateKey } from "@/lib/formatting";

export const REMINDER_OPTIONS = [
  { value: "", label: "No reminder" },
  { value: "0", label: "On the day" },
  { value: "1", label: "1 day before" },
  { value: "3", label: "3 days before" },
  { value: "7", label: "7 days before" },
  { value: "14", label: "14 days before" },
] as const;

const ACTIVE_STATUSES: DeadlineStatus[] = ["NOT_STARTED", "IN_PROGRESS"];

function dateKeyNumber(date: Date) {
  const [year, month, day] = irishDateKey(date).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function calendarDaysUntil(dueAt: Date, now: Date) {
  return Math.round((dateKeyNumber(dueAt) - dateKeyNumber(now)) / 86_400_000);
}

export function isActiveDeadline(status: DeadlineStatus) {
  return ACTIVE_STATUSES.includes(status);
}

export function isReminderEligible(deadline: { dueAt: Date; reminderDaysBefore: number | null; status: DeadlineStatus }, now: Date) {
  if (!isActiveDeadline(deadline.status) || deadline.reminderDaysBefore === null) return false;
  return deadline.dueAt.getTime() < now.getTime() || calendarDaysUntil(deadline.dueAt, now) <= deadline.reminderDaysBefore;
}

export function deadlineUrgency(dueAt: Date, now: Date) {
  const days = calendarDaysUntil(dueAt, now);
  if (dueAt.getTime() < now.getTime()) {
    const overdueDays = Math.max(0, -days);
    return overdueDays === 0 ? "Overdue" : `Overdue by ${overdueDays} ${overdueDays === 1 ? "day" : "days"}`;
  }
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}
