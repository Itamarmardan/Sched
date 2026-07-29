import Link from 'next/link';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { BellIcon, NoteIcon, UsersIcon, FolderIcon, BookIcon, GearIcon, ChevronRightIcon } from '@/components/ui/icons';

const ITEMS = [
  { href: '/reminders', label: 'Reminders', description: 'Apple Reminders', Icon: BellIcon },
  { href: '/notes', label: 'Notes', description: 'Quick freeform notes', Icon: NoteIcon },
  { href: '/people', label: 'People', description: 'Colleagues and their tasks', Icon: UsersIcon },
  { href: '/projects', label: 'Projects', description: 'Longer-term work with checklists', Icon: FolderIcon },
  { href: '/log', label: 'Past Log', description: 'Decisions and meetings', Icon: BookIcon },
  { href: '/settings', label: 'Settings', description: 'Notifications and categories', Icon: GearIcon },
];

export default function MorePage() {
  return (
    <div className="px-4 py-6">
      <PageHeader title="More" />
      <Card className="p-0">
        <div className="divide-y divide-gray-100">
          {ITEMS.map(({ href, label, description, Icon }) => (
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
        </div>
      </Card>
    </div>
  );
}
