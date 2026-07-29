import { ReactNode } from 'react';
import LogoutButton from './LogoutButton';
import NavBar from './NavBar';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col bg-white sm:my-6 sm:h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-xl">
      <header className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur">
        <span className="text-base font-semibold tracking-tight text-gray-900">Sched</span>
        <LogoutButton />
      </header>

      <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>

      <NavBar />
    </div>
  );
}
