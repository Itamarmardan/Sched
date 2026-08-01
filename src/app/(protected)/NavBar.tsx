'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { getNavSlots } from '@/lib/db/repositories/settingsRepo';
import { NAV_CATEGORIES, NAV_CATEGORY_KEYS, DEFAULT_NAV_SLOTS } from '@/lib/navCategories';
import { HomeIcon, CalendarIcon, DotsGridIcon } from '@/components/ui/icons';

export default function NavBar() {
  const pathname = usePathname();
  const slots = useLiveQuery(getNavSlots, []) ?? DEFAULT_NAV_SLOTS;
  const moreKeys = NAV_CATEGORY_KEYS.filter((key) => !slots.includes(key));
  const moreActive =
    pathname === '/more' ||
    pathname === '/settings' ||
    moreKeys.some((key) => pathname.startsWith(NAV_CATEGORIES[key].href));

  const tabs = [
    { href: '/', label: 'Home', Icon: HomeIcon, active: pathname === '/' },
    { href: '/calendar', label: 'Calendar', Icon: CalendarIcon, active: pathname.startsWith('/calendar') },
    ...slots.map((key) => {
      const category = NAV_CATEGORIES[key];
      return { href: category.href, label: category.label, Icon: category.Icon, active: pathname.startsWith(category.href) };
    }),
    { href: '/more', label: 'More', Icon: DotsGridIcon, active: moreActive },
  ];

  return (
    <nav className="min-w-0 shrink-0 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="flex">
        {tabs.map(({ href, label, Icon, active }) => (
          <li key={href} className="min-w-0 flex-1">
            <Link
              href={href}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-500 active:text-gray-700'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon width={23} height={23} strokeWidth={active ? 2 : 1.75} />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
