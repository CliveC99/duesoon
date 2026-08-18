import type { User } from "next-auth";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";

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

const deadlines = [
  { date: "18", month: "MAR", title: "Machine Learning Report", module: "CS4012", meta: "Assignment · 2:00 PM", weight: "35%", status: "In progress", tone: "violet" },
  { date: "21", month: "MAR", title: "Corporate Finance Exam", module: "FN3021", meta: "Exam · 9:30 AM", weight: "50%", status: "Revision", tone: "amber" },
  { date: "26", month: "MAR", title: "Modern European History", module: "HI2044", meta: "Essay · 11:59 PM", weight: "40%", status: "Not started", tone: "blue" },
];

function ModuleTag({ children, tone = "violet" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`module-tag module-${tone}`}>{children}</span>;
}

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return <div className="countdown-unit"><strong>{value}</strong><span>{label}</span></div>;
}

function DeadlineRow({ item }: { item: (typeof deadlines)[number] }) {
  return (
    <article className="deadline-row">
      <div className="date-tile"><strong>{item.date}</strong><span>{item.month}</span></div>
      <div className="deadline-copy"><div className="flex flex-wrap items-center gap-2.5"><h3>{item.title}</h3><ModuleTag tone={item.tone}>{item.module}</ModuleTag></div><p>{item.meta}</p></div>
      <div className="deadline-meta"><span>{item.weight} weighting</span><span className={`status status-${item.tone}`}><i />{item.status}</span></div>
      <button className="more-button" aria-label={`More options for ${item.title}`}>•••</button>
    </article>
  );
}

function initials(user: User) {
  const source = user.name?.trim() || user.email?.split("@")[0] || "Student";
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function DashboardView({ user }: { user: User }) {
  const displayName = user.name?.trim() || "Student";
  return (
    <div className="min-h-screen">
      <header className="site-header">
        <div className="shell flex h-16 items-center justify-between">
          <a className="brand" href="/dashboard" aria-label="DueSoon home"><span className="brand-mark"><Icon name="clock" className="size-[18px]" /></span><span>DueSoon</span></a>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation"><a className="nav-link nav-active" href="#overview"><Icon name="grid" />Overview</a><a className="nav-link" href="#deadlines"><Icon name="calendar" />Deadlines</a></nav>
          <div className="flex items-center gap-3">
            <button className="add-button"><Icon name="plus" className="size-4" /><span>Add deadline</span></button>
            <div className="account-area"><div className="account-copy"><strong>{displayName}</strong><form action={async () => { "use server"; await signOut({ redirectTo: "/sign-in" }); }}><button>Sign out</button></form></div><div className="avatar" aria-label={`${displayName}'s account`}>{initials(user)}</div></div>
          </div>
        </div>
      </header>

      <main id="overview" className="shell py-8 sm:py-11">
        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Spring semester · Week 8</p><h1>Good morning, {displayName.split(" ")[0]}.</h1><p className="intro">Here’s what’s coming up across your modules.</p></div><div className="semester-pill"><span><Icon name="trend" /></span><div><strong>6 of 14 complete</strong><small>43% through semester</small></div></div></section>
        <section className="next-card" aria-labelledby="next-deadline-title">
          <div className="next-copy"><div className="next-label"><span><Icon name="sparkles" className="size-4" /></span>Next deadline</div><div className="mt-8 flex flex-wrap items-center gap-3"><ModuleTag>CS4012</ModuleTag><span className="type-label">Assignment</span></div><h2 id="next-deadline-title">Machine Learning Report</h2><p>Evaluate classification models and present your findings in a concise technical report.</p><div className="due-line"><Icon name="calendar" /><strong>Due Tuesday, 18 March</strong><span>at 2:00 PM</span></div><div className="progress-label"><span>Progress</span><strong>In progress · 35% weighting</strong></div><div className="progress-track"><span /></div></div>
          <div className="countdown-panel"><p>Time remaining</p><div className="countdown"><CountdownUnit value="02" label="Days" /><b>:</b><CountdownUnit value="14" label="Hours" /><b>:</b><CountdownUnit value="37" label="Mins" /></div><div className="urgency"><span />Due soon — stay focused</div></div>
        </section>
        <section id="deadlines" className="mt-10"><div className="section-heading"><div><h2>Upcoming deadlines</h2><p>Your next assessments, ordered by due date.</p></div><button className="view-button">View all <span>→</span></button></div><div className="deadline-list">{deadlines.map((item) => <DeadlineRow key={item.title} item={item} />)}</div></section>
        <section className="summary-grid" aria-label="Semester summary"><article><div className="summary-icon violet"><Icon name="calendar" /></div><div><span>Due this month</span><strong>5 deadlines</strong></div></article><article><div className="summary-icon green"><Icon name="trend" /></div><div><span>Completed</span><strong>6 assessments</strong></div></article><article><div className="summary-icon amber"><Icon name="clock" /></div><div><span>Next exam</span><strong>21 March</strong></div></article></section>
      </main>
      <footer className="shell footer"><span>DueSoon</span><p>One place for every deadline.</p><small>Spring semester 2026</small></footer>
    </div>
  );
}

export default async function Home() {
  const session = await auth();
  redirect(session?.user ? "/dashboard" : "/sign-in");
}
