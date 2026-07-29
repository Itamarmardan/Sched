import { NextResponse } from 'next/server';
import { deletePushSubscription } from '@/lib/kv/schema';

export const runtime = 'nodejs';

export async function POST() {
  try {
    await deletePushSubscription();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
