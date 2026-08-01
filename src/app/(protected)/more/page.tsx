'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { getNavSlots } from '@/lib/db/repositories/settingsRepo';
import { NAV_CATEGORIES, NAV_CATEGORY_KEYS, DEFAULT_NAV_SLOTS } from '@/lib/navCategories';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { GearIcon, ChevronRightIcon } from '@/components/ui/icons';

export default function MorePage() {
  const slots = useLiveQuery(getNavSlots, []) ?? DEFAULT_NAV_SLOTS;
  const items = NAV_CATEGORY_KEYS.filter((key) => !slots.includes(key)).map((key) => NAV_CATEGORIES[key]);

  return (
    <div className="px-4 py-6">
      <PageHeader title="More" />
      <Card className="p-0">
        <div className="divide-y divide-gray-100">
          {items.map(({ href, label, description, Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Icon width={20} height={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">{label}</p>
                <p className="truncate text-sm text-gray-500">{description}</p>
              </div>
              <ChevronRightIcon width={18} height={18} className="shrink-0 text-gray-300" />
            </Link>
          ))}
          <Link href="/settings" className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <GearIcon width={20} height={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">Settings</p>
              <p className="truncate text-sm text-gray-500">Bottom tabs, notifications, and categories</p>
            </div>
            <ChevronRightIcon width={18} height={18} className="shrink-0 text-gray-300" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
