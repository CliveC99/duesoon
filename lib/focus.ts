export type FocusDeadline = {
  id: string;
  title: string;
  dueAt: Date;
  weighting: number | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "COMPLETED";
};

function urgencyBand(dueAt: Date, now: Date) {
  const remaining = dueAt.getTime() - now.getTime();
  if (remaining < 0) return 4;
  if (remaining <= 86_400_000) return 3;
  if (remaining <= 3 * 86_400_000) return 2;
  return 1;
}

export function focusRecommendation<T extends FocusDeadline>(deadlines: T[], now: Date): T | null {
  return deadlines
    .filter((deadline) => deadline.status === "NOT_STARTED" || deadline.status === "IN_PROGRESS")
    .sort((left, right) => {
      const urgencyDifference = urgencyBand(right.dueAt, now) - urgencyBand(left.dueAt, now);
      if (urgencyDifference) return urgencyDifference;
      const weightingDifference = (right.weighting ?? 0) - (left.weighting ?? 0);
      if (weightingDifference) return weightingDifference;
      const statusDifference = Number(right.status === "NOT_STARTED") - Number(left.status === "NOT_STARTED");
      if (statusDifference) return statusDifference;
      return left.dueAt.getTime() - right.dueAt.getTime() || left.id.localeCompare(right.id);
    })[0] ?? null;
}

export function focusReason(deadline: FocusDeadline, now: Date) {
  const band = urgencyBand(deadline.dueAt, now);
  const timing = band === 4 ? "it is overdue" : band === 3 ? "it is due within 24 hours" : band === 2 ? "it is due within three days" : "it is the strongest upcoming priority";
  const weighting = deadline.weighting ? ` and carries ${deadline.weighting}% of its module weighting` : "";
  return `High priority because ${timing}${weighting}.`;
}
