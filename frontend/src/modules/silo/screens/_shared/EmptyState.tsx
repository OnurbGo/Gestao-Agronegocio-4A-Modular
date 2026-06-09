type EmptyStateProps = {
  title?: string
  description?: string
}

function EmptyState({
  title = 'Nenhum registro encontrado.',
  description = 'Ajuste os filtros ou cadastre um novo registro.',
}: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  )
}

export default EmptyState
