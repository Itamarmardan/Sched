import { NextRequest, NextResponse } from 'next/server';
import { updateReminder, deleteReminder } from '@/lib/caldav/reminders';
import type { TodoFields } from '@/lib/caldav/ical';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;

  let body: Partial<TodoFields>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.title) {
    return NextResponse.json({ error: 'title is required.' }, { status: 400 });
  }

  const fields: TodoFields = {
    title: body.title,
    notes: body.notes,
    dueDate: body.dueDate,
    completed: Boolean(body.completed),
  };

  try {
    const reminder = await updateReminder(uid, fields);
    return NextResponse.json({ reminder });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;

  try {
    await deleteReminder(uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
