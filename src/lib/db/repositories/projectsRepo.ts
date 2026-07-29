import { db, type Project, type ProjectItem } from '@/lib/db/dexie';
import { upsertReminderIndex, removeReminderIndex } from '@/lib/sync/reminderIndexSync';

export type ProjectInput = {
  title: string;
  description: string;
  status: Project['status'];
  dueDate?: string;
};

export async function createProject(input: ProjectInput): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  await db.projects.add(project);
  return project;
}

export async function updateProject(id: string, input: ProjectInput): Promise<void> {
  await db.projects.update(id, { ...input, updatedAt: new Date().toISOString() });
}

export async function deleteProject(id: string): Promise<void> {
  const items = await db.transaction('rw', db.projects, db.projectItems, async () => {
    const existing = await db.projectItems.where('projectId').equals(id).toArray();
    await db.projects.delete(id);
    await db.projectItems.where('projectId').equals(id).delete();
    return existing;
  });
  await Promise.all(items.map((item) => removeReminderIndex(item.id)));
}

export type ProjectItemInput = {
  title: string;
  dueDate?: string;
};

async function syncProjectItemReminder(item: ProjectItem): Promise<void> {
  if (item.done || !item.dueDate) {
    await removeReminderIndex(item.id);
    return;
  }
  await upsertReminderIndex({
    id: item.id,
    type: 'project_item',
    title: item.title,
    dueDate: item.dueDate,
  });
}

export async function createProjectItem(projectId: string, input: ProjectItemInput): Promise<ProjectItem> {
  const existing = await db.projectItems.where('projectId').equals(projectId).toArray();
  const item: ProjectItem = {
    id: crypto.randomUUID(),
    projectId,
    title: input.title,
    dueDate: input.dueDate,
    done: false,
    order: existing.length,
  };
  await db.projectItems.add(item);
  await syncProjectItemReminder(item);
  return item;
}

export async function toggleProjectItem(id: string): Promise<void> {
  const item = await db.projectItems.get(id);
  if (!item) return;
  await db.projectItems.update(id, { done: !item.done });
  const updated = await db.projectItems.get(id);
  if (updated) await syncProjectItemReminder(updated);
}

export async function deleteProjectItem(id: string): Promise<void> {
  await db.projectItems.delete(id);
  await removeReminderIndex(id);
}
