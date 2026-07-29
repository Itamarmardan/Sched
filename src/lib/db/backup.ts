import { db } from './dexie';

const BACKUP_VERSION = 1;

export type BackupFile = {
  version: number;
  exportedAt: string;
  data: Record<string, unknown[]>;
};

export async function exportBackup(): Promise<BackupFile> {
  const data: Record<string, unknown[]> = {};
  for (const table of db.tables) {
    data[table.name] = await table.toArray();
  }
  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data };
}

export async function importBackup(file: BackupFile): Promise<void> {
  if (!file || typeof file !== 'object' || !file.data) {
    throw new Error('This file doesn\'t look like a Sched backup.');
  }

  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      const rows = file.data[table.name];
      await table.clear();
      if (Array.isArray(rows) && rows.length > 0) {
        await table.bulkAdd(rows);
      }
    }
  });
}
