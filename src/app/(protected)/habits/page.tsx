'use client';

import { useState, FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Habit, type HabitFrequency } from '@/lib/db/dexie';
import {
  createHabit,
  deleteHabit,
  toggleDailyHabitCompletion,
  toggleWeeklyHabitCompletion,
  setTimesPerDayCompletionCount,
} from '@/lib/db/repositories/habitsRepo';
import { computeHabitProgress, todayCompletionCount, habitFrequencyLabel, isHabitActive } from '@/lib/habits';
import { localISODate, compareOptionalDates } from '@/lib/dateRange';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import IconButton from '@/components/ui/IconButton';
import PageHeader from '@/components/ui/PageHeader';
import { TrashIcon, FlameIcon } from '@/components/ui/icons';

const FREQUENCY_LABEL: Record<HabitFrequency, string> = {
  daily: 'Daily',
  times_per_day: 'A few times a day',
  weekly: 'Weekly',
};

function NewHabitForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const today = localISODate();
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [timesPerDay, setTimesPerDay] = useState('3');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createHabit({
      title,
      frequency,
      timesPerDay: frequency === 'times_per_day' ? Math.max(1, Number(timesPerDay) || 1) : undefined,
      startDate,
      endDate: endDate || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input required placeholder="Title, e.g. Drink water" value={title} onChange={(e) => setTitle(e.target.value)} />

      <Select value={frequency} onChange={(e) => setFrequency(e.target.value as HabitFrequency)}>
        {Object.entries(FREQUENCY_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      {frequency === 'times_per_day' && (
        <div>
          <label className="mb-1 block text-xs text-gray-500">Times per day</label>
          <Input
            type="number"
            min={1}
            max={20}
            value={timesPerDay}
            onChange={(e) => setTimesPerDay(e.target.value)}
          />
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">Start</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">Until (optional)</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

      <div className="flex gap-2 pt-2">
        <Button type="button" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={saving} className="flex-1">
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

function HabitRow({ habit, today }: { habit: Habit; today: string }) {
  const completions = useLiveQuery(
    () => db.habitCompletions.where('habitId').equals(habit.id).toArray(),
    [habit.id],
  );

  if (!completions) return null;

  const { completed, expected } = computeHabitProgress(habit, completions, today);
  const todayCount = todayCompletionCount(habit, completions, today);
  const active = isHabitActive(habit, today);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {habit.frequency === 'times_per_day' ? (
        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            label="Fewer today"
            disabled={!active || todayCount <= 0}
            onClick={() => setTimesPerDayCompletionCount(habit.id, today, todayCount - 1)}
          >
            <span className="text-lg leading-none">−</span>
          </IconButton>
          <span className="w-6 text-center text-sm font-medium text-gray-900">{todayCount}</span>
          <IconButton
            label="One more today"
            disabled={!active}
            onClick={() => setTimesPerDayCompletionCount(habit.id, today, todayCount + 1)}
          >
            <span className="text-lg leading-none">+</span>
          </IconButton>
        </div>
      ) : (
        <Checkbox
          checked={todayCount > 0}
          disabled={!active}
          onChange={() =>
            habit.frequency === 'weekly'
              ? toggleWeeklyHabitCompletion(habit.id, today)
              : toggleDailyHabitCompletion(habit.id, today)
          }
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{habit.title}</p>
        <p className="text-xs text-gray-500">
          {habitFrequencyLabel(habit)}
          {!active && today < habit.startDate && ' · not started yet'}
          {!active && habit.endDate && today > habit.endDate && ' · ended'}
        </p>
      </div>

      <Badge tone="indigo">{expected > 0 ? `${completed}/${expected}` : '—'}</Badge>

      <IconButton
        label="Delete"
        tone="danger"
        onClick={() => confirm(`Delete habit "${habit.title}"?`) && deleteHabit(habit.id)}
      >
        <TrashIcon width={16} height={16} />
      </IconButton>
    </div>
  );
}

export default function HabitsPage() {
  const habits = useLiveQuery(
    () => db.habits.toArray().then((h) => h.sort((a, b) => compareOptionalDates(a.endDate, b.endDate))),
    [],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const today = localISODate();

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <PageHeader
        title="Habits"
        action={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Add
          </Button>
        }
      />

      <Card className="flex flex-1 flex-col p-0">
        {!habits ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">Loading…</div>
        ) : habits.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-300">
              <FlameIcon />
            </div>
            <p className="text-sm text-gray-500">No habits yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {habits.map((habit) => (
              <HabitRow key={habit.id} habit={habit} today={today} />
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Habit">
        <NewHabitForm onCancel={() => setModalOpen(false)} onSaved={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
