import { db, type Note } from '@/lib/db/dexie';

export type NoteInput = {
  title: string;
  body: string;
  tags: string[];
};

export async function createNote(input: NoteInput): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  await db.notes.add(note);
  return note;
}

export async function updateNote(id: string, input: NoteInput): Promise<void> {
  await db.notes.update(id, { ...input, updatedAt: new Date().toISOString() });
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}
