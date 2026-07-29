'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '@/lib/db/dexie';
import { createProject } from '@/lib/db/repositories/projectsRepo';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import { ChevronRightIcon } from '@/components/ui/icons';
import { formatDueDate, compareOptionalDates } from '@/lib/dateRange';

const STATUS_LABEL: Record<Project['status'], string> = {
  planning: 'Planning',
  active: 'Active',
  blocked: 'Blocked',
  done: 'Done',
};

const STATUS_TONE: Record<Project['status'], 'neutral' | 'indigo' | 'green' | 'amber'> = {
  planning: 'neutral',
  active: 'indigo',
  blocked: 'amber',
  done: 'green',
};

function NewProjectForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Project['status']>('planning');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createProject({ title, description, status, dueDate: dueDate || undefined });
    setSaving(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        required
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <Select value={status} onChange={(e) => setStatus(e.target.value as Project['status'])}>
        {Object.entries(STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
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

export default function ProjectsPage() {
  const projects = useLiveQuery(
    () => db.projects.toArray().then((p) => p.sort((a, b) => compareOptionalDates(a.dueDate, b.dueDate))),
    [],
  );
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="px-4 py-6">
      <PageHeader
        title="Projects"
        action={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Add
          </Button>
        }
      />

      <Card className="p-0">
        {!projects ? (
          <div className="px-4 py-8 text-center text-gray-400">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No projects yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{project.title}</p>
                  {project.dueDate && <p className="text-xs text-gray-500">Due {formatDueDate(project.dueDate)}</p>}
                </div>
                <Badge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</Badge>
                <ChevronRightIcon width={18} height={18} className="shrink-0 text-gray-300" />
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Project">
        <NewProjectForm onCancel={() => setModalOpen(false)} onSaved={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
