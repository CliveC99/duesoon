import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { deadlineCreationChildData, parseDeadlineCreationExtras } from "../lib/deadline-creation-extras.ts";

function parse(subtasks: unknown[], resources: unknown[]) {
  return parseDeadlineCreationExtras(JSON.stringify(subtasks), JSON.stringify(resources));
}

test("deadline creation accepts no checklist or resource children", () => {
  const result = parse([], []);
  assert.equal(result.success, true);
  if (result.success) assert.deepEqual(deadlineCreationChildData(result.data, "deadline-a", "user-a"), { subtasks: [], resources: [] });
});

test("deadline creation prepares checklist items with inherited ownership and stable order", () => {
  const result = parse([{ title: " First step " }, { title: "Second step" }], []);
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.deepEqual(deadlineCreationChildData(result.data, "deadline-a", "user-a").subtasks, [
    { deadlineId: "deadline-a", userId: "user-a", title: "First step", position: 0 },
    { deadlineId: "deadline-a", userId: "user-a", title: "Second step", position: 1 },
  ]);
});

test("deadline creation prepares normalized resources with inherited ownership", () => {
  const result = parse([], [{ label: " Moodle ", url: "https://VLE.ATU.ie/course" }]);
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.deepEqual(deadlineCreationChildData(result.data, "deadline-a", "user-a").resources, [
    { deadlineId: "deadline-a", userId: "user-a", label: "Moodle", url: "https://vle.atu.ie/course", position: 0 },
  ]);
});

test("deadline creation accepts checklist and resources together", () => {
  const result = parse([{ title: "Revise" }], [{ label: "Notes", url: "https://example.com/notes" }]);
  assert.equal(result.success, true);
  if (result.success) {
    const children = deadlineCreationChildData(result.data, "exam-a", "user-a");
    assert.equal(children.subtasks.length, 1);
    assert.equal(children.resources.length, 1);
  }
});

test("deadline creation rejects invalid temporary child values", () => {
  assert.equal(parse([{ title: "   " }], []).success, false);
  assert.equal(parse([], [{ label: "Unsafe", url: "javascript:alert(1)" }]).success, false);
  assert.equal(parseDeadlineCreationExtras("not-json", "[]").success, false);
});

test("deadline create action is atomic and derives all ownership server-side", async () => {
  const source = await readFile(new URL("../app/data-actions.ts", import.meta.url), "utf8");
  const createAction = source.slice(source.indexOf("export async function createDeadline"), source.indexOf("export async function updateDeadline"));
  assert.match(createAction, /const userId = await requireUserId\(\)/);
  assert.match(createAction, /prisma\.\$transaction\(async \(transaction\)/);
  assert.match(createAction, /transaction\.deadline\.create/);
  assert.match(createAction, /transaction\.deadlineSubtask\.createMany/);
  assert.match(createAction, /transaction\.deadlineResource\.createMany/);
  assert.doesNotMatch(createAction, /formData\.get\(["']userId["']\)/);
  assert.doesNotMatch(createAction, /formData\.get\(["']deadlineId["']\)/);
});

test("creation extras stay personal and work for exam forms without changing shared deadlines", async () => {
  const form = await readFile(new URL("../app/components/data-forms.tsx", import.meta.url), "utf8");
  assert.match(form, /isExam &&/);
  assert.match(form, /!initial && <DeadlineCreationExtras/);
  const sharedForm = await readFile(new URL("../app/components/group-forms.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(sharedForm, /DeadlineCreationExtras|deadlineSubtasks|deadlineResources/);
});
