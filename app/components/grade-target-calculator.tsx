"use client";

import { useState } from "react";

import { calculateGradeTarget, formatGrade, type GradeDeadline } from "@/lib/grades";

export function GradeTargetCalculator({ deadlines }: { deadlines: GradeDeadline[] }) {
  const [target, setTarget] = useState("60");
  const [submittedTarget, setSubmittedTarget] = useState<number | null>(null);
  const result = submittedTarget === null ? null : calculateGradeTarget(deadlines, submittedTarget);

  return <section className="grade-target" aria-labelledby="grade-target-heading">
    <div><p className="eyebrow">Plan your result</p><h2 id="grade-target-heading">Target overall module mark</h2><p>See what average mark you need from your remaining weighted assessments.</p></div>
    <form onSubmit={(event) => { event.preventDefault(); const value = Number(target); if (Number.isFinite(value) && value >= 0 && value <= 100) setSubmittedTarget(value); }}>
      <label htmlFor="target-overall">Target overall module mark</label><div><input id="target-overall" type="number" min="0" max="100" step="0.1" required value={target} onChange={(event) => setTarget(event.target.value)} /><span>%</span><button type="submit">Calculate</button></div>
    </form>
    {result && <div className="grade-target-result" aria-live="polite">
      {result.state === "INVALID_WEIGHTING" ? <><strong>Correct the assessment weightings first.</strong><p>The current weightings total {formatGrade(result.totalWeighting)}%, so a reliable target cannot be calculated.</p></>
      : <><p>Recorded assessments have currently contributed <strong>{formatGrade(result.knownContribution)}%</strong> toward the final module mark.</p>
        {result.incomplete && <p className="grade-target-warning">This module currently contains only {formatGrade(result.totalWeighting)}% of its total assessment weighting. Add the missing assessment weighting before relying on this estimate.</p>}
        {result.state === "SECURED" ? <strong>You have already secured at least {formatGrade(submittedTarget!)}% based on your recorded results.</strong>
        : result.state === "NO_REMAINING" ? <strong>No ungraded weighted assessment remains.</strong>
        : result.state === "IMPOSSIBLE" ? <><strong>{formatGrade(submittedTarget!)}% is no longer achievable from the remaining assessment weighting.</strong><p>The maximum possible final mark is {formatGrade(result.maximumOverall)}% if all remaining weighted work scores 100%.</p></>
        : result.remainingAssessments.length === 1 ? <><p><strong>{result.remainingAssessments[0].title}</strong><br />Weighting: {formatGrade(result.remainingWeighting)}%</p><strong>You need {formatGrade(result.requiredPercent)}% in {result.remainingAssessments[0].title} to finish the module with {formatGrade(submittedTarget!)}%.</strong></>
        : <><div className="grade-target-remaining"><span>Remaining assessments</span><ul>{result.remainingAssessments.map((assessment, index) => <li key={`${assessment.title}-${index}`}><span>{assessment.title}</span><strong>{formatGrade(assessment.weighting)}%</strong></li>)}</ul></div><p>Remaining weighting: {formatGrade(result.remainingWeighting)}%</p><strong>You need an average of {formatGrade(result.requiredPercent)}% across the remaining {formatGrade(result.remainingWeighting)}% of the module.</strong></>}
      </>}
    </div>}
  </section>;
}
