'use client';

import { HTMLAttributes } from 'react';

type Tone = 'neutral' | 'indigo' | 'green' | 'amber' | 'red';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-gray-100 text-gray-600',
  indigo: 'bg-indigo-50 text-indigo-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
};

export default function Badge({
  tone = 'neutral',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      ].join(' ')}
      {...props}
    />
  );
}
