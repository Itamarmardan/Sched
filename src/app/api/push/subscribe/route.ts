import { NextRequest, NextResponse } from 'next/server';
import type { PushSubscription as WebPushSubscription } from 'web-push';
import { setPushSubscription } from '@/lib/kv/schema';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let subscription: WebPushSubscription;
  try {
    subscription = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'A valid PushSubscription is required.' }, { status: 400 });
  }

  try {
    await setPushSubscription(subscription);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
