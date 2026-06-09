import type { ReactNode } from 'react'
import { ChevronRight, LoaderCircle } from 'lucide-react'

type SubmitButtonProps = {
  children: ReactNode
  loading: boolean
}

function SubmitButton({ children, loading }: SubmitButtonProps) {
  return (
    <button
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
      disabled={loading}
      type="submit"
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
      ) : (
        <ChevronRight aria-hidden="true" className="h-5 w-5" />
      )}
      {children}
    </button>
  )
}

export default SubmitButton
