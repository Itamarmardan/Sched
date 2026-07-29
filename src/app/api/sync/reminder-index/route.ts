import { NextRequest, NextResponse } from 'next/server';
import { upsertReminderIndexEntry, deleteReminderIndexEntry } from '@/lib/kv/schema';
import type { ReminderIndexEntry } from '@/lib/types';

export const runtime = 'nodejs';

type SyncBody =
  | { action: 'upsert'; entry: ReminderIndexEntry }
  | { action: 'delete'; id: string };

export async function POST(request: NextRequest) {
  let body: SyncBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    if (body.action === 'upsert') {
      if (!body.entry?.id || !body.entry.dueDate) {
        return NextResponse.json({ error: 'entry.id and entry.dueDate are required.' }, { status: 400 });
      }
      await upsertReminderIndexEntry(body.entry);
    } else if (body.action === 'delete') {
      if (!body.id) {
        return NextResponse.json({ error: 'id is required.' }, { status: 400 });
      }
      await deleteReminderIndexEntry(body.id);
    } else {
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Best-effort sync — KV being unavailable shouldn't surface as a hard error to the client,
    // but we still report it so callers/logs can tell something's off.
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
