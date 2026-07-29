import { randomUUID } from 'crypto';
import type { DAVCalendar, DAVCalendarObject } from 'tsdav';
import { getDAVClient, getReminderCalendars, getDefaultReminderCalendar } from './client';
import {
  buildTodoICS,
  applyTodoFields,
  parseFirstSubcomponent,
  todoComponentToDTO,
  type TodoFields,
} from './ical';
import type { ReminderDTO } from '@/lib/types';

async function findTodoObject(
  uid: string,
): Promise<{ calendar: DAVCalendar; object: DAVCalendarObject } | null> {
  const client = await getDAVClient();
  const calendars = await getReminderCalendars();

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

export async function listReminders(): Promise<ReminderDTO[]> {
  const client = await getDAVClient();
  const calendars = await getReminderCalendars();

  const results: ReminderDTO[] = [];
  for (const calendar of calendars) {
    const objects = await client.fetchCalendarObjects({ calendar });
    for (const obj of objects) {
      if (!obj.data) continue;
      try {
        const { target } = parseFirstSubcomponent(obj.data, 'vtodo');
        results.push(todoComponentToDTO(target));
      } catch {
        // Skip non-VTODO resources.
      }
    }
  }
  return results.sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
}

export async function createReminder(fields: TodoFields): Promise<ReminderDTO> {
  const client = await getDAVClient();
  const calendar = await getDefaultReminderCalendar();
  const uid = randomUUID();
  const iCalString = buildTodoICS(uid, fields);

  const response = await client.createCalendarObject({
    calendar,
    iCalString,
    filename: `${uid}.ics`,
  });

  if (!response.ok) {
    throw new Error(`Failed to create reminder (${response.status}): ${await response.text()}`);
  }

  return { uid, ...fields };
}

export async function updateReminder(uid: string, fields: TodoFields): Promise<ReminderDTO> {
  const client = await getDAVClient();
  const found = await findTodoObject(uid);
  if (!found) {
    throw new Error(`Reminder ${uid} not found.`);
  }

  const { vcalendar, target } = parseFirstSubcomponent(found.object.data as string, 'vtodo');
  applyTodoFields(target, fields);

  const response = await client.updateCalendarObject({
    calendarObject: {
      url: found.object.url,
      etag: found.object.etag,
      data: vcalendar.toString(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to update reminder (${response.status}): ${await response.text()}`);
  }

  return { uid, ...fields };
}

export async function deleteReminder(uid: string): Promise<void> {
  const client = await getDAVClient();
  const found = await findTodoObject(uid);
  if (!found) {
    throw new Error(`Reminder ${uid} not found.`);
  }

  const response = await client.deleteCalendarObject({
    calendarObject: {
      url: found.object.url,
      etag: found.object.etag,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete reminder (${response.status}): ${await response.text()}`);
  }
}
