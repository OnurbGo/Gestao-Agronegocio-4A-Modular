function StatusMessage({ status }) {
  if (!status?.message) {
    return null
  }

  const variantClasses = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  }

  return (
    <p
      aria-live="polite"
      className={`rounded-md border px-4 py-3 text-sm font-medium ${
        variantClasses[status.type] || variantClasses.info
      }`}
    >
      {status.message}
    </p>
  )
}

export default StatusMessage
