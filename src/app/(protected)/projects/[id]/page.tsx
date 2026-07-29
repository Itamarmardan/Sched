'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '@/lib/db/dexie';
import {
  updateProject,
  deleteProject,
  createProjectItem,
  toggleProjectItem,
  deleteProjectItem,
} from '@/lib/db/repositories/projectsRepo';
import { formatDueDate } from '@/lib/dateRange';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import PageHeader from '@/components/ui/PageHeader';
import { TrashIcon } from '@/components/ui/icons';

const STATUS_LABEL: Record<Project['status'], string> = {
  planning: 'Planning',
  active: 'Active',
  blocked: 'Blocked',
  done: 'Done',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const project = useLiveQuery(() => db.projects.get(id), [id]);
  const items = useLiveQuery(
    () => db.projectItems.where('projectId').equals(id).sortBy('order'),
    [id],
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Project['status']>('planning');
  const [dueDate, setDueDate] = useState('');
  const [dirty, setDirty] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDue, setNewItemDue] = useState('');

  if (project && loadedId !== project.id) {
    // Seed local editable state whenever a (new) project has loaded.
    setLoadedId(project.id);
    setTitle(project.title);
    setDescription(project.description);
    setStatus(project.status);
    setDueDate(project.dueDate ?? '');
    setDirty(false);
  }

  async function saveProject() {
    await updateProject(id, { title, description, status, dueDate: dueDate || undefined });
    setDirty(false);
  }

  async function handleDeleteProject() {
    if (!confirm(`Delete project "${project?.title}"? This also deletes its checklist items.`)) return;
    await deleteProject(id);
    router.replace('/projects');
  }

  async function handleAddItem() {
    if (!newItemTitle.trim()) return;
    await createProjectItem(id, { title: newItemTitle.trim(), dueDate: newItemDue || undefined });
    setNewItemTitle('');
    setNewItemDue('');
  }

  if (!project) {
    return (
      <div className="px-4 py-6">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <PageHeader
        title="Project"
        action={
          <Button variant="danger" size="sm" onClick={handleDeleteProject}>
            Delete project
          </Button>
        }
      />

      <Card className="mb-6 space-y-3">
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          placeholder="Title"
        />
        <Textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setDirty(true);
          }}
          placeholder="Description"
          rows={3}
        />
        <div className="flex gap-2">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as Project['status']);
              setDirty(true);
            }}
            className="flex-1"
          >
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              setDirty(true);
            }}
            className="flex-1"
          />
        </div>
        {dirty && (
          <Button variant="primary" onClick={saveProject} className="w-full">
            Save changes
          </Button>
        )}
      </Card>

      <h2 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400">Checklist</h2>

      <Card className="mb-3 p-0">
        {!items ? (
          <div className="px-4 py-8 text-center text-gray-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No checklist items yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Checkbox checked={item.done} onChange={() => toggleProjectItem(item.id)} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate ${item.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.title}</p>
                  {item.dueDate && <p className="text-xs text-gray-400">{formatDueDate(item.dueDate)}</p>}
                </div>
                <IconButton label="Remove item" tone="danger" onClick={() => deleteProjectItem(item.id)}>
                  <TrashIcon width={16} height={16} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        <Input
          placeholder="Add checklist item"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddItem();
            }
          }}
          className="flex-1"
        />
        <Input
          type="date"
          value={newItemDue}
          onChange={(e) => setNewItemDue(e.target.value)}
          className="w-36"
        />
        <Button onClick={handleAddItem}>Add</Button>
      </div>
    </div>
  );
}
