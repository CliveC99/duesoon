export type GradeDeadline = {
  weighting: number | null;
  resultPercent: number | null;
};

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
