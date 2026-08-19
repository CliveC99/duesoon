import type { User } from "next-auth";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeadlineStatus, DeadlineType } from "@prisma/client";

import { updateDeadlineStatus } from "@/app/data-actions";
import { signOutUser } from "@/app/auth-actions";
import { DeadlineStatusControl } from "@/app/components/deadline-controls";
import { MobileNavigation } from "@/app/components/mobile-navigation";
import { UserReminderCentre } from "@/app/components/user-reminder-centre";
import { auth } from "@/auth";
import { formatEnum, formatIrishDate, formatIrishDateParts, formatIrishTime } from "@/lib/formatting";
import { calendarDaysUntil, deadlineUrgency } from "@/lib/reminders";

export const metadata: Metadata = {
  title: "Home",
};

type IconName = "calendar" | "clock" | "grid" | "plus" | "sparkles" | "trend";

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    calendar: <><path d="M6 2v3M14 2v3M3 8h14M5 4h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M7 12h2M11 12h2M7 15h2" /></>,
    clock: <><circle cx="10" cy="10" r="8" /><path d="M10 6v4l3 2" /></>,
    grid: <><rect x="3" y="3" width="5" height="5" rx="1" /><rect x="12" y="3" width="5" height="5" rx="1" /><rect x="3" y="12" width="5" height="5" rx="1" /><rect x="12" y="12" width="5" height="5" rx="1" /></>,
    plus: <path d="M10 4v12M4 10h12" />,
    sparkles: <><path d="m10 2 1.2 3.5L15 7l-3.8 1.5L10 12 8.8 8.5 5 7l3.8-1.5L10 2Z" /><path d="m16 12 .7 2.1L19 15l-2.3.9L16 18l-.7-2.1L13 15l2.3-.9L16 12Z" /></>,
    trend: <><path d="m3 14 4-4 3 3 6-7" /><path d="M12 6h4v4" /></>,
  };
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export type DashboardDeadline = { id: string; title: string; type: DeadlineType; dueAt: Date; weighting: number | null; status: DeadlineStatus; notes: string | null; module: { name: string; code: string | null; colour: string } };
export type SemesterOverview = { id: string; name: string; academicYear: string; startDate: Date; endDate: Date; phase: string; progress: number };

function ModuleTag({ children, colour }: { children: React.ReactNode; colour?: string }) {
  return <span className="module-tag" style={colour ? { color: colour, backgroundColor: `${colour}18`, border: `1px solid ${colour}35` } : undefined}>{children}</span>;
}

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return <div className="countdown-unit"><strong>{value}</strong><span>{label}</span></div>;
}

function DeadlineRow({ item, renderedAt, finished = false }: { item: DashboardDeadline; renderedAt: number; finished?: boolean }) {
  const date = formatIrishDateParts(item.dueAt);
  const now = new Date(renderedAt);
  const urgency = deadlineUrgency(item.dueAt, now);
  const overdue = item.dueAt.getTime() < renderedAt;
  const dueSoon = !overdue && calendarDaysUntil(item.dueAt, now) <= 7;
  return (
    <article className={`deadline-row${finished ? " deadline-row-finished" : ""}${overdue && !finished ? " deadline-row-overdue" : ""}${dueSoon && !finished ? " deadline-row-urgent" : ""}`}>
      <div className="date-tile"><strong>{date.day}</strong><span>{date.month}</span></div>
      <div className="deadline-copy">
        <div className="flex flex-wrap items-center gap-2.5"><h3>{item.title}</h3><ModuleTag colour={item.module.colour}>{item.module.code || item.module.name}</ModuleTag></div>
        <p>{formatEnum(item.type)} · {formatIrishDate(item.dueAt)} at {formatIrishTime(item.dueAt)}</p>{!finished && <span className={`urgency-label${overdue ? " urgency-overdue" : dueSoon ? " urgency-soon" : ""}`}>{urgency}</span>}
      </div>
      <div className="deadline-meta"><span>{item.weighting == null ? "No weighting" : `${item.weighting}% weighting`}</span><DeadlineStatusControl id={item.id} status={item.status} action={updateDeadlineStatus} /></div>
      <div className="row-actions"><Link href={`/deadlines/${item.id}/edit`}>Edit</Link></div>
    </article>
  );
}

