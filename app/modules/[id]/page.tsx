import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateDeadlineResult } from "@/app/data-actions";
import { DeadlineResultForm } from "@/app/components/deadline-result-form";
import { ManageShell } from "@/app/components/manage-shell";
import { auth } from "@/auth";
import { formatEnum, formatIrishDate } from "@/lib/formatting";
import { calculateModuleGrades, formatGrade } from "@/lib/grades";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Module Overview" };

export default async function ModuleOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const [session, module] = await Promise.all([
    auth(),
    prisma.module.findFirst({
      where: { id, userId },
      include: {
        semester: { select: { name: true, academicYear: true } },
        deadlines: { orderBy: { dueAt: "asc" } },
      },
    }),
  ]);

  if (!module) notFound();

  const grades = calculateModuleGrades(module.deadlines);
  const weightingMessage = grades.totalWeighting > 100
    ? `Weightings total ${grades.totalWeighting}%, which exceeds 100%. Review the assessment weightings.`
    : grades.totalWeighting < 100
      ? `Weightings currently total ${grades.totalWeighting}%. You can add the remaining assessments later.`
      : "Assessment weightings total 100%.";

  return (
    <ManageShell user={session!.user!} title={module.name} description={`${module.code ? `${module.code} · ` : ""}${module.semester ? `${module.semester.name} · ${module.semester.academicYear}` : "No semester assigned"}`}>
      <div className="manage-actions"><Link className="secondary-button" href={`/modules/${id}/edit`}>Edit module</Link><Link className="add-button" href={`/deadlines/new`}>Add deadline</Link></div>

      <section className="grade-summary" aria-labelledby="performance-heading">
        <div className="grade-summary-heading"><div><p className="eyebrow">Performance</p><h2 id="performance-heading">Module grade overview</h2></div><span className="module-colour-swatch" style={{ backgroundColor: module.colour }} aria-label="Module colour" /></div>
        <div className="grade-metrics">
          <article><span>Current average on assessed work</span><strong>{grades.currentAverage === null ? "Not available" : `${formatGrade(grades.currentAverage)}%`}</strong><small>{grades.assessedWeighting}% of module assessed</small></article>
          <article><span>Overall module mark so far</span><strong>{formatGrade(grades.weightedPoints)}%</strong><small>earned toward the overall module mark</small></article>
          <article><span>Total weighting assessed</span><strong>{grades.assessedWeighting}%</strong><small>with a recorded result</small></article>
        </div>
        <p className={`weighting-notice ${grades.totalWeighting > 100 ? "weighting-warning" : ""}`}>{weightingMessage}</p>
        {grades.unweightedCount > 0 && <p className="weighting-notice">{grades.unweightedCount} {grades.unweightedCount === 1 ? "deadline has" : "deadlines have"} no weighting and cannot contribute to grade calculations yet.</p>}
      </section>

      <section className="assessment-section" aria-labelledby="assessment-heading">
        <div className="section-heading"><div><h2 id="assessment-heading">Assessment breakdown</h2><p>Record results as they become available.</p></div></div>
        {module.deadlines.length ? <div className="assessment-list">{module.deadlines.map((deadline) => {
          const contribution = deadline.weighting !== null && deadline.resultPercent !== null ? deadline.weighting * deadline.resultPercent / 100 : null;
          return <article className="assessment-card" key={deadline.id} style={{ borderLeftColor: module.colour }}>
            <div className="assessment-copy"><div><span>{formatEnum(deadline.type)}</span><span>{formatEnum(deadline.status)}</span></div><h3>{deadline.title}</h3><p>Due {formatIrishDate(deadline.dueAt)}</p><dl><div><dt>Weighting</dt><dd>{deadline.weighting === null ? "Not set" : `${deadline.weighting}%`}</dd></div><div><dt>Result</dt><dd>{deadline.resultPercent === null ? "Not recorded" : `${formatGrade(deadline.resultPercent)}%`}</dd></div><div><dt>Contribution to overall mark</dt><dd>{contribution === null ? "Not calculable" : `${formatGrade(contribution)}%`}</dd></div></dl><Link href={`/deadlines/${deadline.id}/edit`}>Edit deadline details</Link></div>
            <DeadlineResultForm action={updateDeadlineResult.bind(null, deadline.id)} deadlineId={deadline.id} initialResult={deadline.resultPercent} />
          </article>;
        })}</div> : <div className="empty-state"><h2>No assessments yet</h2><p>Add a deadline to start tracking this module’s results.</p><Link className="add-button" href="/deadlines/new">Add deadline</Link></div>}
      </section>
    </ManageShell>
  );
}
