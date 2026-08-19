"use client";

import type { DeadlineStatus, DeadlineType } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";

import { formatEnum, formatIrishCalendarDate, formatIrishTime } from "@/lib/formatting";
import { gridDateKey } from "@/lib/calendar";

type CalendarDeadline = {
  id: string;
  title: string;
  type: DeadlineType;
  dueAt: Date;
  status: DeadlineStatus;
  module: { name: string; code: string | null; colour: string; semesterId: string | null };
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const activeStatuses: DeadlineStatus[] = ["NOT_STARTED", "IN_PROGRESS"];

export function MonthCalendar({
  days,
  deadlinesByDate,
  monthKey,
  activeSemesterId,
  todayKey,
  now,
}: {
  days: Date[];
  deadlinesByDate: Record<string, CalendarDeadline[]>;
  monthKey: string;
  activeSemesterId: string | null;
  todayKey: string;
  now: number;
}) {
  const agendaDates = Object.keys(deadlinesByDate).filter((key) => key.startsWith(monthKey)).sort();
  const [mobileView, setMobileView] = useState<"month" | "agenda">("month");
  const [selectedDate, setSelectedDate] = useState(todayKey.startsWith(monthKey) ? todayKey : agendaDates[0] ?? `${monthKey}-01`);

  function deadlineLink(deadline: CalendarDeadline, compact = false) {
    const overdue = activeStatuses.includes(deadline.status) && deadline.dueAt.getTime() < now;
    const finished = deadline.status === "SUBMITTED" || deadline.status === "COMPLETED";
    const outsideActiveSemester = Boolean(activeSemesterId && deadline.module.semesterId !== activeSemesterId);
    const status = overdue ? "Overdue" : formatEnum(deadline.status);
    return <Link className={`calendar-event status-${deadline.status.toLowerCase().replaceAll("_", "-")}${overdue ? " calendar-event-overdue" : ""}${finished ? " calendar-event-finished" : ""}${outsideActiveSemester ? " calendar-event-other-semester" : ""}`} href={`/deadlines/${deadline.id}/edit`} key={deadline.id} style={{ borderLeftColor: deadline.module.colour }} aria-label={`${deadline.title}, ${deadline.module.name}, ${formatIrishTime(deadline.dueAt)}, ${status}`}><strong>{deadline.title}</strong><span className="calendar-event-module"><i style={{ backgroundColor: deadline.module.colour }} />{deadline.module.code || deadline.module.name}</span><small>{formatIrishTime(deadline.dueAt)} · {formatEnum(deadline.type)}</small><em>{status}</em>{compact && <span className="calendar-event-mobile-module">{deadline.module.name}</span>}</Link>;
  }

  const selectedDeadlines = deadlinesByDate[selectedDate] ?? [];

  return <><section className="calendar-desktop" aria-label="Monthly deadline calendar"><div className="calendar-weekdays">{weekdays.map((day) => <div key={day}>{day}</div>)}</div><div className="calendar-month-grid">{days.map((day) => { const key = gridDateKey(day); const deadlines = deadlinesByDate[key] ?? []; const outside = !key.startsWith(monthKey); return <div className={`calendar-day${outside ? " calendar-day-outside" : ""}${key === todayKey ? " calendar-day-today" : ""}`} key={key}><div className="calendar-day-number"><span>{day.getUTCDate()}</span>{key === todayKey && <small>Today</small>}</div><div className="calendar-day-events">{deadlines.map((deadline) => deadlineLink(deadline))}</div></div>; })}</div></section><section className="calendar-mobile" aria-label="Mobile deadline calendar"><div className="calendar-view-toggle" aria-label="Calendar view"><button type="button" className={mobileView === "month" ? "active" : ""} aria-pressed={mobileView === "month"} onClick={() => setMobileView("month")}>Month</button><button type="button" className={mobileView === "agenda" ? "active" : ""} aria-pressed={mobileView === "agenda"} onClick={() => setMobileView("agenda")}>Agenda</button></div>{mobileView === "month" ? <><div className="mobile-month-calendar"><div className="mobile-calendar-weekdays">{weekdays.map((day) => <span key={day}>{day.slice(0, 2)}</span>)}</div><div className="mobile-calendar-grid">{days.map((day) => { const key = gridDateKey(day); const count = deadlinesByDate[key]?.length ?? 0; const outside = !key.startsWith(monthKey); return <button type="button" className={`${outside ? "outside" : ""}${key === todayKey ? " today" : ""}${key === selectedDate ? " selected" : ""}`} key={key} aria-label={`${formatIrishCalendarDate(key)}${count ? `, ${count} ${count === 1 ? "deadline" : "deadlines"}` : ", no deadlines"}`} aria-pressed={key === selectedDate} onClick={() => setSelectedDate(key)}><span>{day.getUTCDate()}</span>{count > 0 && <i aria-hidden="true" />}</button>; })}</div></div><section className="selected-day-panel" aria-live="polite"><div className="selected-day-heading"><h3>{formatIrishCalendarDate(selectedDate)}</h3>{selectedDate === todayKey && <span>Today</span>}</div>{selectedDeadlines.length ? <div className="agenda-events">{selectedDeadlines.map((deadline) => deadlineLink(deadline, true))}</div> : <div className="selected-day-empty"><p>No deadlines on this date.</p></div>}</section></> : <div className="calendar-agenda">{agendaDates.length ? agendaDates.map((key) => <section className="agenda-day" key={key}><div className="agenda-date"><strong>{formatIrishCalendarDate(key)}</strong>{key === todayKey && <span>Today</span>}</div><div className="agenda-events">{deadlinesByDate[key].map((deadline) => deadlineLink(deadline, true))}</div></section>) : <div className="calendar-empty"><h2>No deadlines this month</h2><p>There is nothing scheduled for this month yet.</p></div>}</div>}</section></>;
}
