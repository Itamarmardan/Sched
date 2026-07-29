'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

// Native checkboxes ignore border-radius under appearance:auto in most browsers, so a
// custom circular control is hand-drawn here (appearance-none input + an overlaid checkmark)
// rather than relying on styling the native widget.
const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <span className={`relative inline-flex h-5 w-5 shrink-0 items-center justify-center ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        className="peer absolute inset-0 h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-full border border-gray-300 bg-white transition-colors checked:border-indigo-600 checked:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-40"
        {...props}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none relative h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  ),
);
Checkbox.displayName = 'Checkbox';

export default Checkbox;
