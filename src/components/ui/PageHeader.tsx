'use client';

import { ReactNode } from 'react';

export default function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
      {action}
    </div>
  );
}
