'use client';

import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { createCategory, deleteCategory } from '@/lib/db/repositories/categoriesRepo';
import {
  getPushSupportStatus,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentPushSubscriptionEndpoint,
  type PushSupportStatus,
} from '@/lib/push/subscribeClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import PageHeader from '@/components/ui/PageHeader';
import { TrashIcon } from '@/components/ui/icons';

function PushSection() {
  const [status, setStatus] = useState<PushSupportStatus>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reads browser/service-worker state on mount — not derivable from props/state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(getPushSupportStatus());
    getCurrentPushSubscriptionEndpoint()
      .then((endpoint) => setSubscribed(Boolean(endpoint)))
      .catch(() => {});
  }, []);

  async function handleSubscribe() {
    setBusy(true);
    setError(null);
    try {
      await subscribeToPush();
      setSubscribed(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleUnsubscribe() {
    setBusy(true);
    setError(null);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-semibold text-gray-900">Notifications</h2>

      {status === 'unsupported' && (
        <p className="text-sm text-gray-500">
          Push notifications aren&apos;t supported in this browser.
        </p>
      )}

      {status === 'not-standalone' && (
        <p className="text-sm text-amber-600">
          On iPhone, notifications only work once this app is added to your Home Screen.
          Open the Share menu in Safari and choose &quot;Add to Home Screen,&quot; then open it from there.
        </p>
      )}

      {status === 'supported' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            {subscribed
              ? 'Notifications are on for this device.'
              : 'Get notified about tasks, project items, calendar events, and reminders that are due.'}
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button variant="primary" onClick={subscribed ? handleUnsubscribe : handleSubscribe} disabled={busy}>
            {busy ? 'Working…' : subscribed ? 'Turn off notifications' : 'Enable notifications'}
          </Button>
        </div>
      )}
    </section>
  );
}

function CategoriesSection() {
  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), []);
  const [name, setName] = useState('');

  async function handleAdd() {
    if (!name.trim()) return;
    await createCategory(name.trim());
    setName('');
  }

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">Task Categories</h2>
      <Card className="mb-3 p-0">
        {!categories ? (
          <div className="px-4 py-6 text-center text-gray-400">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">No categories yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-gray-900">{c.name}</span>
                <IconButton label="Delete" tone="danger" onClick={() => deleteCategory(c.id)}>
                  <TrashIcon width={16} height={16} />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="New category"
          className="flex-1"
        />
        <Button variant="secondary" onClick={handleAdd}>
          Add
        </Button>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <div className="px-4 py-6">
      <PageHeader title="Settings" />
      <PushSection />
      <CategoriesSection />
    </div>
  );
}
