const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-11" -> "Nov 2026", "2024" -> "2024" (CV output is always English)
export function formatYearMonth(value: string | null): string {
  if (!value) return "";
  const [y, m] = value.split("-");
  const month = m ? MONTHS[Number(m) - 1] : undefined;
  return month ? `${month} ${y}` : y;
}

// True when `end` is before `start`. A year on its own ("2024") is compared by year only, so
// "2024-09 → 2024" is a valid range.
export function isEndBeforeStart(start: string, end: string): boolean {
  if (start.length === 7 && end.length === 7) return end < start;
  return end.slice(0, 4) < start.slice(0, 4);
}

export function formatRange(start: string | null, end: string | null, presentIfOpen = true): string {
  const s = formatYearMonth(start);
  const e = end ? formatYearMonth(end) : presentIfOpen && start ? "Present" : "";
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

// Short random id for list items (bullets, roles...). Not security-relevant.
export function newId(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10);
}
