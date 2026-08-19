import type { Metadata } from "next";
import Link from "next/link";

import { TimetableConnectionForm, TimetableSyncForm, DisconnectTimetable } from "@/app/components/timetable-forms";
import { TimetableView } from "@/app/components/timetable-view";
import { ManageShell } from "@/app/components/manage-shell";
import { connectTimetable, disconnectTimetable, syncTimetable } from "@/app/timetable-actions";
import { auth } from "@/auth";
import { formatIrishDate, formatIrishTime, irishDateKey } from "@/lib/formatting";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { timetableDisplayState } from "@/lib/timetable";

export const metadata: Metadata = { title: "Timetable" };

function weekDays(now: Date) {
  const date = new Date(Date.UTC(Number(irishDateKey(now).slice(0, 4)), Number(irishDateKey(now).slice(5, 7)) - 1, Number(irishDateKey(now).slice(8, 10))));
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date.getTime() + (index - mondayOffset) * 86_400_000);
    const key = day.toISOString().slice(0, 10);
    return { key, label: day.toLocaleDateString("en-IE", { weekday: "long", timeZone: "UTC" }), shortLabel: day.toLocaleDateString("en-IE", { weekday: "short", timeZone: "UTC" }).slice(0, 3).toUpperCase(), dayNumber: String(day.getUTCDate()) };
  });
}

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ week?: string | string[] }> }) {
  const userId = await requireUserId();
  const now = new Date();
  const query = await searchParams;
  const weekValue = Array.isArray(query.week) ? query.week[0] : query.week;
  const weekReference = weekValue && /^\d{4}-\d{2}-\d{2}$/.test(weekValue) && !Number.isNaN(new Date(`${weekValue}T12:00:00.000Z`).getTime()) ? new Date(`${weekValue}T12:00:00.000Z`) : now;
  const days = weekDays(weekReference);
  const previousWeek = new Date(new Date(`${days[0].key}T12:00:00.000Z`).getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
  const nextWeek = new Date(new Date(`${days[0].key}T12:00:00.000Z`).getTime() + 7 * 86_400_000).toISOString().slice(0, 10);
  const queryStart = new Date(new Date(`${days[0].key}T00:00:00.000Z`).getTime() - 86_400_000);
  const queryEnd = new Date(new Date(`${days[6].key}T00:00:00.000Z`).getTime() + 2 * 86_400_000);
  const [session, source, events, importedEventCount] = await Promise.all([
    auth(),
    prisma.timetableSource.findUnique({ where: { userId }, select: { lastSyncedAt: true, lastSyncStatus: true, lastSyncErrorSafe: true } }),
    prisma.timetableEvent.findMany({ where: { userId, status: { not: "CANCELLED" }, startAt: { gte: queryStart, lt: queryEnd } }, select: { id: true, title: true, description: true, location: true, startAt: true, endAt: true, allDay: true }, orderBy: { startAt: "asc" } }),
    prisma.timetableEvent.count({ where: { userId, status: { not: "CANCELLED" } } }),
  ]);

  const displayState = source ? timetableDisplayState(source.lastSyncedAt, events.length, importedEventCount) : null;
  const latestSyncFailed = source?.lastSyncStatus === "FAILED";
  const timetableBody = displayState === "SYNC_ERROR"
    ? <section className="timetable-sync-error"><p className="eyebrow">Sync unsuccessful</p><h2>Timetable couldn’t be synced</h2><p>We couldn’t load classes from your timetable feed. Check the connection and try syncing again.</p></section>
    : <><nav className="timetable-week-navigation" aria-label="Timetable week"><Link href={`/timetable?week=${previousWeek}`} aria-label="Previous week">←</Link><strong>{formatIrishDate(new Date(`${days[0].key}T12:00:00.000Z`))} – {formatIrishDate(new Date(`${days[6].key}T12:00:00.000Z`))}</strong><div><Link href="/timetable">Today</Link><Link href={`/timetable?week=${nextWeek}`} aria-label="Next week">→</Link></div></nav>{displayState === "EVENTS" ? <TimetableView days={days} events={events} todayKey={irishDateKey(now)} now={now.getTime()} /> : displayState === "EMPTY_FEED" ? <div className="empty-state timetable-empty"><h2>No classes published yet</h2><p>Your timetable synced successfully, but no classes are currently available.</p></div> : <div className="empty-state timetable-empty"><h2>No classes in this week</h2><p>Your imported timetable has no classes during the selected week.</p></div>}</>;

  return <ManageShell user={session!.user!} title="Timetable" description="Your live college timetable, kept separate from deadlines and synced when you choose.">{!source ? <div className="timetable-connect-layout"><section className="form-card"><p className="eyebrow">Connect timetable</p><h2>Bring your weekly classes into DueSoon</h2><p className="timetable-lead">Paste the private iCal subscription URL supplied by your college. DueSoon will fetch it securely and keep a local timetable copy.</p><TimetableConnectionForm action={connectTimetable} /></section><aside className="timetable-privacy"><strong>Private by design</strong><p>The saved URL is encrypted and never shown again. Syncing happens only when you connect or select Sync now.</p></aside></div> : <><section className="timetable-status"><div><p className="eyebrow">Live iCal connection</p><h2>{latestSyncFailed ? source.lastSyncedAt ? "Latest refresh failed" : "Timetable couldn’t be synced" : source.lastSyncedAt ? "Timetable connected" : "Ready to sync"}</h2><p>{source.lastSyncedAt ? `Last successful sync: ${formatIrishDate(source.lastSyncedAt)} at ${formatIrishTime(source.lastSyncedAt)}` : "No successful sync yet."}</p>{source.lastSyncErrorSafe && <span role="status">{source.lastSyncErrorSafe} — Try again. {source.lastSyncedAt && "Previously imported classes are still shown below."}</span>}</div><div className="timetable-status-actions"><TimetableSyncForm action={syncTimetable} /><DisconnectTimetable action={disconnectTimetable} /></div></section>{timetableBody}<details className="timetable-replace"><summary>Replace timetable feed</summary><div className="form-card"><TimetableConnectionForm action={connectTimetable} replacing /></div></details></>}</ManageShell>;
}
