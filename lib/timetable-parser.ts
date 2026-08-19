import ical, { type ParameterValue, type VEvent } from "node-ical";

export type ParsedTimetableEvent = {
  externalUid: string;
  recurrenceKey: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  status: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
  sourceUpdatedAt: Date | null;
  sequence: number | null;
};

export const TIMETABLE_WINDOW_PAST_DAYS = 180;
export const TIMETABLE_WINDOW_FUTURE_DAYS = 540;
const MAX_EVENTS = 5_000;

function text(value: ParameterValue | undefined, maximum: number) {
  const raw = typeof value === "string" ? value : value?.val;
  const clean = raw?.replace(/\r\n?/g, "\n").trim();
  return clean ? clean.slice(0, maximum) : null;
}

function instanceKey(event: VEvent, start: Date, recurring: boolean) {
  if (!recurring) return "single";
  return event.recurrenceid?.toISOString() ?? start.toISOString();
}

export function timetableEventIdentity(event: Pick<ParsedTimetableEvent, "externalUid" | "recurrenceKey">) {
  return `${event.externalUid}\u0000${event.recurrenceKey}`;
}

export function timetableReconciliation(existing: Pick<ParsedTimetableEvent, "externalUid" | "recurrenceKey">[], incoming: Pick<ParsedTimetableEvent, "externalUid" | "recurrenceKey">[]) {
  const incomingKeys = new Set(incoming.map(timetableEventIdentity));
  return { retained: existing.filter((event) => incomingKeys.has(timetableEventIdentity(event))), removed: existing.filter((event) => !incomingKeys.has(timetableEventIdentity(event))) };
}

export function parseTimetableFeed(body: string, now = new Date()) {
  if (!body.includes("BEGIN:VCALENDAR") || !body.includes("END:VCALENDAR")) throw new Error("Not an iCalendar feed");
  const from = new Date(now.getTime() - TIMETABLE_WINDOW_PAST_DAYS * 86_400_000);
  const to = new Date(now.getTime() + TIMETABLE_WINDOW_FUTURE_DAYS * 86_400_000);
  const calendar = ical.sync.parseICS(body);
  const events = new Map<string, ParsedTimetableEvent>();

  for (const component of Object.values(calendar)) {
    if (!component || component.type !== "VEVENT" || !component.uid || !component.start) continue;
    const instances = ical.expandRecurringEvent(component, { from, to, includeOverrides: true, excludeExdates: true, expandOngoing: true });
    for (const instance of instances) {
      const externalUid = component.uid.slice(0, 500);
      const recurrenceKey = instanceKey(instance.event, instance.start, instance.isRecurring);
      const title = text(instance.summary, 300) ?? "Untitled class";
      const status = instance.event.status === "CANCELLED" || instance.event.status === "TENTATIVE" ? instance.event.status : "CONFIRMED";
      const parsed: ParsedTimetableEvent = {
        externalUid,
        recurrenceKey,
        title,
        description: text(instance.event.description, 4_000),
        location: text(instance.event.location, 500),
        startAt: new Date(instance.start),
        endAt: new Date(instance.end),
        allDay: instance.isFullDay,
        status,
        sourceUpdatedAt: instance.event.lastmodified ? new Date(instance.event.lastmodified) : null,
        sequence: Number.isInteger(instance.event.sequence) ? instance.event.sequence! : null,
      };
      if (!Number.isNaN(parsed.startAt.getTime()) && !Number.isNaN(parsed.endAt.getTime()) && parsed.endAt >= parsed.startAt) {
        events.set(timetableEventIdentity(parsed), parsed);
        if (events.size > MAX_EVENTS) throw new Error("Timetable feed contains too many events");
      }
    }
  }

  return [...events.values()].sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
}
