export function isoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Local calendar date (not UTC) — what "today"/"tomorrow" means to the person using the app.
export function localISODate(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Pure date-string arithmetic (no wall-clock read) — safe to call during render.
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return localISODate(date);
}

export function toDateTimeLocalValue(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatEventWhen(start: string, end: string, allDay: boolean): string {
  const startDate = new Date(start);
  const opts: Intl.DateTimeFormatOptions = allDay
    ? { weekday: 'short', month: 'short', day: 'numeric' }
    : { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  const startStr = startDate.toLocaleString(undefined, opts);
  if (allDay) return startStr;
  const endStr = new Date(end).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${startStr} – ${endStr}`;
}

// Whole days between two ISO date strings (end - start), via UTC noon-free day math
// so it isn't affected by DST shifts. Negative if end is before start.
export function daysBetween(startISO: string, endISO: string): number {
  const [sy, sm, sd] = startISO.split('-').map(Number);
  const [ey, em, ed] = endISO.split('-').map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.round((end - start) / 86400000);
}

// ISO-8601 week key (e.g. "2026-W05") for grouping "weekly" habit completions.
export function isoWeekKey(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// Sorts ascending by an optional ISO date string, with undefined/empty always last.
// Use this instead of Dexie's orderBy() on an optional field — IndexedDB indexes
// silently omit records whose indexed key path is undefined, which would hide them.
export function compareOptionalDates(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

export function formatDueDate(dueDate?: string): string {
  if (!dueDate) return 'No due date';
  const isDateOnly = dueDate.length === 10;
  const date = new Date(isDateOnly ? `${dueDate}T00:00:00` : dueDate);
  return date.toLocaleString(undefined, isDateOnly
    ? { weekday: 'short', month: 'short', day: 'numeric' }
    : { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
