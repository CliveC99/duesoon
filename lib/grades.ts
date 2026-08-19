export type GradeDeadline = {
  title?: string;
  weighting: number | null;
  resultPercent: number | null;
};

export type GradeTargetResult =
  | { state: "INVALID_WEIGHTING"; totalWeighting: number; incomplete: false }
  | { state: "SECURED"; totalWeighting: number; incomplete: boolean; knownContribution: number }
  | { state: "NO_REMAINING"; totalWeighting: number; incomplete: boolean; knownContribution: number }
  | { state: "IMPOSSIBLE"; totalWeighting: number; incomplete: boolean; knownContribution: number; remainingWeighting: number; maximumOverall: number }
  | { state: "REQUIRED"; totalWeighting: number; incomplete: boolean; knownContribution: number; remainingWeighting: number; requiredPercent: number; remainingAssessments: { title: string; weighting: number }[] };

export function calculateModuleGrades(deadlines: GradeDeadline[]) {
  const totalWeighting = deadlines.reduce((total, deadline) => total + (deadline.weighting ?? 0), 0);
  const assessed = deadlines.filter(
    (deadline) => deadline.weighting !== null && deadline.resultPercent !== null,
  );
  const assessedWeighting = assessed.reduce((total, deadline) => total + deadline.weighting!, 0);
  const weightedPoints = assessed.reduce(
    (total, deadline) => total + (deadline.resultPercent! * deadline.weighting!) / 100,
    0,
  );

  return {
    totalWeighting,
    assessedWeighting,
    weightedPoints,
    currentAverage: assessedWeighting > 0 ? (weightedPoints / assessedWeighting) * 100 : null,
    unweightedCount: deadlines.filter((deadline) => deadline.weighting === null).length,
  };
}

export function formatGrade(value: number) {
  return new Intl.NumberFormat("en-IE", { maximumFractionDigits: 2 }).format(value);
}

export function calculateGradeTarget(deadlines: GradeDeadline[], targetOverall: number): GradeTargetResult {
  const weighted = deadlines.filter((deadline) => deadline.weighting !== null);
  const totalWeighting = weighted.reduce((total, deadline) => total + deadline.weighting!, 0);
  const incomplete = totalWeighting < 100;
  if (totalWeighting > 100) return { state: "INVALID_WEIGHTING", totalWeighting, incomplete: false };

  const knownContribution = weighted.reduce((total, deadline) => deadline.resultPercent === null ? total : total + deadline.resultPercent * deadline.weighting! / 100, 0);
  if (knownContribution >= targetOverall) return { state: "SECURED", totalWeighting, incomplete, knownContribution };

  const remaining = weighted.filter((deadline) => deadline.resultPercent === null && deadline.weighting! > 0);
  const remainingWeighting = remaining.reduce((total, deadline) => total + deadline.weighting!, 0);
  if (remainingWeighting === 0) return { state: "NO_REMAINING", totalWeighting, incomplete, knownContribution };

  const requiredPercent = (targetOverall - knownContribution) / remainingWeighting * 100;
  if (requiredPercent <= 0) return { state: "SECURED", totalWeighting, incomplete, knownContribution };
  if (requiredPercent > 100) return { state: "IMPOSSIBLE", totalWeighting, incomplete, knownContribution, remainingWeighting, maximumOverall: knownContribution + remainingWeighting };
  return { state: "REQUIRED", totalWeighting, incomplete, knownContribution, remainingWeighting, requiredPercent, remainingAssessments: remaining.map((deadline) => ({ title: deadline.title ?? "Remaining assessment", weighting: deadline.weighting! })) };
}
