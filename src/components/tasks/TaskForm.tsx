'use client';

import { useState, FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task, type ChecklistItem } from '@/lib/db/dexie';
import { createCategory } from '@/lib/db/repositories/categoriesRepo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import IconButton from '@/components/ui/IconButton';
import { TrashIcon } from '@/components/ui/icons';

export type TaskFormValues = {
  title: string;
  dueDate: string;
  dueTime: string;
  category: string;
  personId: string;
  notes: string;
  checklist: ChecklistItem[];
};

function toFormValues(task?: Task, defaultPersonId?: string): TaskFormValues {
  return {
    title: task?.title ?? '',
    dueDate: task?.dueDate ?? '',
    dueTime: task?.dueTime ?? '',
    category: task?.category ?? '',
    personId: task?.personId ?? defaultPersonId ?? '',
    notes: task?.notes ?? '',
    checklist: task?.checklist ?? [],
  };
}

export default function TaskForm({
  initial,
  defaultPersonId,
  hidePersonField,
  onCancel,
  onSubmit,
}: {
  initial?: Task;
  defaultPersonId?: string;
  hidePersonField?: boolean;
  onCancel: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<TaskFormValues>(() => toFormValues(initial, defaultPersonId));
  const [newItemText, setNewItemText] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), []);
  const people = useLiveQuery(() => db.people.orderBy('name').toArray(), []);

  function update<K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addChecklistItem() {
    if (!newItemText.trim()) return;
    update('checklist', [...values.checklist, { id: crypto.randomUUID(), text: newItemText.trim(), done: false }]);
    setNewItemText('');
  }

  function toggleChecklistItem(id: string) {
    update(
      'checklist',
      values.checklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  }

  function removeChecklistItem(id: string) {
    update('checklist', values.checklist.filter((item) => item.id !== id));
  }

  async function handleAddCategory() {
    const name = prompt('New category name');
    if (!name?.trim()) return;
    const category = await createCategory(name.trim());
    update('category', category.name);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit(values);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        required
        placeholder="Title"
        value={values.title}
        onChange={(e) => update('title', e.target.value)}
      />

      <div className="flex gap-2">
        <Input
          type="date"
          value={values.dueDate}
          onChange={(e) => update('dueDate', e.target.value)}
          className="flex-1"
        />
        <Input
          type="time"
          value={values.dueTime}
          onChange={(e) => update('dueTime', e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="flex gap-2">
        <Select
          value={values.category}
          onChange={(e) => update('category', e.target.value)}
          className="flex-1"
        >
          <option value="">No category</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
        <Button type="button" onClick={handleAddCategory}>
          + Category
        </Button>
      </div>

      {!hidePersonField && (
        <Select value={values.personId} onChange={(e) => update('personId', e.target.value)}>
          <option value="">Not linked to a person</option>
          {people?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      )}

      <div>
        <label className="mb-1 block text-xs text-gray-500">Checklist</label>
        {values.checklist.length > 0 && (
          <div className="mb-2 divide-y divide-gray-200 rounded-xl bg-gray-50">
            {values.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2">
                <Checkbox checked={item.done} onChange={() => toggleChecklistItem(item.id)} />
                <span className={`flex-1 text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                  {item.text}
                </span>
                <IconButton label="Remove item" tone="danger" onClick={() => removeChecklistItem(item.id)}>
                  <TrashIcon width={14} height={14} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Add checklist item"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addChecklistItem();
              }
            }}
            className="flex-1 text-sm"
          />
          <Button type="button" onClick={addChecklistItem}>
            Add
          </Button>
        </div>
      </div>

      <Textarea
        placeholder="Notes (optional)"
        value={values.notes}
        onChange={(e) => update('notes', e.target.value)}
        rows={2}
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
