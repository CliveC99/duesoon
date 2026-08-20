import assert from "node:assert/strict";
import { test } from "node:test";

import { linkedPersonalFields, membershipKey, ownedRecordWhere, sharedCommonFields, sharedDeadlineMemberWhere, timetableSourceWhere } from "../lib/authorization.ts";

test("personal record predicates always bind IDs to the authenticated owner", () => {
  assert.deepEqual(ownedRecordWhere("deadline-b", "user-a"), { id: "deadline-b", userId: "user-a" });
  assert.deepEqual(ownedRecordWhere("module-b", "user-a"), { id: "module-b", userId: "user-a" });
  assert.deepEqual(ownedRecordWhere("semester-b", "user-a"), { id: "semester-b", userId: "user-a" });
});

test("timetable source predicates bind the source to the authenticated user", () => {
  assert.deepEqual(timetableSourceWhere("source-b", "user-a"), { id: "source-b", userId: "user-a" });
});

test("group and shared deadline predicates require the authenticated membership", () => {
  assert.deepEqual(membershipKey("group-b", "user-a"), { groupId_userId: { groupId: "group-b", userId: "user-a" } });
  assert.deepEqual(sharedDeadlineMemberWhere("shared-b", "group-b", "user-a"), { id: "shared-b", groupId: "group-b", group: { members: { some: { userId: "user-a" } } } });
});

test("linked personal updates cannot overwrite common or result fields", () => {
  const personal = linkedPersonalFields({ moduleId: "module-a", reminderDaysBefore: 7, status: "IN_PROGRESS", notes: "private", examTopics: "Trees", examFormat: "Two hours", examLocation: "GA 0994", title: "attempted overwrite", resultPercent: 99 });
  assert.deepEqual(personal, { moduleId: "module-a", reminderDaysBefore: 7, status: "IN_PROGRESS", notes: "private", examTopics: "Trees", examFormat: "Two hours", examLocation: "GA 0994" });
  assert.equal("title" in personal, false);
  assert.equal("resultPercent" in personal, false);
});

test("shared synchronisation contains common fields only", () => {
  const dueAt = new Date("2026-10-10T16:00:00Z");
  const common = sharedCommonFields({ title: "Project", type: "PROJECT", dueAt, weighting: 40, status: "COMPLETED", notes: "private", reminderDaysBefore: 14, resultPercent: 90 });
  assert.deepEqual(common, { title: "Project", type: "PROJECT", dueAt, weighting: 40 });
  assert.equal("status" in common, false);
  assert.equal("notes" in common, false);
  assert.equal("reminderDaysBefore" in common, false);
  assert.equal("resultPercent" in common, false);
});
