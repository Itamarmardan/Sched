'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, CalendarIcon, CheckSquareIcon, TargetIcon, DotsGridIcon } from '@/components/ui/icons';

const MORE_PREFIXES = ['/reminders', '/notes', '/people', '/projects', '/log', '/settings'];

const TABS = [
  { href: '/', label: 'Home', Icon: HomeIcon, match: (p: string) => p === '/' },
  { href: '/calendar', label: 'Calendar', Icon: CalendarIcon, match: (p: string) => p.startsWith('/calendar') },
  { href: '/tasks', label: 'Tasks', Icon: CheckSquareIcon, match: (p: string) => p.startsWith('/tasks') },
  { href: '/goals', label: 'Goals', Icon: TargetIcon, match: (p: string) => p.startsWith('/goals') },
  {
    href: '/more',
    label: 'More',
    Icon: DotsGridIcon,
    match: (p: string) => p === '/more' || MORE_PREFIXES.some((prefix) => p.startsWith(prefix)),
  },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="min-w-0 shrink-0 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="flex">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
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
          );
        })}
      </ul>
    </nav>
  );
}
