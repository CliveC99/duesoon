import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { adjacentMonth, calendarGrid, gridDateKey, parseCalendarMonth } from "../lib/calendar.ts";
import { calculateGradeTarget, calculateModuleGrades } from "../lib/grades.ts";
import { focusRecommendation } from "../lib/focus.ts";
import { examListWhere, examOrder, examTopics, parseExamView } from "../lib/exams.ts";
import { calendarDaysUntil, deadlineUrgency, isReminderEligible } from "../lib/reminders.ts";
import { semesterTiming } from "../lib/semester.ts";

test("grade calculations include assessed weighting without inventing missing results", () => {
  const result = calculateModuleGrades([{ weighting: 40, resultPercent: 75 }, { weighting: 60, resultPercent: null }, { weighting: null, resultPercent: 80 }]);
  assert.equal(result.totalWeighting, 100);
  assert.equal(result.assessedWeighting, 40);
  assert.equal(result.weightedPoints, 30);
  assert.equal(result.currentAverage, 75);
  assert.equal(result.unweightedCount, 1);
});

test("focus prioritises urgency, weighting, active status, and returns no finished work", () => {
  const now = new Date("2026-08-19T12:00:00Z");
  const deadline = (id: string, days: number, weighting: number | null, status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED" = "IN_PROGRESS") => ({ id, title: id, dueAt: new Date(now.getTime() + days * 86_400_000), weighting, status });
  assert.equal(focusRecommendation([deadline("tomorrow", 1, 10), deadline("next-month", 30, 100)], now)?.id, "tomorrow");
  assert.equal(focusRecommendation([deadline("overdue", -1, 5), deadline("tomorrow", 1, 100)], now)?.id, "overdue");
  assert.equal(focusRecommendation([deadline("lighter", 2, 10), deadline("heavier", 2, 40)], now)?.id, "heavier");
  assert.equal(focusRecommendation([deadline("submitted", -2, 100, "SUBMITTED"), deadline("active", 4, 10)], now)?.id, "active");
  assert.equal(focusRecommendation([deadline("submitted", -2, 100, "SUBMITTED"), deadline("completed", -3, 100, "COMPLETED")], now), null);
});

test("the retired Today route redirects to Dashboard", async () => {
  const source = await readFile(new URL("../app/today/page.tsx", import.meta.url), "utf8");
  assert.match(source, /redirect\(["']\/dashboard["']\)/);
});

test("grade targets handle one and multiple remaining assessments", () => {
  const one = calculateGradeTarget([{ title: "Coursework", weighting: 60, resultPercent: 96.6666666667 }, { title: "Final Exam", weighting: 40, resultPercent: null }], 80);
  assert.equal(one.state, "REQUIRED");
  if (one.state === "REQUIRED") { assert.ok(Math.abs(one.knownContribution - 58) < 0.0001); assert.ok(Math.abs(one.requiredPercent - 55) < 0.0001); assert.deepEqual(one.remainingAssessments, [{ title: "Final Exam", weighting: 40 }]); }
  const multiple = calculateGradeTarget([{ title: "Recorded", weighting: 40, resultPercent: 50 }, { title: "Project", weighting: 20, resultPercent: null }, { title: "Exam", weighting: 40, resultPercent: null }], 60);
  assert.equal(multiple.state, "REQUIRED");
  if (multiple.state === "REQUIRED") { assert.equal(multiple.remainingWeighting, 60); assert.ok(Math.abs(multiple.requiredPercent - 66.6666666667) < 0.0001); }
});

test("grade targets handle secured, impossible, absent, and incomplete weighting", () => {
  assert.equal(calculateGradeTarget([{ weighting: 70, resultPercent: 100 }, { weighting: 30, resultPercent: null }], 60).state, "SECURED");
  assert.equal(calculateGradeTarget([{ weighting: 80, resultPercent: 50 }, { weighting: 20, resultPercent: null }], 70).state, "IMPOSSIBLE");
  assert.equal(calculateGradeTarget([{ weighting: 100, resultPercent: 50 }], 60).state, "NO_REMAINING");
  assert.equal(calculateGradeTarget([{ weighting: 80, resultPercent: null }], 60).incomplete, true);
  assert.equal(calculateGradeTarget([{ weighting: 80, resultPercent: null }, { weighting: 30, resultPercent: null }], 60).state, "INVALID_WEIGHTING");
});

test("grade targets support zero, full, and decimal results, weights, and targets", () => {
  const zero = calculateGradeTarget([{ weighting: 50, resultPercent: 0 }, { weighting: 50, resultPercent: null }], 40);
  assert.equal(zero.state, "REQUIRED");
  if (zero.state === "REQUIRED") assert.equal(zero.requiredPercent, 80);
  assert.equal(calculateGradeTarget([{ weighting: 50, resultPercent: 100 }, { weighting: 50, resultPercent: null }], 50).state, "SECURED");
  const decimal = calculateGradeTarget([{ weighting: 37.5, resultPercent: 72.5 }, { weighting: 62.5, resultPercent: null }], 68.5);
  assert.equal(decimal.state, "REQUIRED");
  if (decimal.state === "REQUIRED") assert.ok(Math.abs(decimal.requiredPercent - 66.1) < 0.0001);
});

test("semester timing clamps progress and reports week numbers", () => {
  const start = new Date("2026-09-01T00:00:00Z");
  const end = new Date("2026-12-15T00:00:00Z");
  assert.deepEqual(semesterTiming(start, end, new Date("2026-08-20T00:00:00Z")), { phase: "Upcoming", progress: 0 });
  assert.equal(semesterTiming(start, end, new Date("2026-09-15T00:00:00Z")).phase, "Week 3");
  assert.deepEqual(semesterTiming(start, end, new Date("2027-01-01T00:00:00Z")), { phase: "Semester complete", progress: 100 });
});

test("reminders use Dublin calendar days and exclude finished work", () => {
  const now = new Date("2026-03-29T00:30:00Z");
  const tomorrowInDublin = new Date("2026-03-29T23:30:00Z");
  assert.equal(calendarDaysUntil(tomorrowInDublin, now), 1);
  assert.equal(deadlineUrgency(tomorrowInDublin, now), "Due tomorrow");
  assert.equal(isReminderEligible({ dueAt: tomorrowInDublin, reminderDaysBefore: 1, status: "NOT_STARTED" }, now), true);
  assert.equal(isReminderEligible({ dueAt: tomorrowInDublin, reminderDaysBefore: 1, status: "COMPLETED" }, now), false);
  assert.equal(isReminderEligible({ dueAt: tomorrowInDublin, reminderDaysBefore: null, status: "IN_PROGRESS" }, now), false);
  assert.equal(deadlineUrgency(new Date("2026-03-27T12:00:00Z"), now), "Overdue by 2 days");
});

test("calendar parsing is bounded and the grid starts on Monday", () => {
  assert.deepEqual(parseCalendarMonth("2026-08"), { year: 2026, monthIndex: 7 });
  assert.deepEqual(parseCalendarMonth("invalid", new Date(2026, 4, 1)), { year: 2026, monthIndex: 4 });
  const grid = calendarGrid(2026, 7);
  assert.equal(grid.days[0].getUTCDay(), 1);
  assert.equal(gridDateKey(grid.days[0]), "2026-07-27");
  assert.equal(adjacentMonth(2026, 11, 1), "2027-01");
});

test("exam views are owner-scoped, type-filtered, and sorted around now", () => {
  const now = new Date("2026-12-01T12:00:00Z");
  assert.deepEqual(examListWhere("user-a", "upcoming", now), { userId: "user-a", type: "EXAM", dueAt: { gte: now } });
  assert.deepEqual(examListWhere("user-a", "past", now), { userId: "user-a", type: "EXAM", dueAt: { lt: now } });
  assert.deepEqual(examOrder("upcoming"), { dueAt: "asc" });
  assert.deepEqual(examOrder("past"), { dueAt: "desc" });
  assert.equal(parseExamView("past"), "past");
  assert.equal(parseExamView("anything"), "upcoming");
  assert.deepEqual(examTopics(" Trees\n\nGraph traversal\r\nSorting "), ["Trees", "Graph traversal", "Sorting"]);
});

test("exam results use the unchanged module grade calculation", () => {
  const examDeadline = { weighting: 40, resultPercent: 75 };
  const result = calculateModuleGrades([examDeadline, { weighting: 60, resultPercent: 50 }]);
  assert.equal(result.weightedPoints, 60);
  assert.equal(result.currentAverage, 60);
});

test("calendar continues to source exams from deadline data", async () => {
  const source = await readFile(new URL("../app/calendar/page.tsx", import.meta.url), "utf8");
  assert.match(source, /prisma\.deadline\.findMany/);
  assert.doesNotMatch(source, /prisma\.exam/);
  const calendar = await readFile(new URL("../app/components/month-calendar.tsx", import.meta.url), "utf8");
  assert.match(calendar, /EXAM ·/);
});
