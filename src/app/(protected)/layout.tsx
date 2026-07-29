import { ReactNode } from 'react';
import LogoutButton from './LogoutButton';
import NavBar from './NavBar';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-[var(--app-height,100dvh)] min-w-0 max-w-2xl flex-col overflow-x-hidden bg-white sm:my-6 sm:h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-xl">
      <header className="flex min-w-0 shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <span className="text-base font-semibold tracking-tight text-gray-900">Sched</span>
        <LogoutButton />
      </header>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-gray-50">{children}</main>

      <NavBar />
    </div>
  );
}
