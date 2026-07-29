'use client';

import { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import PageHeader from '@/components/ui/PageHeader';
import { BellIcon, PencilIcon, TrashIcon } from '@/components/ui/icons';
import ReminderForm, { ReminderFormValues } from '@/components/reminders/ReminderForm';
import { formatDueDate } from '@/lib/dateRange';
import type { ReminderDTO } from '@/lib/types';

function toApiPayload(values: ReminderFormValues, completed: boolean) {
  return {
    title: values.title,
    notes: values.notes || undefined,
    dueDate: values.dueDate || undefined,
    completed,
  };
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReminderDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/caldav/reminders');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load reminders.');
      setReminders(data.reminders);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Standard fetch-on-mount: `load` sets loading/error/data state as it runs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleCreate(values: ReminderFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/caldav/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiPayload(values, false)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create reminder.');
      setModalOpen(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(values: ReminderFormValues) {
    if (!editing) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/caldav/reminders/${encodeURIComponent(editing.uid)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiPayload(values, editing.completed)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update reminder.');
      setEditing(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleComplete(reminder: ReminderDTO) {
    try {
      const res = await fetch(`/api/caldav/reminders/${encodeURIComponent(reminder.uid)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reminder.title,
          notes: reminder.notes,
          dueDate: reminder.dueDate,
          completed: !reminder.completed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update reminder.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(uid: string) {
    if (!confirm('Delete this reminder?')) return;
    try {
      const res = await fetch(`/api/caldav/reminders/${encodeURIComponent(uid)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete reminder.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const visibleReminders = reminders.filter((r) => showCompleted || !r.completed);

  return (
    <div className="px-4 py-6">
      <PageHeader
        title="Reminders"
        action={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Add
          </Button>
        }
      />

      <label className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Checkbox checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
        Show completed
      </label>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card className="p-0">
        {loading ? (
          <div className="px-4 py-8 text-center text-gray-400">Loading…</div>
        ) : visibleReminders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-300">
              <BellIcon />
            </div>
            <p className="text-sm text-gray-400">Nothing here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleReminders.map((reminder) => (
              <div key={reminder.uid} className="flex items-center gap-3 px-4 py-3">
                <Checkbox checked={reminder.completed} onChange={() => handleToggleComplete(reminder)} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium ${reminder.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {reminder.title}
                  </p>
                  <p className="text-xs text-gray-500">{formatDueDate(reminder.dueDate)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton label="Edit" onClick={() => setEditing(reminder)}>
                    <PencilIcon width={16} height={16} />
                  </IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => handleDelete(reminder.uid)}>
                    <TrashIcon width={16} height={16} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Reminder">
        <ReminderForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} submitting={submitting} />
      </Modal>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit Reminder">
        {editing && (
          <ReminderForm
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitting={submitting}
          />
        )}
      </Modal>
    </div>
  );
}
