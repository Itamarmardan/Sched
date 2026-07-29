'use client';

import { useState, FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LogEntry } from '@/lib/db/dexie';
import { createLogEntry, updateLogEntry, deleteLogEntry } from '@/lib/db/repositories/logRepo';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import PageHeader from '@/components/ui/PageHeader';
import { TrashIcon } from '@/components/ui/icons';
import { localISODate, formatDueDate } from '@/lib/dateRange';

type FormValues = { date: string; title: string; body: string; tags: string };

function toFormValues(entry?: LogEntry): FormValues {
  return {
    date: entry?.date ?? localISODate(),
    title: entry?.title ?? '',
    body: entry?.body ?? '',
    tags: entry?.tags?.join(', ') ?? '',
  };
}

function LogForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: LogEntry;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(initial));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const tags = values.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const input = { date: values.date, title: values.title || undefined, body: values.body, tags };
    if (initial) {
      await updateLogEntry(initial.id, input);
    } else {
      await createLogEntry(input);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="date"
        value={values.date}
        onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
      />
      <Input
        placeholder="Title (optional)"
        value={values.title}
        onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
      />
      <Textarea
        required
        placeholder="What happened / what was decided…"
        value={values.body}
        onChange={(e) => setValues((v) => ({ ...v, body: e.target.value }))}
        rows={5}
      />
      <Input
        placeholder="Tags, comma separated (optional)"
        value={values.tags}
        onChange={(e) => setValues((v) => ({ ...v, tags: e.target.value }))}
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

export default function LogPage() {
  const entries = useLiveQuery(() => db.logEntries.orderBy('date').reverse().toArray(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LogEntry | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Delete this log entry?')) return;
    await deleteLogEntry(id);
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <PageHeader
        title="Past Log"
        action={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Add
          </Button>
        }
      />

      <Card className="flex flex-1 flex-col p-0">
        {!entries ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-500">No log entries yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <div key={entry.id} onClick={() => setEditing(entry)} className="flex cursor-pointer items-start gap-2 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">{formatDueDate(entry.date)}</p>
                  {entry.title && <p className="font-medium text-gray-900">{entry.title}</p>}
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{entry.body}</p>
                  {entry.tags && entry.tags.length > 0 && (
                    <p className="mt-1 text-xs text-indigo-600">{entry.tags.map((t) => `#${t}`).join(' ')}</p>
                  )}
                </div>
                <IconButton
                  label="Delete"
                  tone="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(entry.id);
                  }}
                >
                  <TrashIcon width={16} height={16} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Log Entry">
        <LogForm onCancel={() => setModalOpen(false)} onSaved={() => setModalOpen(false)} />
      </Modal>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit Log Entry">
        {editing && (
          <LogForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  );
}
