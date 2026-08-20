import type { DeadlineStatus } from "@prisma/client";

export type ExamView = "upcoming" | "past";

export function parseExamView(value: string | string[] | undefined): ExamView {
  return value === "past" ? "past" : "upcoming";
}

export function examListWhere(userId: string, view: ExamView, now: Date) {
  return {
    userId,
    type: "EXAM" as const,
    dueAt: view === "past" ? { lt: now } : { gte: now },
  };
}

export function examOrder(view: ExamView) {
  return { dueAt: view === "past" ? "desc" as const : "asc" as const };
}

export function examTopics(value: string | null) {
  return value?.split(/\r?\n/).map((topic) => topic.trim()).filter(Boolean) ?? [];
}

export function examCountdown(dueAt: Date, now: Date) {
  const milliseconds = dueAt.getTime() - now.getTime();
  if (milliseconds <= 0) return "Finished";
  const days = Math.floor(milliseconds / 86_400_000);
  if (days > 0) return `${days} ${days === 1 ? "day" : "days"}`;
  const hours = Math.max(1, Math.ceil(milliseconds / 3_600_000));
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}

export function examStatusLabel(status: DeadlineStatus, isPast: boolean) {
  if (status === "COMPLETED") return "Completed";
  if (status === "SUBMITTED") return "Submitted";
  if (isPast) return "Exam passed";
  return status === "IN_PROGRESS" ? "Preparing" : null;
}
