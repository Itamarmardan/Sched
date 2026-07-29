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
