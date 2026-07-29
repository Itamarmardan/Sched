'use client';

import { useState, FormEvent } from 'react';
import { toDateTimeLocalValue } from '@/lib/dateRange';
import type { CalendarEventDTO } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';

export type EventFormValues = {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
};

function defaultValues(initial?: CalendarEventDTO): EventFormValues {
  if (initial) {
    return {
      title: initial.title,
      description: initial.description ?? '',
      location: initial.location ?? '',
      start: initial.allDay ? initial.start.slice(0, 10) : toDateTimeLocalValue(initial.start),
      end: initial.allDay ? initial.end.slice(0, 10) : toDateTimeLocalValue(initial.end),
      allDay: initial.allDay,
    };
  }
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    title: '',
    description: '',
    location: '',
    start: toDateTimeLocalValue(now.toISOString()),
    end: toDateTimeLocalValue(inOneHour.toISOString()),
    allDay: false,
  };
}

export default function EventForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: CalendarEventDTO;
  onSubmit: (values: EventFormValues) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<EventFormValues>(() => defaultValues(initial));

  function update<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
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

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <Checkbox
          checked={values.allDay}
          onChange={(e) => update('allDay', e.target.checked)}
        />
        All day
      </label>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">Start</label>
          <Input
            required
            type={values.allDay ? 'date' : 'datetime-local'}
            value={values.start}
            onChange={(e) => update('start', e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">End</label>
          <Input
            required
            type={values.allDay ? 'date' : 'datetime-local'}
            value={values.end}
            onChange={(e) => update('end', e.target.value)}
          />
        </div>
      </div>

      <Input
        placeholder="Location (optional)"
        value={values.location}
        onChange={(e) => update('location', e.target.value)}
      />

      <Textarea
        placeholder="Notes (optional)"
        value={values.description}
        onChange={(e) => update('description', e.target.value)}
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
