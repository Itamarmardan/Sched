'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '@/lib/db/dexie';
import { updatePerson, deletePerson } from '@/lib/db/repositories/peopleRepo';
import { createTask, updateTask, deleteTask, setTaskStatus } from '@/lib/db/repositories/tasksRepo';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import { PencilIcon, TrashIcon, SparkleIcon } from '@/components/ui/icons';
import TaskForm, { TaskFormValues } from '@/components/tasks/TaskForm';
import { formatDueDate } from '@/lib/dateRange';

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const person = useLiveQuery(() => db.people.get(id), [id]);
  const tasks = useLiveQuery(() => db.tasks.where('personId').equals(id).toArray(), [id]);

  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  function startEditingProfile() {
    if (!person) return;
    setName(person.name);
    setRole(person.role ?? '');
    setNotes(person.notes);
    setEditingProfile(true);
  }

  async function saveProfile() {
    await updatePerson(id, { name, role: role || undefined, notes });
    setEditingProfile(false);
  }

  async function handleDeletePerson() {
    if (!confirm(`Delete ${person?.name}? Their tasks will be unlinked, not deleted.`)) return;
    await deletePerson(id);
    router.replace('/people');
  }

  async function handleCreateTask(values: TaskFormValues) {
    await createTask({
      title: values.title,
      checklist: values.checklist,
      dueDate: values.dueDate || undefined,
      dueTime: values.dueTime || undefined,
      category: values.category || undefined,
      personId: id,
      notes: values.notes || undefined,
    });
    setTaskModalOpen(false);
  }

  async function handleUpdateTask(values: TaskFormValues) {
    if (!editingTask) return;
    await updateTask(editingTask.id, {
      title: values.title,
      checklist: values.checklist,
      dueDate: values.dueDate || undefined,
      dueTime: values.dueTime || undefined,
      category: values.category || undefined,
      personId: id,
      notes: values.notes || undefined,
    });
    setEditingTask(null);
  }

  if (!person) {
    return (
      <div className="px-4 py-6">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-lg font-semibold text-indigo-600">
          {person.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">{person.name}</h1>
          {person.role && <p className="text-sm text-gray-500">{person.role}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton label="Edit" onClick={startEditingProfile}>
            <PencilIcon width={16} height={16} />
          </IconButton>
          <IconButton label="Delete" tone="danger" onClick={handleDeletePerson}>
            <TrashIcon width={16} height={16} />
          </IconButton>
        </div>
      </div>

      {person.notes && <p className="mb-6 whitespace-pre-wrap text-sm text-gray-700">{person.notes}</p>}

      <div className="mb-2.5 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tasks</h2>
        <Button variant="primary" size="sm" onClick={() => setTaskModalOpen(true)}>
          + Add
        </Button>
      </div>

      <Card className="p-0">
        {!tasks ? (
          <div className="px-4 py-8 text-center text-gray-500">Loading…</div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-300">
              <SparkleIcon />
            </div>
            <p className="text-sm text-gray-500">No tasks for {person.name} yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                <Checkbox
                  checked={task.status === 'done'}
                  onChange={() => setTaskStatus(task.id, task.status === 'done' ? 'open' : 'done')}
                />
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setEditingTask(task)}>
                  <p className={`truncate font-medium ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {task.dueDate ? formatDueDate(task.dueDate) : 'No due date'}
                  </p>
                </div>
                <IconButton label="Delete" tone="danger" onClick={() => deleteTask(task.id)}>
                  <TrashIcon width={16} height={16} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={editingProfile} onClose={() => setEditingProfile(false)} title="Edit Person">
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <Input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role (optional)"
          />
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            rows={4}
          />
          <div className="flex gap-2 pt-2">
            <Button onClick={() => setEditingProfile(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={saveProfile} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} title={`New Task for ${person.name}`}>
        <TaskForm
          defaultPersonId={id}
          hidePersonField
          onCancel={() => setTaskModalOpen(false)}
          onSubmit={handleCreateTask}
        />
      </Modal>

      <Modal open={editingTask !== null} onClose={() => setEditingTask(null)} title="Edit Task">
        {editingTask && (
          <TaskForm
            initial={editingTask}
            defaultPersonId={id}
            hidePersonField
            onCancel={() => setEditingTask(null)}
            onSubmit={handleUpdateTask}
          />
        )}
      </Modal>
    </div>
  );
}
