'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/reminders', label: 'Reminders' },
  { href: '/notes', label: 'Notes' },
  { href: '/people', label: 'People' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/projects', label: 'Projects' },
  { href: '/goals', label: 'Goals' },
  { href: '/log', label: 'Log' },
  { href: '/settings', label: 'Settings' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 border-t border-gray-100 bg-white">
      <ul className="flex gap-1 overflow-x-auto px-2 py-2 text-sm">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className={[
                  'block whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition-colors',
                  active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                ].join(' ')}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
