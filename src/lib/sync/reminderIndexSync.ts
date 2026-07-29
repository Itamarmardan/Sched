'use client';

import type { ReminderIndexEntry } from '@/lib/types';

// Best-effort: Dexie is the source of truth for local content. If this sync call
// fails (offline, KV misconfigured), the UI must not be blocked or show an error —
// it only affects whether a push notification fires later, not the app's own data.
export async function upsertReminderIndex(entry: ReminderIndexEntry): Promise<void> {
  try {
    await fetch('/api/sync/reminder-index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', entry }),
    });
  } catch {
    // Ignore — see note above.
  }
}

export async function removeReminderIndex(id: string): Promise<void> {
  try {
    await fetch('/api/sync/reminder-index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
  } catch {
    // Ignore — see note above.
  }
}
