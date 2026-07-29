'use client';

import { useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import type { ReminderDTO } from '@/lib/types';

export type ReminderFormValues = {
  title: string;
  notes: string;
  dueDate: string; // yyyy-mm-dd or ''
};

function defaultValues(initial?: ReminderDTO): ReminderFormValues {
  return {
    title: initial?.title ?? '',
    notes: initial?.notes ?? '',
    dueDate: initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
  };
}

export default function ReminderForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: ReminderDTO;
  onSubmit: (values: ReminderFormValues) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<ReminderFormValues>(() => defaultValues(initial));

  function update<K extends keyof ReminderFormValues>(key: K, value: ReminderFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        required
        placeholder="Title"
        value={values.title}
        onChange={(e) => update('title', e.target.value)}
      />

      <div>
        <label className="mb-1 block text-xs text-gray-500">Due date (optional)</label>
        <Input type="date" value={values.dueDate} onChange={(e) => update('dueDate', e.target.value)} />
      </div>

      <Textarea
        placeholder="Notes (optional)"
        value={values.notes}
        onChange={(e) => update('notes', e.target.value)}
        rows={3}
      />

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
