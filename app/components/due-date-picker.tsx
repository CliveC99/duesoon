"use client";

import { useEffect, useId, useRef, useState } from "react";

const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const timeOptions = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

function localParts(value?: Date) {
  if (!value) return { date: "", time: "17:00" };
  const pad = (part: number) => String(part).padStart(2, "0");
  return { date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`, time: `${pad(value.getHours())}:${pad(value.getMinutes())}` };
}

function parseLocalDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function dateValue(date: Date) { return localParts(date).date; }

function dateFromOffset(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function toIso(date: string, time: string) {
  if (!date || !time) return "";
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  return Number.isNaN(localDate.getTime()) ? "" : localDate.toISOString();
}

function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - mondayOffset + 1, 12));
}

function timeLabel(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-IE", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(2000, 0, 1, hour, minute));
}

export function DueDatePicker({ initialValue, disabled = false }: { initialValue?: Date; disabled?: boolean }) {
  const initial = localParts(initialValue);
  const initialDate = parseLocalDate(initial.date) ?? new Date();
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [month, setMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1, 12));
  const [open, setOpen] = useState<"date" | "time" | null>(null);
  const selectedTimeRef = useRef<HTMLButtonElement>(null);
  const dateId = useId();
  const timeId = useId();
  const isoValue = toIso(date, time);
  const selectedDate = parseLocalDate(date);
  const readable = isoValue ? new Intl.DateTimeFormat("en-IE", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(isoValue)) : "Choose a date and time";

  useEffect(() => {
    if (open === "time") selectedTimeRef.current?.scrollIntoView({ block: "center" });
  }, [open]);

  function chooseDate(chosen: Date) {
    setDate(dateValue(chosen));
    setMonth(new Date(chosen.getFullYear(), chosen.getMonth(), 1, 12));
    setOpen(null);
  }

  function shortcut(offset: number) { chooseDate(dateFromOffset(offset)); }

  return (
    <><input type="hidden" name="dueAt" value={isoValue} /><fieldset className="due-picker" disabled={disabled} onKeyDown={(event) => { if (event.key === "Escape") setOpen(null); }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(null); }}>
      <legend>Due date and time</legend>
      <div className="due-picker-fields">
        <div className="picker-control">
          <label id={`${dateId}-label`} htmlFor={dateId}>Date</label>
          <button id={dateId} type="button" className="picker-trigger" aria-labelledby={`${dateId}-label ${dateId}-value`} aria-expanded={open === "date"} aria-haspopup="dialog" onClick={() => setOpen(open === "date" ? null : "date")}><span id={`${dateId}-value`}>{selectedDate ? selectedDate.toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" }) : "Select a date"}</span><span aria-hidden="true">▦</span></button>
          {open === "date" && <div className="picker-popover calendar-popover" role="dialog" aria-label="Choose due date">
            <div className="calendar-header"><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}>←</button><strong>{month.toLocaleDateString("en-IE", { month: "long", year: "numeric" })}</strong><button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}>→</button></div>
            <div className="calendar-grid" role="grid">{weekdays.map((day) => <span className="weekday" key={day} role="columnheader">{day}</span>)}{calendarDays(month).map((day) => { const value = dateValue(day); const selected = value === date; const outside = day.getMonth() !== month.getMonth(); return <button type="button" role="gridcell" aria-selected={selected} className={`${selected ? "selected" : ""} ${outside ? "outside" : ""}`} key={value} onClick={() => chooseDate(day)}>{day.getDate()}</button>; })}</div>
          </div>}
        </div>
        <div className="picker-control">
          <label id={`${timeId}-label`} htmlFor={timeId}>Time</label>
          <button id={timeId} type="button" className="picker-trigger" aria-labelledby={`${timeId}-label ${timeId}-value`} aria-expanded={open === "time"} aria-haspopup="listbox" onClick={() => setOpen(open === "time" ? null : "time")}><span id={`${timeId}-value`}>{timeLabel(time)}</span><span aria-hidden="true">⌄</span></button>
          {open === "time" && <div className="picker-popover time-popover" role="listbox" aria-label="Choose due time">{timeOptions.map((option) => <button ref={option === time ? selectedTimeRef : undefined} type="button" role="option" aria-selected={option === time} className={option === time ? "selected" : ""} key={option} onClick={() => { setTime(option); setOpen(null); }}>{timeLabel(option)}</button>)}</div>}
        </div>
      </div>
      <div className="date-shortcuts" aria-label="Quick due date choices"><span>Quick select</span><button type="button" onClick={() => shortcut(0)}>Today</button><button type="button" onClick={() => shortcut(1)}>Tomorrow</button><button type="button" onClick={() => shortcut(7)}>In 1 week</button><button type="button" onClick={() => shortcut(14)}>In 2 weeks</button></div>
      <output className="due-summary" aria-live="polite"><span aria-hidden="true">✓</span><div><small>Selected deadline</small><strong suppressHydrationWarning>{readable}</strong></div></output>
    </fieldset></>
  );
}
