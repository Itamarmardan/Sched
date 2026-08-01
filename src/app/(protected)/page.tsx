'use client';

import { useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { toggleGoalCompletion } from '@/lib/db/repositories/goalsRepo';
import { setTaskStatus } from '@/lib/db/repositories/tasksRepo';
import {
  toggleDailyHabitCompletion,
  toggleWeeklyHabitCompletion,
  setTimesPerDayCompletionCount,
} from '@/lib/db/repositories/habitsRepo';
import { isHabitActive, todayCompletionCount, habitFrequencyLabel } from '@/lib/habits';
import { isoDateOnly, localISODate, addDays } from '@/lib/dateRange';
import type { CalendarEventDTO, ReminderDTO } from '@/lib/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Checkbox from '@/components/ui/Checkbox';
import IconButton from '@/components/ui/IconButton';
import { CalendarIcon, BellIcon, SparkleIcon, FlameIcon } from '@/components/ui/icons';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function DashboardHeader() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Client-only: avoids a server/client hydration mismatch on the current time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
  }, []);

  return (
    <header className="mb-7">
      <p className="text-sm font-medium text-indigo-600">{now ? greetingForHour(now.getHours()) : 'Welcome back'}</p>
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
        {now
          ? now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
          : 'Your day'}
      </h1>
    </header>
  );
}

function SectionHeading({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between px-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      <Link href={href} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
        {linkLabel} →
      </Link>
    </div>
  );
}

function EmptyRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-300">{icon}</div>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

