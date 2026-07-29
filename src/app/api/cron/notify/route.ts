import { NextRequest, NextResponse } from 'next/server';
import { getAllReminderIndexEntries, getPushSubscription, wasNotified, markNotified } from '@/lib/kv/schema';
import { sendPush } from '@/lib/push/send';
import { listEvents } from '@/lib/caldav/events';
import { listReminders } from '@/lib/caldav/reminders';

export const runtime = 'nodejs';

// Server-clock (UTC on Vercel) based "today" — may be off by a day from the user's
// local date near midnight in their timezone. Acceptable for a single-user personal app.
function todayAndTomorrow(): { today: string; tomorrow: string } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrowDate = new Date(now);
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  return { today, tomorrow: tomorrowDate.toISOString().slice(0, 10) };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await getPushSubscription();
  if (!subscription) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 'no push subscription' });
  }

  const { today, tomorrow } = todayAndTomorrow();
  let sent = 0;
  const errors: string[] = [];

  // Local tasks / project items (thin index synced from the client).
  try {
    const entries = await getAllReminderIndexEntries();
    for (const entry of entries) {
      if (entry.dueDate !== today && entry.dueDate !== tomorrow) continue;
      if (await wasNotified(entry.id, entry.dueDate)) continue;

      const when = entry.dueDate === today ? 'today' : 'tomorrow';
      const suffix = entry.personName ? ` (${entry.personName})` : '';
      const ok = await sendPush(subscription, {
        title: entry.title,
        body: `Due ${when}${suffix}`,
        tag: entry.id,
      });
      if (ok) {
        sent += 1;
        await markNotified(entry.id, entry.dueDate);
      }
    }
  } catch (err) {
    errors.push(`reminder index: ${(err as Error).message}`);
  }

  // Apple Calendar events, queried live (never cached locally).
  try {
    const events = await listEvents({ start: today, end: tomorrow });
    for (const event of events) {
      const dateKey = event.start.slice(0, 10);
      if (dateKey !== today && dateKey !== tomorrow) continue;
      if (await wasNotified(event.uid, dateKey)) continue;

      const when = dateKey === today ? 'today' : 'tomorrow';
      const ok = await sendPush(subscription, {
        title: event.title,
        body: `On your calendar ${when}`,
        tag: event.uid,
      });
      if (ok) {
        sent += 1;
        await markNotified(event.uid, dateKey);
      }
    }
  } catch (err) {
    errors.push(`calendar: ${(err as Error).message}`);
  }

  // Apple Reminders, queried live (never cached locally).
  try {
    const reminders = await listReminders();
    for (const reminder of reminders) {
      if (reminder.completed || !reminder.dueDate) continue;
      const dateKey = reminder.dueDate.slice(0, 10);
      if (dateKey !== today && dateKey !== tomorrow) continue;
      if (await wasNotified(reminder.uid, dateKey)) continue;

      const when = dateKey === today ? 'today' : 'tomorrow';
      const ok = await sendPush(subscription, {
        title: reminder.title,
        body: `Reminder due ${when}`,
        tag: reminder.uid,
      });
      if (ok) {
        sent += 1;
        await markNotified(reminder.uid, dateKey);
      }
    }
  } catch (err) {
    errors.push(`reminders: ${(err as Error).message}`);
  }

  return NextResponse.json({ ok: true, sent, errors: errors.length > 0 ? errors : undefined });
}
