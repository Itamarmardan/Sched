'use client';

import { useState, FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Goal } from '@/lib/db/dexie';
import { createGoal, deleteGoal, toggleGoalCompletion, toggleRangeGoalCompleted } from '@/lib/db/repositories/goalsRepo';
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
import { TrashIcon, SparkleIcon } from '@/components/ui/icons';
import { localISODate, formatDueDate } from '@/lib/dateRange';

function NewGoalForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const today = localISODate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Goal['type']>('daily');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createGoal({ title, type, startDate, endDate, notes: notes || undefined });
    setSaving(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        required
        placeholder="Title, e.g. Read 10 pages"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Select value={type} onChange={(e) => setType(e.target.value as Goal['type'])}>
        <option value="daily">Daily (checked off each day in range)</option>
        <option value="range">Long-term (single goal, one completion)</option>
      </Select>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">
            {type === 'daily' ? 'Start' : 'Started'}
          </label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">
            {type === 'daily' ? 'End' : 'Target date'}
          </label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <Textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
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

function DailyGoalRow({ goal, today }: { goal: Goal; today: string }) {
  const completion = useLiveQuery(() => db.goalCompletions.get(`${goal.id}_${today}`), [goal.id, today]);
  const inRange = goal.startDate <= today && today <= goal.endDate;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Checkbox
        disabled={!inRange}
        checked={Boolean(completion?.completed)}
        onChange={() => toggleGoalCompletion(goal.id, today)}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{goal.title}</p>
        <p className="text-xs text-gray-500">
          {formatDueDate(goal.startDate)} – {formatDueDate(goal.endDate)}
          {!inRange && ' · not active today'}
        </p>
      </div>
      <Badge tone="indigo">Daily</Badge>
      <IconButton
        label="Delete"
        tone="danger"
        onClick={() => confirm(`Delete goal "${goal.title}"?`) && deleteGoal(goal.id)}
      >
        <TrashIcon width={16} height={16} />
      </IconButton>
    </div>
  );
}

function RangeGoalRow({ goal }: { goal: Goal }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Checkbox checked={Boolean(goal.completed)} onChange={() => toggleRangeGoalCompleted(goal.id)} />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-medium ${goal.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
          {goal.title}
        </p>
        <p className="text-xs text-gray-500">Target {formatDueDate(goal.endDate)}</p>
      </div>
      <Badge tone="neutral">Long-term</Badge>
      <IconButton
        label="Delete"
        tone="danger"
        onClick={() => confirm(`Delete goal "${goal.title}"?`) && deleteGoal(goal.id)}
      >
        <TrashIcon width={16} height={16} />
      </IconButton>
    </div>
  );
}

export default function GoalsPage() {
  const goals = useLiveQuery(() => db.goals.orderBy('endDate').toArray(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const today = localISODate();

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <PageHeader
        title="Goals"
        action={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Add
          </Button>
        }
      />

      <Card className="flex flex-1 flex-col p-0">
        {!goals ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">Loading…</div>
        ) : goals.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-300">
              <SparkleIcon />
            </div>
            <p className="text-sm text-gray-500">No goals yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {goals.map((goal) =>
              goal.type === 'daily' ? (
                <DailyGoalRow key={goal.id} goal={goal} today={today} />
              ) : (
                <RangeGoalRow key={goal.id} goal={goal} />
              ),
            )}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Goal">
        <NewGoalForm onCancel={() => setModalOpen(false)} onSaved={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