function AgendaRow({
  icon,
  tone,
  timeLabel,
  title,
}: {
  icon: ReactNode;
  tone: 'indigo' | 'amber';
  timeLabel: string;
  title: string;
}) {
  const toneClasses = tone === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600';
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClasses}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{timeLabel}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const today = localISODate();
  const tomorrow = addDays(today, 1);

  const [events, setEvents] = useState<CalendarEventDTO[] | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<ReminderDTO[] | null>(null);
  const [remindersError, setRemindersError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const start = new Date();
      const end = new Date(Date.now() + 24 * 60 * 60 * 1000);
      try {
        const res = await fetch(`/api/caldav/events?start=${isoDateOnly(start)}&end=${isoDateOnly(end)}`);
        const data = await res.json();
        if (ignore) return;
        if (!res.ok) throw new Error(data.error || 'Failed to load calendar.');
        setEvents(data.events);
      } catch (err) {
        if (!ignore) setEventsError((err as Error).message);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch('/api/caldav/reminders');
        const data = await res.json();
        if (ignore) return;
        if (!res.ok) throw new Error(data.error || 'Failed to load reminders.');
        setReminders(data.reminders);
      } catch (err) {
        if (!ignore) setRemindersError((err as Error).message);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const dueTasks = useLiveQuery(
    () => db.tasks.where('dueDate').anyOf([today, tomorrow]).and((t) => t.status === 'open').toArray(),
    [today, tomorrow],
  );
  const people = useLiveQuery(() => db.people.toArray(), []);
  const goals = useLiveQuery(() => db.goals.toArray(), []);
  const todayCompletions = useLiveQuery(() => db.goalCompletions.where('date').equals(today).toArray(), [today]);
  const habits = useLiveQuery(() => db.habits.toArray(), []);
  const habitCompletions = useLiveQuery(() => db.habitCompletions.toArray(), []);

  const personName = (id?: string) => people?.find((p) => p.id === id)?.name;
  const todaysReminders = (reminders ?? []).filter((r) => r.dueDate && r.dueDate.slice(0, 10) === today && !r.completed);
  const activeDailyGoals = (goals ?? []).filter(
    (g) => g.type === 'daily' && g.startDate <= today && today <= g.endDate,
  );
  const activeHabits = (habits ?? []).filter((h) => isHabitActive(h, today));

  const agendaLoading = !events && !reminders && !eventsError && !remindersError;
  const agendaCount = todaysReminders.length + (events?.length ?? 0);
  const focusCount = (dueTasks?.length ?? 0) + activeDailyGoals.length;

  return (
    <div className="px-4 py-6">
      <DashboardHeader />

      <section className="mb-7">
        <SectionHeading title="Today" href="/calendar" linkLabel="Calendar" />
        <Card className="p-0">
          {eventsError && remindersError ? (
            <EmptyRow icon={<CalendarIcon />} text={eventsError} />
          ) : agendaLoading ? (
            <EmptyRow icon={<CalendarIcon />} text="Loading…" />
          ) : agendaCount === 0 ? (
            <EmptyRow icon={<CalendarIcon />} text="Nothing on your calendar today." />
          ) : (
            <div className="divide-y divide-gray-100">
              {todaysReminders.map((reminder) => (
                <AgendaRow
                  key={reminder.uid}
                  icon={<BellIcon width={16} height={16} />}
                  tone="amber"
                  timeLabel="Reminder"
                  title={reminder.title}
                />
              ))}
              {(events ?? []).map((event) => (
                <AgendaRow
                  key={event.uid}
                  icon={<CalendarIcon width={16} height={16} />}
                  tone="indigo"
                  timeLabel={
                    event.allDay
                      ? 'All day'
                      : new Date(event.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                  }
                  title={event.title}
                />
              ))}
            </div>
          )}
        </Card>
      </section>

      <section>
        <SectionHeading title="Focus" href="/tasks" linkLabel="Tasks" />
        <Card className="p-0">
          {!dueTasks || !goals ? (
            <EmptyRow icon={<SparkleIcon />} text="Loading…" />
          ) : focusCount === 0 ? (
            <EmptyRow icon={<SparkleIcon />} text="You're all caught up." />
          ) : (
            <div className="divide-y divide-gray-100">
              {dueTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                  <Checkbox checked={false} onChange={() => setTaskStatus(task.id, 'done')} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{task.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {task.dueDate === tomorrow && <Badge tone="amber">Tomorrow</Badge>}
                    {personName(task.personId) && <Badge tone="indigo">{personName(task.personId)}</Badge>}
                  </div>
                </div>
              ))}
              {activeDailyGoals.map((goal) => {
                const completed = Boolean(todayCompletions?.find((c) => c.goalId === goal.id)?.completed);
                return (
                  <div key={goal.id} className="flex items-center gap-3 px-4 py-3">
                    <Checkbox checked={completed} onChange={() => toggleGoalCompletion(goal.id, today)} />
                    <p className={`flex-1 truncate ${completed ? 'text-gray-500 line-through' : 'font-medium text-gray-900'}`}>
                      {goal.title}
                    </p>
                    <Badge tone="neutral">Daily goal</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      <section className="mt-7">
        <SectionHeading title="Habits" href="/habits" linkLabel="Habits" />
        <Card className="p-0">
          {!habits || !habitCompletions ? (
            <EmptyRow icon={<FlameIcon />} text="Loading…" />
          ) : activeHabits.length === 0 ? (
            <EmptyRow icon={<FlameIcon />} text="No habits due today." />
          ) : (
            <div className="divide-y divide-gray-100">
              {activeHabits.map((habit) => {
                const completions = habitCompletions.filter((c) => c.habitId === habit.id);
                const count = todayCompletionCount(habit, completions, today);
                return (
                  <div key={habit.id} className="flex items-center gap-3 px-4 py-3">
                    {habit.frequency === 'times_per_day' ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <IconButton
                          label="Fewer today"
                          disabled={count <= 0}
                          onClick={() => setTimesPerDayCompletionCount(habit.id, today, count - 1)}
                        >
                          <span className="text-lg leading-none">−</span>
                        </IconButton>
                        <span className="w-6 text-center text-sm font-medium text-gray-900">{count}</span>
                        <IconButton
                          label="One more today"
                          onClick={() => setTimesPerDayCompletionCount(habit.id, today, count + 1)}
                        >
                          <span className="text-lg leading-none">+</span>
                        </IconButton>
                      </div>
                    ) : (
                      <Checkbox
                        checked={count > 0}
                        onChange={() =>
                          habit.frequency === 'weekly'
                            ? toggleWeeklyHabitCompletion(habit.id, today)
                            : toggleDailyHabitCompletion(habit.id, today)
                        }
                      />
                    )}
                    <p
                      className={`flex-1 truncate ${
                        count > 0 && habit.frequency !== 'times_per_day'
                          ? 'text-gray-500 line-through'
                          : 'font-medium text-gray-900'
                      }`}
                    >
                      {habit.title}
                    </p>
                    <Badge tone="neutral">{habitFrequencyLabel(habit)}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
