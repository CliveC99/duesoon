import assert from "node:assert/strict";
import { test } from "node:test";

import { adjacentMonth, calendarGrid, gridDateKey, parseCalendarMonth } from "../lib/calendar.ts";
import { calculateModuleGrades } from "../lib/grades.ts";
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
