import type { ComponentType } from 'react';
import {
  CheckSquareIcon,
  TargetIcon,
  FlameIcon,
  BellIcon,
  NoteIcon,
  UsersIcon,
  FolderIcon,
  BookIcon,
  type IconProps,
} from '@/components/ui/icons';

export type NavCategoryKey =
  | 'tasks'
  | 'goals'
  | 'habits'
  | 'reminders'
  | 'notes'
  | 'people'
  | 'projects'
  | 'log';

export type NavCategory = {
  href: string;
  label: string;
  description: string;
  Icon: ComponentType<IconProps>;
};

// Home and Calendar are permanent nav slots; these are the choices for the two
// configurable slots (Settings > Bottom Tabs) and for the "More" list of everything else.
export const NAV_CATEGORIES: Record<NavCategoryKey, NavCategory> = {
  tasks: { href: '/tasks', label: 'Tasks', description: 'Checklists, categories, and deadlines', Icon: CheckSquareIcon },
  goals: { href: '/goals', label: 'Goals', description: 'Daily and long-term goals', Icon: TargetIcon },
  habits: { href: '/habits', label: 'Habits', description: 'Recurring habits with streak tracking', Icon: FlameIcon },
  reminders: { href: '/reminders', label: 'Reminders', description: 'Apple Reminders', Icon: BellIcon },
  notes: { href: '/notes', label: 'Notes', description: 'Quick freeform notes', Icon: NoteIcon },
  people: { href: '/people', label: 'People', description: 'Colleagues and their tasks', Icon: UsersIcon },
  projects: { href: '/projects', label: 'Projects', description: 'Longer-term work with checklists', Icon: FolderIcon },
  log: { href: '/log', label: 'Past Log', description: 'Decisions and meetings', Icon: BookIcon },
};

export const NAV_CATEGORY_KEYS = Object.keys(NAV_CATEGORIES) as NavCategoryKey[];

export const DEFAULT_NAV_SLOTS: [NavCategoryKey, NavCategoryKey] = ['tasks', 'goals'];
