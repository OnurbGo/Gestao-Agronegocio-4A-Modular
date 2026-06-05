import * as React from 'react'
import { cn } from '@/utils/cn'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export { Textarea }
