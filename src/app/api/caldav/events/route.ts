import { NextRequest, NextResponse } from 'next/server';
import { listEvents, createEvent } from '@/lib/caldav/events';
import type { EventFields } from '@/lib/caldav/ical';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end query params are required.' }, { status: 400 });
  }

  try {
    const events = await listEvents({ start, end });
    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  let body: Partial<EventFields>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.title || !body.start || !body.end) {
    return NextResponse.json({ error: 'title, start, and end are required.' }, { status: 400 });
  }

  const fields: EventFields = {
    title: body.title,
    description: body.description,
    location: body.location,
    start: body.start,
    end: body.end,
    allDay: Boolean(body.allDay),
  };

  try {
    const event = await createEvent(fields);
    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
