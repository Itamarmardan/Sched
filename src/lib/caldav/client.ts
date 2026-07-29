import { createDAVClient, DAVCalendar } from 'tsdav';

const ICLOUD_SERVER_URL = 'https://caldav.icloud.com';

type DAVClientInstance = Awaited<ReturnType<typeof createDAVClient>>;

let clientPromise: Promise<DAVClientInstance> | null = null;
let calendarsPromise: Promise<DAVCalendar[]> | null = null;

function getCredentials() {
  const username = process.env.ICLOUD_APPLE_ID;
  const password = process.env.ICLOUD_APP_PASSWORD;
  if (!username || !password) {
    throw new Error('ICLOUD_APPLE_ID / ICLOUD_APP_PASSWORD are not set.');
  }
  return { username, password };
}

export function getDAVClient(): Promise<DAVClientInstance> {
  if (!clientPromise) {
    clientPromise = createDAVClient({
      serverUrl: ICLOUD_SERVER_URL,
      credentials: getCredentials(),
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    }).catch((err) => {
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

// Cached per warm serverless instance to avoid re-listing calendars on every request.
async function fetchAllCalendars(): Promise<DAVCalendar[]> {
  if (!calendarsPromise) {
    calendarsPromise = (async () => {
      const client = await getDAVClient();
      return client.fetchCalendars();
    })().catch((err) => {
      calendarsPromise = null;
      throw err;
    });
  }
  return calendarsPromise;
}

function supportsComponent(calendar: DAVCalendar, component: 'VEVENT' | 'VTODO'): boolean {
  return Boolean(calendar.components?.includes(component));
}

export async function getEventCalendars(): Promise<DAVCalendar[]> {
  const calendars = await fetchAllCalendars();
  return calendars.filter((cal) => supportsComponent(cal, 'VEVENT'));
}

export async function getReminderCalendars(): Promise<DAVCalendar[]> {
  const calendars = await fetchAllCalendars();
  return calendars.filter((cal) => supportsComponent(cal, 'VTODO'));
}

export async function getDefaultEventCalendar(): Promise<DAVCalendar> {
  const calendars = await getEventCalendars();
  if (calendars.length === 0) {
    throw new Error('No writable calendar found on the iCloud account.');
  }
  return calendars[0];
}

export async function getDefaultReminderCalendar(): Promise<DAVCalendar> {
  const calendars = await getReminderCalendars();
  if (calendars.length === 0) {
    throw new Error('No reminder list found on the iCloud account.');
  }
  return calendars[0];
}
