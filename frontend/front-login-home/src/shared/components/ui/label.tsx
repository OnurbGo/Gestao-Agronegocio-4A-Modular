import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/shared/utils/cn'

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-sm font-bold leading-none text-slate-700', className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
