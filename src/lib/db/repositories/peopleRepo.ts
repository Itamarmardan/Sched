import { db, type Person } from '@/lib/db/dexie';

export type PersonInput = {
  name: string;
  role?: string;
  notes: string;
};

export async function createPerson(input: PersonInput): Promise<Person> {
  const now = new Date().toISOString();
  const person: Person = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  await db.people.add(person);
  return person;
}

export async function updatePerson(id: string, input: PersonInput): Promise<void> {
  await db.people.update(id, { ...input, updatedAt: new Date().toISOString() });
}

export async function deletePerson(id: string): Promise<void> {
  await db.transaction('rw', db.people, db.tasks, async () => {
    await db.people.delete(id);
    const linkedTasks = await db.tasks.where('personId').equals(id).toArray();
    await Promise.all(linkedTasks.map((t) => db.tasks.update(t.id, { personId: undefined })));
  });
}
