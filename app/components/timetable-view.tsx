"use client";

import { useMemo, useState } from "react";

import { formatIrishCalendarDate, formatIrishTime, irishDateKey } from "@/lib/formatting";
import { timetableAgendaItems, timetableEventColour, type TimetableEventSummary } from "@/lib/timetable";

type TimetableDay = { key: string; label: string; shortLabel: string; dayNumber: string };

function EventCard({ event, current, next }: { event: TimetableEventSummary; current: boolean; next: boolean }) {
  const colour = timetableEventColour(event.title);
  return <article className={`timetable-event${current || next ? " timetable-event-current" : ""}`} style={{ borderLeftColor: colour }}><time>{event.allDay ? "All day" : `${formatIrishTime(event.startAt)}–${formatIrishTime(event.endAt)}`}</time><div><div className="timetable-event-title"><h3>{event.title}</h3>{(current || next) && <span>{current ? "Now" : "Next"}</span>}</div>{event.location && <p><span aria-hidden="true">⌖</span>{event.location}</p>}{event.description && <small>{event.description}</small>}</div></article>;
}

export function TimetableView({ days, events, todayKey, now }: { days: TimetableDay[]; events: TimetableEventSummary[]; todayKey: string; now: number }) {
  const initial = days.some((day) => day.key === todayKey) ? todayKey : days[0]?.key ?? todayKey;
  const [selected, setSelected] = useState(initial);
  const byDay = useMemo(() => events.reduce<Record<string, TimetableEventSummary[]>>((result, event) => { (result[irishDateKey(event.startAt)] ??= []).push(event); return result; }, {}), [events]);
  const selectedEvents = byDay[selected] ?? [];
  const nextId = events.filter((event) => event.status !== "CANCELLED" && event.startAt.getTime() > now).sort((left, right) => left.startAt.getTime() - right.startAt.getTime())[0]?.id;
  const eventCard = (event: TimetableEventSummary) => <EventCard key={event.id} event={event} current={event.startAt.getTime() <= now && event.endAt.getTime() > now} next={event.id === nextId} />;
  const agenda = (dayEvents: TimetableEventSummary[]) => timetableAgendaItems(dayEvents).map((item) => item.kind === "event" ? eventCard(item.event) : <div className="timetable-break" key={`break-${item.afterEventId}-${item.beforeEventId}`}><span>{item.label}</span></div>);

  return <><div className="timetable-week-desktop">{days.map((day) => <section className={day.key === todayKey ? "timetable-day timetable-day-today" : "timetable-day"} key={day.key}><header><div><span>{day.label}</span><strong>{formatIrishCalendarDate(day.key)}</strong></div>{day.key === todayKey && <em>Today</em>}</header>{byDay[day.key]?.length ? <div className="timetable-events">{agenda(byDay[day.key])}</div> : <p className="timetable-day-empty">No classes</p>}</section>)}</div><section className="timetable-week-mobile" aria-label="Weekly timetable"><div className="timetable-day-selector" role="tablist" aria-label="Choose a day">{days.map((day) => <button key={day.key} type="button" role="tab" aria-selected={selected === day.key} aria-controls="selected-timetable-day" onClick={() => setSelected(day.key)}><span>{day.shortLabel}</span><strong>{day.dayNumber}</strong>{day.key === todayKey && <small>Today</small>}</button>)}</div><div id="selected-timetable-day" role="tabpanel" className="selected-timetable-day"><header><span>{selected === todayKey ? "Today · " : ""}{formatIrishCalendarDate(selected)}</span><strong>{selectedEvents.length} {selectedEvents.length === 1 ? "class" : "classes"}</strong></header>{selectedEvents.length ? <div className="timetable-events">{agenda(selectedEvents)}</div> : <div className="empty-state"><h2>No classes</h2><p>Nothing is scheduled for this day.</p></div>}</div></section></>;
}
