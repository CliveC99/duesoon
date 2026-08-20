export function canonicalAcademicYear(value: string): string | null {
  const match = /^(?:(\d{4})\/?(\d{2})|(\d{2})\/?(\d{2}))$/.exec(value.trim());
  if (!match) return null;

  const start = match[1] ? Number(match[1]) : 2000 + Number(match[3]);
  const end = Number(match[2] ?? match[4]);
  return `${start}/${String(end).padStart(2, "0")}`;
}

export function isConsecutiveAcademicYear(value: string) {
  const canonical = canonicalAcademicYear(value);
  if (!canonical) return false;
  const [start, end] = canonical.split("/").map(Number);
  return (start + 1) % 100 === end;
}

export function normalizeAcademicYear(value: string) {
  const canonical = canonicalAcademicYear(value);
  return canonical && isConsecutiveAcademicYear(canonical) ? canonical : null;
}

export function formatAcademicYearInput(value: string, options: { deleting?: boolean; atEnd?: boolean } = {}) {
  if (options.deleting || options.atEnd === false) return value;

  const cleaned = value.replace(/[^\d/]/g, "");
  if (cleaned.includes("/")) return cleaned.replace(/\/{2,}/g, "/");
  if (/^20\d{2}$/.test(cleaned)) return `${cleaned}/`;
  if (/^\d{6}$/.test(cleaned)) return `${cleaned.slice(0, 4)}/${cleaned.slice(4)}`;
  if (/^\d{4}$/.test(cleaned) && !cleaned.startsWith("20")) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  if (/^\d{2}$/.test(cleaned) && !cleaned.startsWith("20")) return `${cleaned}/`;
  return cleaned;
}
