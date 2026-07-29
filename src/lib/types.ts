export type CalendarEventDTO = {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  allDay: boolean;
};

export type ReminderDTO = {
  uid: string;
  title: string;
  notes?: string;
  dueDate?: string; // ISO 8601 date or date-time
  completed: boolean;
};

// Thin server-side index (title + due date only, no content) used purely to let the
// notification cron job know what's due. Full task/project data stays in local IndexedDB.
export type ReminderIndexType = 'task' | 'project_item';

export type ReminderIndexEntry = {
  id: string;
  type: ReminderIndexType;
  title: string;
  dueDate: string; // ISO date
  dueTime?: string; // HH:mm
  personName?: string;
};
