const IRISH_TIME_ZONE = "Europe/Dublin";

export function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatIrishDate(date: Date) {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: IRISH_TIME_ZONE,
  }).format(date);
}

export function formatIrishTime(date: Date) {
  return new Intl.DateTimeFormat("en-IE", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: IRISH_TIME_ZONE,
  }).format(date);
}

export function formatIrishDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-IE", {
    day: "2-digit",
    month: "short",
    timeZone: IRISH_TIME_ZONE,
  }).formatToParts(date);

  return {
    day: parts.find((part) => part.type === "day")?.value ?? "",
    month: (parts.find((part) => part.type === "month")?.value ?? "").toUpperCase(),
  };
}

export function irishDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-IE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: IRISH_TIME_ZONE,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function formatIrishCalendarDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
