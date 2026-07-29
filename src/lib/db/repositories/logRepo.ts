import { db, type LogEntry } from '@/lib/db/dexie';

export type LogEntryInput = {
  date: string;
  title?: string;
  body: string;
  tags?: string[];
};

export async function createLogEntry(input: LogEntryInput): Promise<LogEntry> {
  const now = new Date().toISOString();
  const entry: LogEntry = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  await db.logEntries.add(entry);
  return entry;
}

export async function updateLogEntry(id: string, input: LogEntryInput): Promise<void> {
  await db.logEntries.update(id, { ...input, updatedAt: new Date().toISOString() });
}

export async function deleteLogEntry(id: string): Promise<void> {
  await db.logEntries.delete(id);
}
