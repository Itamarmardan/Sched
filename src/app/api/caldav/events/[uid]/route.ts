import { NextRequest, NextResponse } from 'next/server';
import { updateEvent, deleteEvent } from '@/lib/caldav/events';
import type { EventFields } from '@/lib/caldav/ical';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;

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
    const event = await updateEvent(uid, fields);
    return NextResponse.json({ event });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;

  try {
    await deleteEvent(uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
