import assert from "node:assert/strict";
import { test } from "node:test";

import { changePasswordSchema, profileEmailSchema, profileNameSchema, signUpSchema } from "../lib/auth-validation.ts";
import { formatAcademicYearInput, normalizeAcademicYear } from "../lib/academic-year.ts";
import { deadlineResultSchema, deadlineSchema, groupSchema, semesterSchema, sharedDeadlineImportSchema } from "../lib/data-validation.ts";
import { subtaskTitleSchema } from "../lib/subtasks.ts";

const cuid = "clx1234567890123456789012";

test("registration normalises email and validates password confirmation", () => {
  const valid = signUpSchema.parse({ name: "  Alex Morgan  ", email: "  ALEX@Example.COM ", password: "password123", confirmPassword: "password123" });
  assert.equal(valid.name, "Alex Morgan");
  assert.equal(valid.email, "alex@example.com");
  assert.equal(signUpSchema.safeParse({ name: "Alex", email: "alex@example.com", password: "short", confirmPassword: "short" }).success, false);
  assert.equal(signUpSchema.safeParse({ name: "Alex", email: "alex@example.com", password: "password123", confirmPassword: "different123" }).success, false);
});

test("profile validation trims names, normalises email, and checks password rules", () => {
  assert.equal(profileNameSchema.parse({ name: "  Niamh Murphy " }).name, "Niamh Murphy");
  assert.equal(profileNameSchema.safeParse({ name: "N" }).success, false);
  assert.equal(profileEmailSchema.parse({ email: " USER@EXAMPLE.COM " }).email, "user@example.com");
  assert.equal(profileEmailSchema.safeParse({ email: "not-an-email" }).success, false);
  assert.equal(changePasswordSchema.safeParse({ currentPassword: "old-password", newPassword: "new-password", confirmPassword: "different" }).success, false);
});

test("semester academic years must be consecutive and dates ordered", () => {
  const base = { name: "Semester 1", startDate: "2026-09-01", endDate: "2026-12-20", isActive: "true" };
  for (const value of ["2026/27", "202627", "26/27", "2627"]) {
    assert.equal(semesterSchema.parse({ ...base, academicYear: value }).academicYear, "2026/27");
  }
  assert.equal(semesterSchema.safeParse({ ...base, academicYear: "26/28" }).success, false);
  assert.equal(semesterSchema.safeParse({ ...base, academicYear: "2026/28" }).success, false);
  assert.equal(semesterSchema.safeParse({ ...base, academicYear: "2026/27", startDate: "2026-12-21" }).success, false);
});

test("academic year input inserts slashes without fighting deletion or editing", () => {
  assert.equal(formatAcademicYearInput("2026"), "2026/");
  assert.equal(formatAcademicYearInput("202627"), "2026/27");
  assert.equal(formatAcademicYearInput("26"), "26/");
  assert.equal(formatAcademicYearInput("2627"), "26/27");
  assert.equal(formatAcademicYearInput("2026", { deleting: true }), "2026");
  assert.equal(formatAcademicYearInput("206/27", { atEnd: false }), "206/27");
});

test("academic year input handles pasted values and canonical normalization", () => {
  assert.equal(formatAcademicYearInput(" 202627 "), "2026/27");
  assert.equal(formatAcademicYearInput("26 / 27"), "26/27");
  assert.equal(normalizeAcademicYear("26/27"), "2026/27");
  assert.equal(normalizeAcademicYear("2627"), "2026/27");
  assert.equal(normalizeAcademicYear("26/28"), null);
});

test("deadline weighting, results, and reminders stay within supported ranges", () => {
  const deadline = { title: "Project", moduleId: cuid, type: "PROJECT", dueAt: "2026-10-10T16:00:00.000Z", weighting: "35", reminderDaysBefore: "7", status: "NOT_STARTED", notes: "" };
  assert.equal(deadlineSchema.safeParse(deadline).success, true);
  assert.equal(deadlineSchema.safeParse({ ...deadline, weighting: "101" }).success, false);
  assert.equal(deadlineSchema.safeParse({ ...deadline, reminderDaysBefore: "2" }).success, false);
  assert.equal(deadlineResultSchema.safeParse({ resultPercent: "0" }).success, true);
  assert.equal(deadlineResultSchema.safeParse({ resultPercent: "100" }).success, true);
  assert.equal(deadlineResultSchema.safeParse({ resultPercent: "100.1" }).success, false);
  assert.equal(deadlineResultSchema.safeParse({ resultPercent: "-1" }).success, false);
});

test("exam details persist only for exam deadlines", () => {
  const base = { title: "Algorithms Exam", moduleId: cuid, dueAt: "2026-12-10T09:00:00.000Z", weighting: "40", reminderDaysBefore: "7", status: "NOT_STARTED", notes: "", examTopics: " Linked lists\nTrees ", examFormat: "2 hours, answer 4", examLocation: "GA 0994" };
  const exam = deadlineSchema.parse({ ...base, type: "EXAM" });
  assert.equal(exam.examTopics, "Linked lists\nTrees");
  assert.equal(exam.examFormat, "2 hours, answer 4");
  assert.equal(exam.examLocation, "GA 0994");
  const project = deadlineSchema.parse({ ...base, type: "PROJECT" });
  assert.equal(project.examTopics, null);
  assert.equal(project.examFormat, null);
  assert.equal(project.examLocation, null);
});

test("group and shared import validation rejects malformed input", () => {
  assert.equal(groupSchema.parse({ name: "  Software Development Year 2 " }).name, "Software Development Year 2");
  assert.equal(groupSchema.safeParse({ name: "x" }).success, false);
  assert.equal(sharedDeadlineImportSchema.safeParse({ moduleId: cuid, reminderDaysBefore: "14" }).success, true);
  assert.equal(sharedDeadlineImportSchema.safeParse({ moduleId: "group-id", reminderDaysBefore: "14" }).success, false);
  assert.equal(sharedDeadlineImportSchema.safeParse({ moduleId: cuid, reminderDaysBefore: "30" }).success, false);
});

test("subtask titles are trimmed and empty or oversized titles are rejected", () => {
  assert.equal(subtaskTitleSchema.parse({ title: "  Build authentication  " }).title, "Build authentication");
  assert.equal(subtaskTitleSchema.safeParse({ title: "   " }).success, false);
  assert.equal(subtaskTitleSchema.safeParse({ title: "x".repeat(181) }).success, false);
});
