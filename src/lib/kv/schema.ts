import { getRedis } from './client';
import type { ReminderIndexEntry } from '@/lib/types';
import type { PushSubscription as WebPushSubscription } from 'web-push';

const REMINDER_INDEX_ALL_KEY = 'reminder_index:all';
const PUSH_SUBSCRIPTION_KEY = 'push_subscription';
const NOTIFIED_TTL_SECONDS = 60 * 60 * 48; // 48h — long enough to dedupe same-day reruns

function reminderIndexKey(id: string): string {
  return `reminder_index:${id}`;
}

function notifiedKey(itemId: string, dateKey: string): string {
  return `notified:${itemId}:${dateKey}`;
}

export async function upsertReminderIndexEntry(entry: ReminderIndexEntry): Promise<void> {
  const redis = getRedis();
  await Promise.all([
    redis.set(reminderIndexKey(entry.id), entry),
    redis.sadd(REMINDER_INDEX_ALL_KEY, entry.id),
  ]);
}

export async function deleteReminderIndexEntry(id: string): Promise<void> {
  const redis = getRedis();
  await Promise.all([redis.del(reminderIndexKey(id)), redis.srem(REMINDER_INDEX_ALL_KEY, id)]);
}

export async function getAllReminderIndexEntries(): Promise<ReminderIndexEntry[]> {
  const redis = getRedis();
  const ids = await redis.smembers(REMINDER_INDEX_ALL_KEY);
  if (ids.length === 0) return [];
  const entries = await Promise.all(ids.map((id) => redis.get<ReminderIndexEntry>(reminderIndexKey(id))));
  const valid = entries.filter((e): e is ReminderIndexEntry => e !== null);
  // Prune stray set members whose entry no longer exists (e.g. a delete that raced with a read).
  const missingIds = ids.filter((_, i) => entries[i] === null);
  if (missingIds.length > 0) {
    await redis.srem(REMINDER_INDEX_ALL_KEY, ...missingIds);
  }
  return valid;
}

export async function setPushSubscription(subscription: WebPushSubscription): Promise<void> {
  await getRedis().set(PUSH_SUBSCRIPTION_KEY, subscription);
}

export async function getPushSubscription(): Promise<WebPushSubscription | null> {
  return getRedis().get<WebPushSubscription>(PUSH_SUBSCRIPTION_KEY);
}

export async function deletePushSubscription(): Promise<void> {
  await getRedis().del(PUSH_SUBSCRIPTION_KEY);
}

export async function wasNotified(itemId: string, dateKey: string): Promise<boolean> {
  const value = await getRedis().get(notifiedKey(itemId, dateKey));
  return value !== null;
}

export async function markNotified(itemId: string, dateKey: string): Promise<void> {
  await getRedis().set(notifiedKey(itemId, dateKey), '1', { ex: NOTIFIED_TTL_SECONDS });
}
