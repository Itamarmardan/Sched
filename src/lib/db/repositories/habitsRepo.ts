import { db, type Habit, type HabitFrequency } from '@/lib/db/dexie';
import { isoWeekKey } from '@/lib/dateRange';

export type HabitInput = {
  title: string;
  frequency: HabitFrequency;
  timesPerDay?: number;
  startDate: string;
  endDate?: string;
  notes?: string;
};

export async function createHabit(input: HabitInput): Promise<Habit> {
  const now = new Date().toISOString();
  const habit: Habit = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  await db.habits.add(habit);
  return habit;
}

export async function updateHabit(id: string, input: HabitInput): Promise<void> {
  await db.habits.update(id, { ...input, updatedAt: new Date().toISOString() });
}

export async function deleteHabit(id: string): Promise<void> {
  await db.transaction('rw', db.habits, db.habitCompletions, async () => {
    await db.habits.delete(id);
    await db.habitCompletions.where('habitId').equals(id).delete();
  });
}

// For daily/times_per_day habits, `today` is used as-is; for weekly habits, pass the
// ISO week key (see isoWeekKey) as `dateOrWeekKey` instead of a plain date.
function completionId(habitId: string, dateOrWeekKey: string): string {
  return `${habitId}_${dateOrWeekKey}`;
}

export async function toggleDailyHabitCompletion(habitId: string, today: string): Promise<void> {
  const id = completionId(habitId, today);
  const existing = await db.habitCompletions.get(id);
  await db.habitCompletions.put({
    id,
    habitId,
    date: today,
    count: existing && existing.count > 0 ? 0 : 1,
  });
}

export async function toggleWeeklyHabitCompletion(habitId: string, today: string): Promise<void> {
  const weekKey = isoWeekKey(today);
  const id = completionId(habitId, weekKey);
  const existing = await db.habitCompletions.get(id);
  await db.habitCompletions.put({
    id,
    habitId,
    date: weekKey,
    count: existing && existing.count > 0 ? 0 : 1,
  });
}

export async function setTimesPerDayCompletionCount(
  habitId: string,
  today: string,
  count: number,
): Promise<void> {
  const id = completionId(habitId, today);
  await db.habitCompletions.put({ id, habitId, date: today, count: Math.max(0, count) });
}
