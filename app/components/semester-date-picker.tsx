"use client";

import { useId, useRef, useState } from "react";

const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function parseDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateValue(date: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - mondayOffset + 1, 12));
}

function displayDate(value: string) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" }) : "Select a date";
}

type DateField = "start" | "end";

export function SemesterDatePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  errors,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  errors?: { startDate?: string[]; endDate?: string[] };
}) {
  const startId = useId();
  const endId = useId();
  const startTriggerRef = useRef<HTMLButtonElement>(null);
  const endTriggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState<DateField | null>(null);
  const [startMonth, setStartMonth] = useState(() => monthFor(startDate));
  const [endMonth, setEndMonth] = useState(() => monthFor(endDate));

  function dateField(field: DateField) {
    const isStart = field === "start";
    const id = isStart ? startId : endId;
    const label = isStart ? "Start date" : "End date";
    const value = isStart ? startDate : endDate;
    const month = isStart ? startMonth : endMonth;
    const setMonth = isStart ? setStartMonth : setEndMonth;
    const setValue = isStart ? onStartDateChange : onEndDateChange;
    const fieldErrors = isStart ? errors?.startDate : errors?.endDate;
    const errorId = `${id}-error`;

    return <div className="picker-control"><label id={`${id}-label`} htmlFor={id}>{label}</label><input type="hidden" name={isStart ? "startDate" : "endDate"} value={value} /><button ref={isStart ? startTriggerRef : endTriggerRef} id={id} type="button" className="picker-trigger" aria-labelledby={`${id}-label ${id}-value`} aria-describedby={fieldErrors ? errorId : undefined} data-invalid={fieldErrors ? true : undefined} aria-expanded={open === field} aria-haspopup="dialog" onClick={() => setOpen(open === field ? null : field)}><span id={`${id}-value`}>{displayDate(value)}</span><span aria-hidden="true">▦</span></button>{open === field && <div className="picker-popover calendar-popover" role="dialog" aria-label={`Choose ${label.toLowerCase()}`}><div className="calendar-header"><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}>←</button><strong>{month.toLocaleDateString("en-IE", { month: "long", year: "numeric" })}</strong><button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}>→</button></div><div className="calendar-grid" role="grid">{weekdays.map((day) => <span className="weekday" key={day} role="columnheader">{day}</span>)}{calendarDays(month).map((day) => { const option = dateValue(day); const selected = option === value; const outside = day.getMonth() !== month.getMonth(); return <button type="button" role="gridcell" aria-selected={selected} className={`${selected ? "selected" : ""} ${outside ? "outside" : ""}`} key={option} onClick={() => { setValue(option); setMonth(new Date(day.getFullYear(), day.getMonth(), 1, 12)); setOpen(null); }}>{day.getDate()}</button>; })}</div></div>}{fieldErrors?.[0] && <p className="field-error" id={errorId} role="alert">{fieldErrors[0]}</p>}</div>;
  }

  return <fieldset className="due-picker semester-date-picker" onKeyDown={(event) => { if (event.key === "Escape" && open) { event.preventDefault(); const trigger = open === "start" ? startTriggerRef.current : endTriggerRef.current; setOpen(null); requestAnimationFrame(() => trigger?.focus()); } }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(null); }}><legend>Semester dates</legend><div className="due-picker-fields">{dateField("start")}{dateField("end")}</div></fieldset>;
}

function monthFor(value: string) {
  const date = parseDate(value) ?? new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}
