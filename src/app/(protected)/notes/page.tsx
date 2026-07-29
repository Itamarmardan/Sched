'use client';

import { useState, FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Note } from '@/lib/db/dexie';
import { createNote, updateNote, deleteNote } from '@/lib/db/repositories/notesRepo';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import PageHeader from '@/components/ui/PageHeader';
import { TrashIcon } from '@/components/ui/icons';

type FormValues = { title: string; body: string; tags: string };

function toFormValues(note?: Note): FormValues {
  return {
    title: note?.title ?? '',
    body: note?.body ?? '',
    tags: note?.tags.join(', ') ?? '',
  };
}

function NoteForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: Note;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(initial));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const tags = values.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (initial) {
      await updateNote(initial.id, { title: values.title, body: values.body, tags });
    } else {
      await createNote({ title: values.title, body: values.body, tags });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        required
        placeholder="Title"
        value={values.title}
        onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
      />
      <Textarea
        placeholder="Write something…"
        value={values.body}
        onChange={(e) => setValues((v) => ({ ...v, body: e.target.value }))}
        rows={6}
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

export default function NotesPage() {
  const notes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Delete this note?')) return;
    await deleteNote(id);
  }

  return (
    <div className="px-4 py-6">
      <PageHeader
        title="Notes"
        action={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            + New
          </Button>
        }
      />

      <Card className="p-0">
        {!notes ? (
          <div className="px-4 py-8 text-center text-gray-500">Loading…</div>
        ) : notes.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">No notes yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex cursor-pointer items-center gap-2 px-4 py-3"
                onClick={() => setEditing(note)}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{note.title}</p>
                  <p className="truncate text-sm text-gray-500">{note.body}</p>
                  {note.tags.length > 0 && (
                    <p className="mt-1 text-xs text-indigo-600">{note.tags.map((t) => `#${t}`).join(' ')}</p>
                  )}
                </div>
                <IconButton
                  label="Delete"
                  tone="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(note.id);
                  }}
                >
                  <TrashIcon width={16} height={16} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Note">
        <NoteForm onCancel={() => setModalOpen(false)} onSaved={() => setModalOpen(false)} />
      </Modal>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit Note">
        {editing && (
          <NoteForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => setEditing(null)} />
        )}
      </Modal>
    </div>
  );
}
