'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

// Native checkboxes ignore border-radius under appearance:auto in most browsers, so the
// circle is hand-drawn as a decorative peer sibling. The real <input> fills the full 44px
// touch target invisibly (native semantics, real hit area) while the small visible circle
// is purely cosmetic — this keeps the tap target accessible without shrinking the visual size.
const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <span className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        className="peer absolute inset-0 h-11 w-11 cursor-pointer appearance-none rounded-full focus:outline-none disabled:cursor-not-allowed"
        {...props}
      />
      <span className="pointer-events-none absolute h-5 w-5 rounded-full border border-gray-300 bg-white transition-colors peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500/30 peer-disabled:opacity-40" />
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  ),
);
Checkbox.displayName = 'Checkbox';

export default Checkbox;
