import { irishDateKey } from "./formatting.ts";

export type TimetableEventSummary = {
  id: string;
  title: string;
  location: string | null;
  description?: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  status?: string;
};

export type TimetableDisplayState = "SYNC_ERROR" | "EVENTS" | "EMPTY_WEEK" | "EMPTY_FEED";
export type TimetableAgendaItem<T> = { kind: "event"; event: T } | { kind: "break"; minutes: number; label: string; afterEventId: string; beforeEventId: string };

export function formatTimetableBreak(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min break`;
  return `${hours}h${remainder ? ` ${remainder}m` : ""} break`;
}

export function timetableAgendaItems<T extends Pick<TimetableEventSummary, "id" | "startAt" | "endAt" | "status">>(events: T[]): TimetableAgendaItem<T>[] {
  const ordered = events.filter((event) => event.status !== "CANCELLED").slice().sort((left, right) => left.startAt.getTime() - right.startAt.getTime() || left.endAt.getTime() - right.endAt.getTime() || left.id.localeCompare(right.id));
  const items: TimetableAgendaItem<T>[] = [];
  let occupiedUntil = 0;
  ordered.forEach((event, index) => {
    const previous = ordered[index - 1];
    const minutes = Math.floor((event.startAt.getTime() - occupiedUntil) / 60_000);
    if (previous && minutes >= 30) items.push({ kind: "break", minutes, label: formatTimetableBreak(minutes), afterEventId: previous.id, beforeEventId: event.id });
    items.push({ kind: "event", event });
    occupiedUntil = Math.max(occupiedUntil, event.endAt.getTime());
  });
  return items;
}

export function timetableDisplayState(lastSyncedAt: Date | null, selectedWeekEventCount: number, importedEventCount: number): TimetableDisplayState {
  if (!lastSyncedAt) return "SYNC_ERROR";
  if (selectedWeekEventCount > 0) return "EVENTS";
  return importedEventCount > 0 ? "EMPTY_WEEK" : "EMPTY_FEED";
}

export function timetableEventsForIrishDay<T extends Pick<TimetableEventSummary, "startAt">>(events: T[], date: Date) {
  const key = irishDateKey(date);
  return events.filter((event) => irishDateKey(event.startAt) === key);
}

export function nextTimetableEvent<T extends Pick<TimetableEventSummary, "startAt" | "endAt">>(events: T[], now: Date) {
  return events.filter((event) => event.endAt.getTime() > now.getTime()).sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0] ?? null;
}

export function timetableCountdown(startAt: Date, now: Date) {
  const minutes = Math.max(0, Math.ceil((startAt.getTime() - now.getTime()) / 60_000));
  if (minutes === 0) return "In progress";
  if (minutes < 60) return `Starts in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `Starts in ${hours}h${remainder ? ` ${remainder}m` : ""}`;
}

export function timetableEventColour(title: string) {
  const colours = ["#6558d9", "#2d7f72", "#b66b2c", "#476ea8", "#9a4f78", "#54723d"];
  let hash = 0;
  for (const character of title) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return colours[Math.abs(hash) % colours.length];
}
