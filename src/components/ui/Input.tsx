'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

const BASE_CLASSES =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 ' +
  'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input ref={ref} className={`${BASE_CLASSES} ${className}`} {...props} />
  ),
);
Input.displayName = 'Input';

export default Input;
