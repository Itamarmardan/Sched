import { NextRequest, NextResponse } from 'next/server';
import { listReminders, createReminder } from '@/lib/caldav/reminders';
import type { TodoFields } from '@/lib/caldav/ical';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const reminders = await listReminders();
    return NextResponse.json({ reminders });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
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
    const reminder = await createReminder(fields);
    return NextResponse.json({ reminder }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
