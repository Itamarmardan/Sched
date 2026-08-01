import Dexie, { type EntityTable } from 'dexie';

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type Person = {
  id: string;
  name: string;
  role?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  color?: string;
};

export type Task = {
  id: string;
  title: string;
  checklist: ChecklistItem[];
  dueDate?: string; // ISO date, e.g. 2026-07-29
  dueTime?: string; // HH:mm
  category?: string;
  personId?: string;
  status: 'open' | 'done';
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'blocked' | 'done';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectItem = {
  id: string;
  projectId: string;
  title: string;
  dueDate?: string;
  done: boolean;
  order: number;
};

export type Goal = {
  id: string;
  title: string;
  type: 'daily' | 'range';
  startDate: string;
  endDate: string;
  notes?: string;
  completed?: boolean; // used for 'range' (long-term, single completion) goals only
  createdAt: string;
  updatedAt: string;
};

export type GoalCompletion = {
  id: string; // `${goalId}_${date}`
  goalId: string;
  date: string;
  completed: boolean;
};

export type LogEntry = {
  id: string;
  date: string;
  title?: string;
  body: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

export type HabitFrequency = 'daily' | 'times_per_day' | 'weekly';

export type Habit = {
  id: string;
  title: string;
  frequency: HabitFrequency;
  timesPerDay?: number; // only meaningful when frequency === 'times_per_day'
  startDate: string; // ISO date
  endDate?: string; // ISO date; omitted means no end
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type HabitCompletion = {
  id: string; // `${habitId}_${dateOrWeekKey}`
  habitId: string;
  date: string; // ISO date for daily/times_per_day; ISO-week key (e.g. 2026-W05) for weekly
  count: number; // times completed for that date/week
};

export type Setting = {
  key: string;
  value: string;
};

const db = new Dexie('SchedDatabase') as Dexie & {
  notes: EntityTable<Note, 'id'>;
  people: EntityTable<Person, 'id'>;
  categories: EntityTable<Category, 'id'>;
  tasks: EntityTable<Task, 'id'>;
  projects: EntityTable<Project, 'id'>;
  projectItems: EntityTable<ProjectItem, 'id'>;
  goals: EntityTable<Goal, 'id'>;
  goalCompletions: EntityTable<GoalCompletion, 'id'>;
  logEntries: EntityTable<LogEntry, 'id'>;
  habits: EntityTable<Habit, 'id'>;
  habitCompletions: EntityTable<HabitCompletion, 'id'>;
  settings: EntityTable<Setting, 'key'>;
};

db.version(1).stores({
  notes: 'id, updatedAt, createdAt, *tags',
  people: 'id, name, updatedAt',
  categories: 'id, name',
  tasks: 'id, dueDate, personId, category, status, updatedAt',
  projects: 'id, status, dueDate, updatedAt',
  projectItems: 'id, projectId, dueDate, done, order',
  goals: 'id, type, startDate, endDate, updatedAt',
  goalCompletions: 'id, goalId, date',
  logEntries: 'id, date, updatedAt',
});

db.version(2).stores({
  habits: 'id, startDate, endDate, updatedAt',
  habitCompletions: 'id, habitId, date',
  settings: 'key',
});

export { db };
