import { db, type Task, type ChecklistItem } from '@/lib/db/dexie';
import { upsertReminderIndex, removeReminderIndex } from '@/lib/sync/reminderIndexSync';

export type TaskInput = {
  title: string;
  checklist: ChecklistItem[];
  dueDate?: string;
  dueTime?: string;
  category?: string;
  personId?: string;
  notes?: string;
};

async function syncTaskReminder(task: Task): Promise<void> {
  if (task.status === 'done' || !task.dueDate) {
    await removeReminderIndex(task.id);
    return;
  }
  const person = task.personId ? await db.people.get(task.personId) : undefined;
  await upsertReminderIndex({
    id: task.id,
    type: 'task',
    title: task.title,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    personName: person?.name,
  });
}

export async function createTask(input: TaskInput): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = {
    id: crypto.randomUUID(),
    ...input,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
  await db.tasks.add(task);
  await syncTaskReminder(task);
  return task;
}

export async function updateTask(id: string, input: TaskInput): Promise<void> {
  await db.tasks.update(id, { ...input, updatedAt: new Date().toISOString() });
  const task = await db.tasks.get(id);
  if (task) await syncTaskReminder(task);
}

export async function setTaskStatus(id: string, status: 'open' | 'done'): Promise<void> {
  await db.tasks.update(id, { status, updatedAt: new Date().toISOString() });
  const task = await db.tasks.get(id);
  if (task) await syncTaskReminder(task);
}

export async function toggleChecklistItem(taskId: string, itemId: string): Promise<void> {
  const task = await db.tasks.get(taskId);
  if (!task) return;
  const checklist = task.checklist.map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item,
  );
  await db.tasks.update(taskId, { checklist, updatedAt: new Date().toISOString() });
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
  await removeReminderIndex(id);
}
