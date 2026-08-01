import type { Habit, HabitCompletion } from '@/lib/db/dexie';
import { daysBetween, isoWeekKey } from '@/lib/dateRange';

export function isHabitActive(habit: Habit, today: string): boolean {
  if (today < habit.startDate) return false;
  if (habit.endDate && today > habit.endDate) return false;
  return true;
}

// Ratio of completed vs. expected occurrences since the habit's start date, e.g. 8/9
// when one day was missed. Expected occurrences stop counting at the earlier of today
// or the habit's end date, so a lapsed habit doesn't keep accruing misses forever.
export function computeHabitProgress(
  habit: Habit,
  completions: HabitCompletion[],
  today: string,
): { completed: number; expected: number } {
  const effectiveEnd = habit.endDate && habit.endDate < today ? habit.endDate : today;
  if (today < habit.startDate) return { completed: 0, expected: 0 };

  if (habit.frequency === 'weekly') {
    const expected = Math.floor(daysBetween(habit.startDate, effectiveEnd) / 7) + 1;
    const completed = completions.filter((c) => c.count > 0).length;
    return { completed: Math.min(completed, expected), expected };
  }

  const daysElapsed = daysBetween(habit.startDate, effectiveEnd) + 1;

  if (habit.frequency === 'times_per_day') {
    const target = habit.timesPerDay ?? 1;
    const expected = daysElapsed * target;
    const completed = completions.reduce((sum, c) => sum + Math.min(c.count, target), 0);
    return { completed, expected };
  }

  const expected = daysElapsed;
  const completed = completions.filter((c) => c.count > 0).length;
  return { completed, expected };
}

export function todayCompletionCount(habit: Habit, completions: HabitCompletion[], today: string): number {
  const key = habit.frequency === 'weekly' ? isoWeekKey(today) : today;
  return completions.find((c) => c.date === key)?.count ?? 0;
}

export function habitFrequencyLabel(habit: Habit): string {
  if (habit.frequency === 'weekly') return 'Weekly';
  if (habit.frequency === 'times_per_day') return `${habit.timesPerDay ?? 1}x daily`;
  return 'Daily';
}
