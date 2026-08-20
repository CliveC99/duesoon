import type { Metadata } from "next";
import Link from "next/link";

import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { examCountdown, examListWhere, examOrder, examStatusLabel, examTopics, parseExamView } from "@/lib/exams";
import { formatEnum, formatIrishDate, formatIrishTime } from "@/lib/formatting";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Exams" };

export default async function ExamsPage({ searchParams }: { searchParams: Promise<{ view?: string | string[] }> }) {
  const userId = await requireUserId();
  const [{ view: rawView }, session] = await Promise.all([searchParams, auth()]);
  const view = parseExamView(rawView);
  const now = new Date();
  const exams = await prisma.deadline.findMany({
    where: examListWhere(userId, view, now),
    select: { id: true, title: true, dueAt: true, weighting: true, status: true, examTopics: true, examFormat: true, examLocation: true, module: { select: { name: true, code: true, colour: true } } },
    orderBy: examOrder(view),
  });

  return <ManageShell user={session!.user!} title="Exams" description="Your exam dates, locations, formats, and topics in one focused view.">
    <nav className="exam-tabs" aria-label="Exam periods"><Link href="/exams" aria-current={view === "upcoming" ? "page" : undefined}>Upcoming</Link><Link href="/exams?view=past" aria-current={view === "past" ? "page" : undefined}>Past</Link><Link className="add-button" href="/deadlines/new">Add exam</Link></nav>
    {exams.length ? <div className="exam-list">{exams.map((exam) => {
      const topics = examTopics(exam.examTopics);
      const status = examStatusLabel(exam.status, view === "past");
      return <article className="exam-card" key={exam.id} style={{ borderTopColor: exam.module.colour }}>
        <header><div><span className="exam-label">Exam</span><span>{exam.module.code || exam.module.name}</span></div><strong>{view === "past" ? formatEnum(exam.status) : examCountdown(exam.dueAt, now)}</strong></header>
        <h2>{exam.title}</h2><p className="exam-module">{exam.module.name}</p>
        <dl className="exam-facts"><div><dt>Date</dt><dd>{formatIrishDate(exam.dueAt)}</dd></div><div><dt>Start time</dt><dd>{formatIrishTime(exam.dueAt)}</dd></div>{exam.examLocation && <div><dt>Location</dt><dd>{exam.examLocation}</dd></div>}{exam.weighting !== null && <div><dt>Weighting</dt><dd>{exam.weighting}%</dd></div>}{status && <div><dt>Status</dt><dd>{status}</dd></div>}</dl>
        {(topics.length > 0 || exam.examFormat) && <div className="exam-preparation">{topics.length > 0 && <section><h3>Topics covered</h3><ul>{topics.map((topic, index) => <li key={`${topic}-${index}`}>{topic}</li>)}</ul></section>}{exam.examFormat && <section><h3>Exam format</h3><p>{exam.examFormat}</p></section>}</div>}
        <Link className="exam-edit" href={`/deadlines/${exam.id}/edit`}>Edit exam details <span aria-hidden="true">→</span></Link>
      </article>;
    })}</div> : <div className="empty-state exam-empty"><h2>{view === "past" ? "No past exams" : "No upcoming exams"}</h2><p>{view === "past" ? "Past exams will appear here after their scheduled time." : "Add an exam deadline to keep its date and preparation material together."}</p>{view === "upcoming" && <Link className="add-button" href="/deadlines/new">Add exam</Link>}</div>}
  </ManageShell>;
}
