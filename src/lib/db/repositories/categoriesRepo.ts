import { db, type Category } from '@/lib/db/dexie';

export async function createCategory(name: string, color?: string): Promise<Category> {
  const category: Category = { id: crypto.randomUUID(), name, color };
  await db.categories.add(category);
  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  await db.categories.delete(id);
}
