'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

const BASE_CLASSES =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 ' +
  'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => (
    <select ref={ref} className={`${BASE_CLASSES} ${className}`} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export default Select;
