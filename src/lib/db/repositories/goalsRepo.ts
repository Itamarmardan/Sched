import { db, type Goal } from '@/lib/db/dexie';

export type GoalInput = {
  title: string;
  type: Goal['type'];
  startDate: string;
  endDate: string;
  notes?: string;
};

export async function createGoal(input: GoalInput): Promise<Goal> {
  const now = new Date().toISOString();
  const goal: Goal = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  await db.goals.add(goal);
  return goal;
}

export async function updateGoal(id: string, input: GoalInput): Promise<void> {
  await db.goals.update(id, { ...input, updatedAt: new Date().toISOString() });
}

export async function deleteGoal(id: string): Promise<void> {
  await db.transaction('rw', db.goals, db.goalCompletions, async () => {
    await db.goals.delete(id);
    await db.goalCompletions.where('goalId').equals(id).delete();
  });
}

export async function toggleGoalCompletion(goalId: string, date: string): Promise<void> {
  const id = `${goalId}_${date}`;
  const existing = await db.goalCompletions.get(id);
  await db.goalCompletions.put({
    id,
    goalId,
    date,
    completed: !existing?.completed,
  });
}

export async function toggleRangeGoalCompleted(goalId: string): Promise<void> {
  const goal = await db.goals.get(goalId);
  if (!goal) return;
  await db.goals.update(goalId, { completed: !goal.completed, updatedAt: new Date().toISOString() });
}
