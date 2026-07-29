'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '@/lib/db/dexie';
import { createTask, updateTask, deleteTask, setTaskStatus } from '@/lib/db/repositories/tasksRepo';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import { TrashIcon, SparkleIcon } from '@/components/ui/icons';
import TaskForm, { TaskFormValues } from '@/components/tasks/TaskForm';
import { formatDueDate, compareOptionalDates } from '@/lib/dateRange';

export default function TasksPage() {
  const tasks = useLiveQuery(
    () => db.tasks.toArray().then((t) => t.sort((a, b) => compareOptionalDates(a.dueDate, b.dueDate))),
    [],
  );
  const people = useLiveQuery(() => db.people.toArray(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [showDone, setShowDone] = useState(false);

  const personName = (id?: string) => people?.find((p) => p.id === id)?.name;

  async function handleCreate(values: TaskFormValues) {
    await createTask({
      title: values.title,
      checklist: values.checklist,
      dueDate: values.dueDate || undefined,
      dueTime: values.dueTime || undefined,
      category: values.category || undefined,
      personId: values.personId || undefined,
      notes: values.notes || undefined,
    });
    setModalOpen(false);
  }

  async function handleUpdate(values: TaskFormValues) {
    if (!editing) return;
    await updateTask(editing.id, {
      title: values.title,
      checklist: values.checklist,
      dueDate: values.dueDate || undefined,
      dueTime: values.dueTime || undefined,
      category: values.category || undefined,
      personId: values.personId || undefined,
      notes: values.notes || undefined,
    });
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return;
    await deleteTask(id);
  }

  const visibleTasks = (tasks ?? []).filter((t) => showDone || t.status === 'open');

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <PageHeader
        title="Tasks"
        action={
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Add
          </Button>
        }
      />

      <label className="mb-4 flex shrink-0 items-center gap-2 text-sm text-gray-500">
        <Checkbox checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
        Show done
      </label>

      <Card className="flex flex-1 flex-col p-0">
        {!tasks ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">Loading…</div>
        ) : visibleTasks.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-300">
              <SparkleIcon />
            </div>
            <p className="text-sm text-gray-500">No tasks.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {visibleTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                <Checkbox
                  checked={task.status === 'done'}
                  onChange={() => setTaskStatus(task.id, task.status === 'done' ? 'open' : 'done')}
                />
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setEditing(task)}>
                  <p className={`truncate font-medium ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {task.dueDate ? formatDueDate(task.dueDate) : 'No due date'}
                    {task.checklist.length > 0 &&
                      ` · ${task.checklist.filter((i) => i.done).length}/${task.checklist.length} done`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {task.category && <Badge tone="neutral">{task.category}</Badge>}
                  {personName(task.personId) && <Badge tone="indigo">{personName(task.personId)}</Badge>}
                  <IconButton label="Delete" tone="danger" onClick={() => handleDelete(task.id)}>
                    <TrashIcon width={16} height={16} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Task">
        <TaskForm onCancel={() => setModalOpen(false)} onSubmit={handleCreate} />
      </Modal>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit Task">
        {editing && <TaskForm initial={editing} onCancel={() => setEditing(null)} onSubmit={handleUpdate} />}
      </Modal>
    </div>
  );
}
