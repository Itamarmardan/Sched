'use client';

import { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { CalendarIcon, PencilIcon, TrashIcon } from '@/components/ui/icons';
import EventForm, { EventFormValues } from '@/components/calendar/EventForm';
import { isoDateOnly, formatEventWhen } from '@/lib/dateRange';
import type { CalendarEventDTO } from '@/lib/types';

function toApiPayload(values: EventFormValues) {
  return {
    title: values.title,
    description: values.description || undefined,
    location: values.location || undefined,
    start: values.allDay ? values.start : new Date(values.start).toISOString(),
    end: values.allDay ? values.end : new Date(values.end).toISOString(),
    allDay: values.allDay,
  };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEventDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = new Date();
    start.setDate(start.getDate() - 1);
    const end = new Date();
    end.setDate(end.getDate() + 30);

    try {
      const res = await fetch(`/api/caldav/events?start=${isoDateOnly(start)}&end=${isoDateOnly(end)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load events.');
      setEvents(data.events);
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

  async function handleCreate(values: EventFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/caldav/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiPayload(values)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event.');
      setModalOpen(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(values: EventFormValues) {
    if (!editing) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/caldav/events/${encodeURIComponent(editing.uid)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiPayload(values)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update event.');
      setEditing(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(uid: string) {
    if (!confirm('Delete this event?')) return;
    try {
      const res = await fetch(`/api/caldav/events/${encodeURIComponent(uid)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete event.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <PageHeader
        title="Calendar"
        action={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Add
          </Button>
        }
      />

      {error && (
        <div className="mb-4 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card className="flex flex-1 flex-col p-0">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">Loading…</div>
        ) : events.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-300">
              <CalendarIcon />
            </div>
            <p className="text-sm text-gray-500">No events in the next 30 days.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <div key={event.uid} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <CalendarIcon width={16} height={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatEventWhen(event.start, event.end, event.allDay)}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton label="Edit" onClick={() => setEditing(event)}>
                    <PencilIcon width={16} height={16} />
                  </IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => handleDelete(event.uid)}>
                    <TrashIcon width={16} height={16} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Event">
        <EventForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} submitting={submitting} />
      </Modal>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit Event">
        {editing && (
          <EventForm
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
