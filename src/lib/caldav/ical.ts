import ICAL from 'ical.js';
import type { CalendarEventDTO, ReminderDTO } from '@/lib/types';

const PRODID = '-//Sched//Personal Dashboard//EN';

export type EventFields = {
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO date (allDay) or date-time
  end: string; // ISO date (allDay) or date-time
  allDay: boolean;
};

export type TodoFields = {
  title: string;
  notes?: string;
  dueDate?: string; // ISO date or date-time
  completed: boolean;
};

function toICalTime(iso: string, allDay: boolean): ICAL.Time {
  const date = new Date(iso);
  const time = ICAL.Time.fromJSDate(date, true);
  if (allDay) {
    time.isDate = true;
  }
  return time;
}

function ensureNonZeroAllDayRange(startIso: string, endIso: string): { start: string; end: string } {
  const start = startIso.slice(0, 10);
  let end = endIso.slice(0, 10);
  if (end <= start) {
    const d = new Date(`${start}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    end = d.toISOString().slice(0, 10);
  }
  return { start, end };
}

function newVCalendar(): ICAL.Component {
  const vcalendar = new ICAL.Component('vcalendar');
  vcalendar.addPropertyWithValue('version', '2.0');
  vcalendar.addPropertyWithValue('prodid', PRODID);
  return vcalendar;
}

export function buildEventICS(uid: string, fields: EventFields): string {
  const vcalendar = newVCalendar();
  const vevent = new ICAL.Component('vevent');
  vcalendar.addSubcomponent(vevent);

  vevent.addPropertyWithValue('uid', uid);
  vevent.addPropertyWithValue('dtstamp', ICAL.Time.now());
  applyEventFields(vevent, fields);

  return vcalendar.toString();
}

export function buildTodoICS(uid: string, fields: TodoFields): string {
  const vcalendar = newVCalendar();
  const vtodo = new ICAL.Component('vtodo');
  vcalendar.addSubcomponent(vtodo);

  vtodo.addPropertyWithValue('uid', uid);
  vtodo.addPropertyWithValue('dtstamp', ICAL.Time.now());
  applyTodoFields(vtodo, fields);

  return vcalendar.toString();
}

export function applyEventFields(vevent: ICAL.Component, fields: EventFields): void {
  vevent.updatePropertyWithValue('summary', fields.title);

  if (fields.description) {
    vevent.updatePropertyWithValue('description', fields.description);
  } else {
    vevent.removeAllProperties('description');
  }

  if (fields.location) {
    vevent.updatePropertyWithValue('location', fields.location);
  } else {
    vevent.removeAllProperties('location');
  }

  if (fields.allDay) {
    const { start, end } = ensureNonZeroAllDayRange(fields.start, fields.end);
    const startTime = ICAL.Time.fromDateString(start);
    const endTime = ICAL.Time.fromDateString(end);
    vevent.updatePropertyWithValue('dtstart', startTime).setParameter('value', 'DATE');
    vevent.updatePropertyWithValue('dtend', endTime).setParameter('value', 'DATE');
  } else {
    vevent.updatePropertyWithValue('dtstart', toICalTime(fields.start, false));
    vevent.updatePropertyWithValue('dtend', toICalTime(fields.end, false));
  }
}

export function applyTodoFields(vtodo: ICAL.Component, fields: TodoFields): void {
  vtodo.updatePropertyWithValue('summary', fields.title);

  if (fields.notes) {
    vtodo.updatePropertyWithValue('description', fields.notes);
  } else {
    vtodo.removeAllProperties('description');
  }

  if (fields.dueDate) {
    const isDateOnly = fields.dueDate.length === 10;
    const dueTime = isDateOnly ? ICAL.Time.fromDateString(fields.dueDate) : toICalTime(fields.dueDate, false);
    const prop = vtodo.updatePropertyWithValue('due', dueTime);
    if (isDateOnly) prop.setParameter('value', 'DATE');
  } else {
    vtodo.removeAllProperties('due');
  }

  vtodo.updatePropertyWithValue('status', fields.completed ? 'COMPLETED' : 'NEEDS-ACTION');
  if (fields.completed) {
    vtodo.updatePropertyWithValue('completed', ICAL.Time.now());
    vtodo.updatePropertyWithValue('percent-complete', 100);
  } else {
    vtodo.removeAllProperties('completed');
    vtodo.removeAllProperties('percent-complete');
  }
}

export function parseFirstSubcomponent(icsString: string, name: 'vevent' | 'vtodo'): {
  vcalendar: ICAL.Component;
  target: ICAL.Component;
} {
  const jcal = ICAL.parse(icsString);
  const vcalendar = new ICAL.Component(jcal);
  const target = vcalendar.getFirstSubcomponent(name);
  if (!target) {
    throw new Error(`No ${name} component found in ICS data.`);
  }
  return { vcalendar, target };
}

function timeToISO(time: ICAL.Time): string {
  return time.isDate ? time.toString().slice(0, 10) : time.toJSDate().toISOString();
}

export function eventComponentToDTO(vevent: ICAL.Component): CalendarEventDTO {
  const uid = String(vevent.getFirstPropertyValue('uid') ?? '');
  const summary = String(vevent.getFirstPropertyValue('summary') ?? '');
  const description = vevent.getFirstPropertyValue('description');
  const location = vevent.getFirstPropertyValue('location');
  const dtstart = vevent.getFirstProperty('dtstart')?.getFirstValue() as ICAL.Time | null;
  const dtend = vevent.getFirstProperty('dtend')?.getFirstValue() as ICAL.Time | null;

  const allDay = Boolean(dtstart?.isDate);

  return {
    uid,
    title: summary,
    description: description ? String(description) : undefined,
    location: location ? String(location) : undefined,
    start: dtstart ? timeToISO(dtstart) : '',
    end: dtend ? timeToISO(dtend) : dtstart ? timeToISO(dtstart) : '',
    allDay,
  };
}

export function todoComponentToDTO(vtodo: ICAL.Component): ReminderDTO {
  const uid = String(vtodo.getFirstPropertyValue('uid') ?? '');
  const summary = String(vtodo.getFirstPropertyValue('summary') ?? '');
  const notes = vtodo.getFirstPropertyValue('description');
  const due = vtodo.getFirstProperty('due')?.getFirstValue() as ICAL.Time | null;
  const status = vtodo.getFirstPropertyValue('status');

  return {
    uid,
    title: summary,
    notes: notes ? String(notes) : undefined,
    dueDate: due ? timeToISO(due) : undefined,
    completed: status === 'COMPLETED',
  };
}
