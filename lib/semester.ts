const DAY_MS = 86_400_000;

function utcDay(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

export function semesterTiming(startDate: Date, endDate: Date, now: Date) {
  const start = utcDay(startDate);
  const end = utcDay(endDate);
  const today = utcDay(now);
  const duration = Math.max(DAY_MS, end - start);
  const progress = Math.round(Math.min(1, Math.max(0, (today - start) / duration)) * 100);

  if (today < start) return { phase: "Upcoming", progress };
  if (today > end) return { phase: "Semester complete", progress: 100 };
  return { phase: `Week ${Math.floor((today - start) / (7 * DAY_MS)) + 1}`, progress };
}