function initials(user: User) {
  const source = user.name?.trim() || user.email?.split("@")[0] || "Student";
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function DashboardView({ user, activeDeadlines, recentDeadlines, deadlineCount, completedCount, moduleCount, semester, renderedAt }: { user: User; activeDeadlines: DashboardDeadline[]; recentDeadlines: DashboardDeadline[]; deadlineCount: number; completedCount: number; moduleCount: number; semester: SemesterOverview | null; renderedAt: number }) {
  const displayName = user.name?.trim() || "Student";
  const next = activeDeadlines[0];
  const overdue = next ? next.dueAt.getTime() < renderedAt : false;
  const remainingMs = next ? Math.max(0, next.dueAt.getTime() - renderedAt) : 0;
  const remainingDays = Math.floor(remainingMs / 86400000);
  const remainingHours = Math.floor((remainingMs % 86400000) / 3600000);
  const remainingMinutes = Math.floor((remainingMs % 3600000) / 60000);

  return (
    <div className="min-h-screen">
      <header className="site-header">
        <div className="shell flex h-16 items-center justify-between">
          <a className="brand" href="/dashboard" aria-label="DueSoon home"><span className="brand-mark"><Icon name="clock" className="size-[18px]" /></span><span>DueSoon</span></a>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            <a className="nav-link nav-active" href="#overview"><Icon name="grid" />Overview</a>
            <a className="nav-link" href="#deadlines"><Icon name="calendar" />Deadlines</a>
            <Link className="nav-link" href="/calendar"><Icon name="calendar" />Calendar</Link>
            <Link className="nav-link" href="/semesters"><Icon name="clock" />Semesters</Link>
          </nav>
          <div className="header-end"><UserReminderCentre /><div className="desktop-header-actions">
            <Link className="add-button" href="/deadlines/new"><Icon name="plus" className="size-4" /><span>Add deadline</span></Link>
            <div className="account-area">
              <div className="account-copy"><strong>{displayName}</strong><form action={signOutUser}><button>Sign out</button></form></div>
              <div className="avatar" aria-label={`${displayName}'s account`}>{initials(user)}</div>
            </div>
          </div><MobileNavigation /></div>
        </div>
      </header>

      <main id="overview" className="shell py-8 sm:py-11">
        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="eyebrow">{semester ? `${semester.name} · ${semester.academicYear} · ${semester.phase}` : "No active semester"}</p><h1>Good morning, {displayName.split(" ")[0]}.</h1><p className="intro">Here’s what’s coming up across your modules.</p></div>
          {semester ? <Link className="semester-pill" href="/semesters" aria-label="Manage semesters"><span><Icon name="trend" /></span><div><strong>{completedCount} of {deadlineCount} complete</strong><small>{semester.progress}% through semester</small></div></Link> : <Link className="semester-pill semester-setup" href="/semesters/new"><span><Icon name="plus" /></span><div><strong>Set up your semester</strong><small>Add dates to track week and progress</small></div></Link>}
        </section>

        {next ? <section className="next-card" aria-labelledby="next-deadline-title">
          <div className="next-copy">
            <div className="next-label"><span><Icon name="sparkles" className="size-4" /></span>Next deadline</div>
            <div className="mt-8 flex flex-wrap items-center gap-3"><ModuleTag colour={next.module.colour}>{next.module.code || next.module.name}</ModuleTag><span className="type-label">{formatEnum(next.type)}</span></div>
            <h2 id="next-deadline-title">{next.title}</h2>
            <p>{next.notes || `Your next ${formatEnum(next.type).toLowerCase()} for ${next.module.name}.`}</p>
            <div className="due-line"><Icon name="calendar" /><strong>Due {formatIrishDate(next.dueAt)}</strong><span>at {formatIrishTime(next.dueAt)}</span></div>
            <div className="progress-label"><span>Status</span><strong>{formatEnum(next.status)}{next.weighting == null ? "" : ` · ${next.weighting}% weighting`}</strong></div><div className="progress-track"><span /></div>
          </div>
          <div className="countdown-panel"><p>Time remaining</p><div className="countdown"><CountdownUnit value={String(remainingDays).padStart(2, "0")} label="Days" /><b>:</b><CountdownUnit value={String(remainingHours).padStart(2, "0")} label="Hours" /><b>:</b><CountdownUnit value={String(remainingMinutes).padStart(2, "0")} label="Mins" /></div><div className="urgency"><span />{deadlineUrgency(next.dueAt, new Date(renderedAt))}{overdue ? " — needs attention" : ""}</div></div>
        </section> : deadlineCount > 0 ? <section className="empty-state dashboard-empty finished-state"><h2>You’re all caught up</h2><p>There are no active deadlines needing attention right now.</p><Link className="add-button" href="/deadlines/new">Add deadline</Link></section> : <section className="empty-state dashboard-empty"><h2>No deadlines yet</h2><p>Add a module and your first deadline to start planning your semester.</p><div><Link className="add-button" href="/deadlines/new">Add deadline</Link><Link className="secondary-button" href="/modules">Manage modules</Link></div></section>}

        <section id="deadlines" className="mt-10">
          <div className="section-heading"><div><h2>Upcoming deadlines</h2><p>Your next assessments, ordered by due date.</p></div><Link className="view-button" href="/deadlines/new">Add new <span>→</span></Link></div>
          {activeDeadlines.length ? <div className="deadline-list">{activeDeadlines.map((item) => <DeadlineRow key={item.id} item={item} renderedAt={renderedAt} />)}</div> : <div className="deadline-list-empty">Nothing currently needs attention.</div>}
        </section>

        {recentDeadlines.length > 0 && <details className="recent-work"><summary><span>Recently submitted or completed</span><small>{recentDeadlines.length} {recentDeadlines.length === 1 ? "deadline" : "deadlines"}</small></summary><div className="deadline-list">{recentDeadlines.map((item) => <DeadlineRow key={item.id} item={item} renderedAt={renderedAt} finished />)}</div></details>}

        <section className="summary-grid" aria-label="Semester summary">
          <article><div className="summary-icon violet"><Icon name="calendar" /></div><div><span>Active</span><strong>{activeDeadlines.length} deadlines</strong></div></article>
          <article><div className="summary-icon green"><Icon name="trend" /></div><div><span>Completed</span><strong>{completedCount} assessments</strong></div></article>
          <article><div className="summary-icon amber"><Icon name="clock" /></div><div><span>Modules</span><strong>{moduleCount} active</strong></div></article>
        </section>
      </main>
      <footer className="shell footer"><span>DueSoon</span><p>One place for every deadline.</p><small>Semester 2 · 2025/26</small></footer>
    </div>
  );
}

export default async function Home() {
  const session = await auth();
  redirect(session?.user ? "/dashboard" : "/sign-in");
}
