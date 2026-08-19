const DAY_MS = 86_400_000;

export function parseCalendarMonth(value: string | string[] | undefined, now = new Date()) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const match = candidate?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (year >= 1900 && year <= 2200 && monthIndex >= 0 && monthIndex <= 11) return { year, monthIndex };
  }
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

export function calendarMonthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function adjacentMonth(year: number, monthIndex: number, offset: number) {
  const date = new Date(Date.UTC(year, monthIndex + offset, 1));
  return calendarMonthKey(date.getUTCFullYear(), date.getUTCMonth());
}

export function calendarGrid(year: number, monthIndex: number) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const start = new Date(first.getTime() - mondayOffset * DAY_MS);
  const days = Array.from({ length: 42 }, (_, index) => new Date(start.getTime() + index * DAY_MS));
  return {
    days,
    queryStart: new Date(start.getTime() - DAY_MS),
    queryEnd: new Date(days[41].getTime() + 2 * DAY_MS),
  };
}

export function gridDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}
