import type { PushSubscription as WebPushSubscription } from 'web-push';
import { ensureVapidConfigured } from './vapid';
import { deletePushSubscription } from '@/lib/kv/schema';

export type PushPayload = {
  title: string;
  body: string;
  tag?: string;
};

// Returns false (and prunes the stored subscription) when the endpoint is gone (410/404),
// which happens whenever the PWA is reinstalled or notification permission is revoked.
export async function sendPush(subscription: WebPushSubscription, payload: PushPayload): Promise<boolean> {
  const webpush = ensureVapidConfigured();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await deletePushSubscription();
    }
    return false;
  }
}
