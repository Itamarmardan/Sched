'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { createPerson } from '@/lib/db/repositories/peopleRepo';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { ChevronRightIcon } from '@/components/ui/icons';

function NewPersonForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createPerson({ name, role: role || undefined, notes });
    setSaving(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        required
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Role (optional)"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />
      <Textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
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

export default function PeoplePage() {
  const people = useLiveQuery(() => db.people.orderBy('name').toArray(), []);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="px-4 py-6">
      <PageHeader
        title="People"
        action={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Add
          </Button>
        }
      />

      <Card className="p-0">
        {!people ? (
          <div className="px-4 py-8 text-center text-gray-400">Loading…</div>
        ) : people.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No people yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {people.map((person) => (
              <Link key={person.id} href={`/people/${person.id}`} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
                  {person.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{person.name}</p>
                  {person.role && <p className="truncate text-sm text-gray-500">{person.role}</p>}
                </div>
                <ChevronRightIcon width={18} height={18} className="shrink-0 text-gray-300" />
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Person">
        <NewPersonForm onCancel={() => setModalOpen(false)} onSaved={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
