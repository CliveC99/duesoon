"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type ReminderItem = {
  id: string;
  title: string;
  moduleLabel: string;
  urgency: string;
  time: string;
  overdue: boolean;
};

export function NotificationCentre({ reminders }: { reminders: ReminderItem[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const countLabel = `${reminders.length} ${reminders.length === 1 ? "reminder" : "reminders"}`;
  return <div className="notification-centre" ref={containerRef}><button ref={triggerRef} className="notification-trigger" type="button" aria-label={`${countLabel}. Open reminders`} aria-expanded={open} aria-controls="notification-panel" onClick={() => setOpen((value) => !value)}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>{reminders.length > 0 && <span aria-hidden="true">{reminders.length > 9 ? "9+" : reminders.length}</span>}</button>{open && <section className="notification-panel" id="notification-panel" aria-label="Deadline reminders"><div className="notification-heading"><div><strong>Reminders</strong><span>{countLabel}</span></div><button type="button" onClick={() => setOpen(false)} aria-label="Close reminders">×</button></div>{reminders.length ? <div className="notification-list">{reminders.map((reminder) => <Link href={`/deadlines/${reminder.id}/edit`} key={reminder.id} className={reminder.overdue ? "notification-overdue" : ""} onClick={() => setOpen(false)}><span className="notification-dot" aria-hidden="true" /><span><strong>{reminder.title}</strong><small>{reminder.moduleLabel}</small><em>{reminder.urgency}{reminder.overdue ? "" : ` at ${reminder.time}`}</em></span><b aria-hidden="true">→</b></Link>)}</div> : <div className="notification-empty"><strong>You’re all caught up</strong><p>No configured deadline reminders need your attention.</p></div>}</section>}</div>;
}
