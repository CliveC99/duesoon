"use client";

import type { DeadlineStatus, DeadlineType } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";

import { formatEnum, formatIrishCalendarDate, formatIrishTime } from "@/lib/formatting";
import { gridDateKey } from "@/lib/calendar";
import { calendarDaysUntil, deadlineUrgency } from "@/lib/reminders";
import { timetableEventColour } from "@/lib/timetable";

type CalendarDeadline = {
  id: string;
  title: string;
  type: DeadlineType;
  dueAt: Date;
  status: DeadlineStatus;
  examLocation: string | null;
  module: { name: string; code: string | null; colour: string; semesterId: string | null };
};

type CalendarTimetableEvent = { id: string; title: string; location: string | null; startAt: Date; endAt: Date; allDay: boolean };

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const activeStatuses: DeadlineStatus[] = ["NOT_STARTED", "IN_PROGRESS"];

export function MonthCalendar({
  days,
  deadlinesByDate,
  timetableEventsByDate,
  monthKey,
  activeSemesterId,
  todayKey,
  now,
}: {
  days: Date[];
  deadlinesByDate: Record<string, CalendarDeadline[]>;
  timetableEventsByDate: Record<string, CalendarTimetableEvent[]>;
  monthKey: string;
  activeSemesterId: string | null;
  todayKey: string;
  now: number;
}) {
  const agendaDates = [...new Set([...Object.keys(deadlinesByDate), ...Object.keys(timetableEventsByDate)])].filter((key) => key.startsWith(monthKey)).sort();
  const [mobileView, setMobileView] = useState<"month" | "agenda">("month");
  const [selectedDate, setSelectedDate] = useState(todayKey.startsWith(monthKey) ? todayKey : agendaDates[0] ?? `${monthKey}-01`);

  function deadlineLink(deadline: CalendarDeadline, compact = false) {
    const overdue = activeStatuses.includes(deadline.status) && deadline.dueAt.getTime() < now;
    const finished = deadline.status === "SUBMITTED" || deadline.status === "COMPLETED";
    const outsideActiveSemester = Boolean(activeSemesterId && deadline.module.semesterId !== activeSemesterId);
    const urgency = deadlineUrgency(deadline.dueAt, new Date(now));
    const dueSoon = activeStatuses.includes(deadline.status) && calendarDaysUntil(deadline.dueAt, new Date(now)) <= 3;
    const status = overdue || dueSoon ? urgency : formatEnum(deadline.status);
    return <Link className={`calendar-event status-${deadline.status.toLowerCase().replaceAll("_", "-")}${deadline.type === "EXAM" ? " calendar-exam-event" : ""}${overdue ? " calendar-event-overdue" : ""}${finished ? " calendar-event-finished" : ""}${outsideActiveSemester ? " calendar-event-other-semester" : ""}`} href={`/deadlines/${deadline.id}/edit`} key={deadline.id} style={{ borderLeftColor: deadline.module.colour }} aria-label={`${deadline.type === "EXAM" ? "Exam, " : ""}${deadline.title}, ${deadline.module.name}, ${formatIrishTime(deadline.dueAt)}${deadline.examLocation ? `, ${deadline.examLocation}` : ""}, ${status}`}><strong>{deadline.type === "EXAM" ? `EXAM · ${deadline.title}` : deadline.title}</strong><span className="calendar-event-module"><i style={{ backgroundColor: deadline.module.colour }} />{deadline.module.code || deadline.module.name}</span><small>{formatIrishTime(deadline.dueAt)}{deadline.type === "EXAM" && deadline.examLocation ? ` · ${deadline.examLocation}` : ` · ${formatEnum(deadline.type)}`}</small><em>{status}</em>{compact && <span className="calendar-event-mobile-module">{deadline.module.name}</span>}</Link>;
  }

  function timetableCard(event: CalendarTimetableEvent, compact = false) {
    return <article className="calendar-event calendar-class-event" key={`class-${event.id}`} style={{ borderLeftColor: timetableEventColour(event.title) }} aria-label={`${event.title}, class, ${event.allDay ? "all day" : `${formatIrishTime(event.startAt)} to ${formatIrishTime(event.endAt)}`}${event.location ? `, ${event.location}` : ""}`}><strong>{event.title}</strong><span className="calendar-event-module"><i aria-hidden="true" />Class{event.location ? ` · ${event.location}` : ""}</span><small>{event.allDay ? "All day" : `${formatIrishTime(event.startAt)}–${formatIrishTime(event.endAt)}`}</small><em>Class</em>{compact && event.location && <span className="calendar-event-mobile-module">{event.location}</span>}</article>;
  }

  function combinedEvents(key: string, compact = false) {
    return [
      ...(deadlinesByDate[key] ?? []).map((deadline) => ({ at: deadline.dueAt.getTime(), node: deadlineLink(deadline, compact) })),
      ...(timetableEventsByDate[key] ?? []).map((event) => ({ at: event.startAt.getTime(), node: timetableCard(event, compact) })),
    ].sort((left, right) => left.at - right.at).map((item) => item.node);
  }

  const selectedDeadlines = deadlinesByDate[selectedDate] ?? [];
  const selectedClasses = timetableEventsByDate[selectedDate] ?? [];

  return <><section className="calendar-desktop" aria-label="Monthly calendar"><div className="calendar-weekdays">{weekdays.map((day) => <div key={day}>{day}</div>)}</div><div className="calendar-month-grid">{days.map((day) => { const key = gridDateKey(day); const outside = !key.startsWith(monthKey); return <div className={`calendar-day${outside ? " calendar-day-outside" : ""}${key === todayKey ? " calendar-day-today" : ""}`} key={key}><div className="calendar-day-number"><span>{day.getUTCDate()}</span>{key === todayKey && <small>Today</small>}</div><div className="calendar-day-events">{combinedEvents(key)}</div></div>; })}</div></section><section className="calendar-mobile" aria-label="Mobile calendar"><div className="calendar-view-toggle" aria-label="Calendar view"><button type="button" className={mobileView === "month" ? "active" : ""} aria-pressed={mobileView === "month"} onClick={() => setMobileView("month")}>Month</button><button type="button" className={mobileView === "agenda" ? "active" : ""} aria-pressed={mobileView === "agenda"} onClick={() => setMobileView("agenda")}>Agenda</button></div>{mobileView === "month" ? <><div className="mobile-month-calendar"><div className="mobile-calendar-weekdays">{weekdays.map((day) => <span key={day}>{day.slice(0, 2)}</span>)}</div><div className="mobile-calendar-grid">{days.map((day) => { const key = gridDateKey(day); const deadlineCount = deadlinesByDate[key]?.length ?? 0; const classCount = timetableEventsByDate[key]?.length ?? 0; const count = deadlineCount + classCount; const outside = !key.startsWith(monthKey); return <button type="button" className={`${outside ? "outside" : ""}${key === todayKey ? " today" : ""}${key === selectedDate ? " selected" : ""}`} key={key} aria-label={`${formatIrishCalendarDate(key)}, ${deadlineCount} ${deadlineCount === 1 ? "deadline" : "deadlines"}, ${classCount} ${classCount === 1 ? "class" : "classes"}`} aria-pressed={key === selectedDate} onClick={() => setSelectedDate(key)}><span>{day.getUTCDate()}</span>{count > 0 && <i aria-hidden="true" />}</button>; })}</div></div><section className="selected-day-panel" aria-live="polite"><div className="selected-day-heading"><h3>{formatIrishCalendarDate(selectedDate)}</h3>{selectedDate === todayKey && <span>Today</span>}</div>{selectedDeadlines.length || selectedClasses.length ? <div className="agenda-events">{combinedEvents(selectedDate, true)}</div> : <div className="selected-day-empty"><p>No deadlines or classes on this date.</p></div>}</section></> : <div className="calendar-agenda">{agendaDates.length ? agendaDates.map((key) => <section className="agenda-day" key={key}><div className="agenda-date"><strong>{formatIrishCalendarDate(key)}</strong>{key === todayKey && <span>Today</span>}</div><div className="agenda-events">{combinedEvents(key, true)}</div></section>) : <div className="calendar-empty"><h2>No events this month</h2><p>There are no deadlines or classes scheduled for this month.</p></div>}</div>}</section></>;
}
