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
