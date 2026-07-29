'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Tone = 'neutral' | 'danger';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'text-gray-400 hover:bg-gray-100 hover:text-gray-700',
  danger: 'text-gray-400 hover:bg-red-50 hover:text-red-600',
};

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
  label: string;
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ tone = 'neutral', label, className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={[
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-40',
        TONE_CLASSES[tone],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  ),
);
IconButton.displayName = 'IconButton';

export default IconButton;
