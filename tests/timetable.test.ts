import assert from "node:assert/strict";
import { test } from "node:test";

import { decryptTimetableUrl, encryptTimetableUrl } from "../lib/timetable-crypto.ts";
import { parseTimetableFeed, timetableEventIdentity, timetableReconciliation } from "../lib/timetable-parser.ts";
import { nextTimetableEvent, timetableDisplayState, timetableEventsForIrishDay } from "../lib/timetable.ts";
import { isPublicAddress, normaliseTimetableUrl, TimetableUrlError, validateResolvedAddresses } from "../lib/timetable-url.ts";
import { formatIrishTime, irishDateKey } from "../lib/formatting.ts";

const key = Buffer.alloc(32, 7).toString("base64");

test("private timetable URLs round-trip with authenticated encryption", () => {
  const encrypted = encryptTimetableUrl("https://college.example.ie/private/token.ics", "user-a", key);
  assert.notEqual(encrypted.ciphertext.toString("utf8"), "https://college.example.ie/private/token.ics");
  assert.equal(decryptTimetableUrl(encrypted, "user-a", key), "https://college.example.ie/private/token.ics");
  assert.throws(() => decryptTimetableUrl(encrypted, "user-b", key));
  const tampered = { ...encrypted, ciphertext: Buffer.from(encrypted.ciphertext) };
  tampered.ciphertext[0] ^= 1;
  assert.throws(() => decryptTimetableUrl(tampered, "user-a", key));
});

test("timetable URL validation accepts safe feeds and normalises webcal", () => {
  assert.equal(normaliseTimetableUrl("webcal://college.example.ie/live.ics", true).toString(), "https://college.example.ie/live.ics");
  assert.equal(normaliseTimetableUrl("https://college.example.ie/live.ics#private-fragment", true).hash, "");
  assert.throws(() => normaliseTimetableUrl("file:///etc/passwd", true));
  assert.throws(() => normaliseTimetableUrl("http://college.example.ie/live.ics", true));
  assert.throws(() => normaliseTimetableUrl("https://user:secret@college.example.ie/live.ics", true));
  assert.throws(() => normaliseTimetableUrl("https://metadata.google.internal/calendar", true));
  assert.throws(() => normaliseTimetableUrl("https://[::1]/calendar", true));
  assert.throws(() => normaliseTimetableUrl("https://2130706433/calendar", true));
  assert.throws(() => normaliseTimetableUrl("https://college.example.ie:8443/calendar", true));
});

test("timetable URL failures retain safe diagnostic classifications", () => {
  assert.throws(() => normaliseTimetableUrl("file:///etc/passwd", true), (error) => error instanceof TimetableUrlError && error.code === "URL_PROTOCOL");
  assert.throws(() => normaliseTimetableUrl("https://user:secret@college.example.ie/live.ics", true), (error) => error instanceof TimetableUrlError && error.code === "URL_CREDENTIALS");
  assert.throws(() => normaliseTimetableUrl("https://127.0.0.1/live.ics", true), (error) => error instanceof TimetableUrlError && error.code === "URL_PRIVATE_HOST");
});

test("timetable display state distinguishes sync failure, empty feed, and empty week", () => {
  const successfulSync = new Date("2026-08-19T12:00:00Z");
  assert.equal(timetableDisplayState(null, 0, 0), "SYNC_ERROR");
  assert.equal(timetableDisplayState(successfulSync, 3, 20), "EVENTS");
  assert.equal(timetableDisplayState(successfulSync, 0, 0), "EMPTY_FEED");
  assert.equal(timetableDisplayState(successfulSync, 0, 20), "EMPTY_WEEK");
});

test("SSRF address checks reject local and special IPv4 and IPv6 ranges", () => {
  for (const address of ["127.0.0.1", "10.0.0.4", "169.254.169.254", "192.168.1.2", "::1", "fe80::1", "fc00::1", "::ffff:127.0.0.1"]) assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress("1.1.1.1"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
  assert.throws(() => validateResolvedAddresses([{ address: "1.1.1.1", family: 4 }, { address: "127.0.0.1", family: 4 }]));
  assert.deepEqual(validateResolvedAddresses([{ address: "1.1.1.1", family: 4 }]), [{ address: "1.1.1.1", family: 4 }]);
});

test("iCalendar parsing handles Dublin winter and summer times and stable identities", () => {
  const body = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:winter@example.ie\r\nDTSTAMP:20260101T000000Z\r\nDTSTART;TZID=Europe/Dublin:20260109T090000\r\nDTEND;TZID=Europe/Dublin:20260109T110000\r\nSUMMARY:Winter Lecture\r\nLOCATION:Room 1\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:summer@example.ie\r\nDTSTAMP:20260401T000000Z\r\nDTSTART;TZID=Europe/Dublin:20260410T090000\r\nDTEND;TZID=Europe/Dublin:20260410T100000\r\nSUMMARY:Summer Lecture\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  const events = parseTimetableFeed(body, new Date("2026-04-01T00:00:00Z"));
  assert.equal(events.length, 2);
  assert.equal(events[0].startAt.toISOString(), "2026-01-09T09:00:00.000Z");
  assert.equal(events[1].startAt.toISOString(), "2026-04-10T08:00:00.000Z");
  assert.equal(formatIrishTime(events[1].startAt), "09:00");
  assert.equal(new Set(events.map(timetableEventIdentity)).size, 2);
});

test("recurrence parsing is idempotent and reconciliation identifies removed instances", () => {
  const body = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:weekly@example.ie\r\nDTSTAMP:20260801T000000Z\r\nDTSTART;TZID=Europe/Dublin:20260907T090000\r\nDTEND;TZID=Europe/Dublin:20260907T100000\r\nRRULE:FREQ=WEEKLY;COUNT=2\r\nSUMMARY:Database Systems\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  const first = parseTimetableFeed(body, new Date("2026-09-01T00:00:00Z"));
  const second = parseTimetableFeed(body, new Date("2026-09-01T00:00:00Z"));
  assert.deepEqual(first.map(timetableEventIdentity), second.map(timetableEventIdentity));
  assert.equal(first.length, 2);
  const diff = timetableReconciliation(first, second.slice(0, 1));
  assert.equal(diff.retained.length, 1);
  assert.equal(diff.removed.length, 1);
});

test("today and next-class helpers group by Europe/Dublin", () => {
  const events = [
    { id: "a", title: "Early", location: null, startAt: new Date("2026-07-01T08:00:00Z"), endAt: new Date("2026-07-01T09:00:00Z"), allDay: false },
    { id: "b", title: "Later", location: null, startAt: new Date("2026-07-01T12:00:00Z"), endAt: new Date("2026-07-01T13:00:00Z"), allDay: false },
  ];
  assert.equal(irishDateKey(events[0].startAt), "2026-07-01");
  assert.equal(timetableEventsForIrishDay(events, new Date("2026-06-30T23:30:00Z")).length, 2);
  assert.equal(nextTimetableEvent(events, new Date("2026-07-01T10:00:00Z"))?.id, "b");
});
