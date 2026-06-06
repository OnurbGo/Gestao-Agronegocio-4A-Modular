import type { ChangeEventHandler, HTMLInputTypeAttribute } from 'react'
import type { LucideIcon } from 'lucide-react'

type FieldProps = {
  autoComplete: string
  icon: LucideIcon
  label: string
  minLength?: number
  onChange: ChangeEventHandler<HTMLInputElement>
  type?: HTMLInputTypeAttribute
  value: string
}

function Field({
  autoComplete,
  icon: Icon,
  label,
  minLength,
  onChange,
  type = 'text',
  value,
}: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <span className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
        <Icon aria-hidden="true" className="h-5 w-5 text-emerald-700" />
        <input
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
          minLength={minLength}
          onChange={onChange}
          required
          type={type}
          value={value}
        />
      </span>
    </label>
  )
}

export default Field
