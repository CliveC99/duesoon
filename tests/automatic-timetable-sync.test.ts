import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { automaticSyncSummary, syncTimetableSources } from "../lib/timetable-sync-batch.ts";

test("automatic sync considers every source and continues after a failure", async () => {
  const visited: string[] = [];
  const sources = [
    { id: "source-a", userId: "user-a" },
    { id: "source-b", userId: "user-b" },
    { id: "source-c", userId: "user-c" },
  ];
  const summary = await syncTimetableSources(sources, async (sourceId) => {
    visited.push(sourceId);
    if (sourceId === "source-b") throw new Error("private failure");
    return { success: true };
  });

  assert.deepEqual(visited, ["source-a", "source-b", "source-c"]);
  assert.deepEqual(summary, { sourcesChecked: 3, successful: 2, failed: 1 });
});

test("automatic sync counts returned failures and handles no sources", async () => {
  assert.deepEqual(
    await syncTimetableSources([{ id: "source-a", userId: "user-a" }], async () => ({ success: false })),
    { sourcesChecked: 1, successful: 0, failed: 1 },
  );
  assert.deepEqual(await syncTimetableSources([], async () => ({ success: true })), { sourcesChecked: 0, successful: 0, failed: 0 });
});

test("automatic sync output contains summary counts and no source data", () => {
  const output = automaticSyncSummary({ sourcesChecked: 5, successful: 4, failed: 1 });
  assert.equal(output, "Automatic timetable sync complete\nSources checked: 5\nSuccessful: 4\nFailed: 1");
  assert.doesNotMatch(output, /https?:|webcal:|user-|source-|@/);
});

test("failed refreshes update source status without deleting existing events", async () => {
  const implementation = await readFile(new URL("../lib/timetable-sync.ts", import.meta.url), "utf8");
  const catchBlock = implementation.slice(implementation.lastIndexOf("} catch (error) {"));
  assert.match(catchBlock, /lastSyncStatus: "FAILED"/);
  assert.doesNotMatch(catchBlock, /timetableEvent\.deleteMany/);
  assert.ok(implementation.indexOf("fetchTimetableFeed") < implementation.indexOf("timetableEvent.deleteMany"));
});

test("automatic runs use a database advisory lock and suppress per-source failure logs", async () => {
  const implementation = await readFile(new URL("../lib/automatic-timetable-sync.ts", import.meta.url), "utf8");
  assert.match(implementation, /pg_try_advisory_xact_lock/);
  assert.match(implementation, /logFailure: false/);
});
