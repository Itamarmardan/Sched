'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';

const BASE_CLASSES =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 ' +
  'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea ref={ref} className={`${BASE_CLASSES} ${className}`} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export default Textarea;
