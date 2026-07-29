import { randomUUID } from 'crypto';
import type { DAVCalendar, DAVCalendarObject } from 'tsdav';
import { getDAVClient, getEventCalendars, getDefaultEventCalendar } from './client';
import {
  buildEventICS,
  applyEventFields,
  parseFirstSubcomponent,
  eventComponentToDTO,
  type EventFields,
} from './ical';
import type { CalendarEventDTO } from '@/lib/types';

async function findEventObject(
  uid: string,
): Promise<{ calendar: DAVCalendar; object: DAVCalendarObject } | null> {
  const client = await getDAVClient();
  const calendars = await getEventCalendars();

  for (const calendar of calendars) {
    const objectUrl = new URL(`${uid}.ics`, calendar.url).toString();
    const objects = await client.fetchCalendarObjects({
      calendar,
      objectUrls: [objectUrl],
      useMultiGet: true,
    });
    const match = objects.find((obj) => obj.data);
    if (match) {
      return { calendar, object: match };
    }
  }
  return null;
}

export async function listEvents(range: { start: string; end: string }): Promise<CalendarEventDTO[]> {
  const client = await getDAVClient();
  const calendars = await getEventCalendars();

  const results: CalendarEventDTO[] = [];
  for (const calendar of calendars) {
    const objects = await client.fetchCalendarObjects({
      calendar,
      timeRange: range,
    });
    for (const obj of objects) {
      if (!obj.data) continue;
      try {
        const { target } = parseFirstSubcomponent(obj.data, 'vevent');
        results.push(eventComponentToDTO(target));
      } catch {
        // Skip objects that don't contain a parseable VEVENT (e.g. stray timezone-only resources).
      }
    }
  }
  return results.sort((a, b) => a.start.localeCompare(b.start));
}

export async function createEvent(fields: EventFields): Promise<CalendarEventDTO> {
  const client = await getDAVClient();
  const calendar = await getDefaultEventCalendar();
  const uid = randomUUID();
  const iCalString = buildEventICS(uid, fields);

  const response = await client.createCalendarObject({
    calendar,
    iCalString,
    filename: `${uid}.ics`,
  });

  if (!response.ok) {
    throw new Error(`Failed to create event (${response.status}): ${await response.text()}`);
  }

  return { uid, ...fields };
}

export async function updateEvent(uid: string, fields: EventFields): Promise<CalendarEventDTO> {
  const client = await getDAVClient();
  const found = await findEventObject(uid);
  if (!found) {
    throw new Error(`Event ${uid} not found.`);
  }

  const { vcalendar, target } = parseFirstSubcomponent(found.object.data as string, 'vevent');
  applyEventFields(target, fields);

  const response = await client.updateCalendarObject({
    calendarObject: {
      url: found.object.url,
      etag: found.object.etag,
      data: vcalendar.toString(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to update event (${response.status}): ${await response.text()}`);
  }

  return { uid, ...fields };
}

export async function deleteEvent(uid: string): Promise<void> {
  const client = await getDAVClient();
  const found = await findEventObject(uid);
  if (!found) {
    throw new Error(`Event ${uid} not found.`);
  }

  const response = await client.deleteCalendarObject({
    calendarObject: {
      url: found.object.url,
      etag: found.object.etag,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete event (${response.status}): ${await response.text()}`);
  }
}
