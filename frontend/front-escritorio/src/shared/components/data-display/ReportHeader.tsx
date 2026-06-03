const BRAND_NAME = 'Gestão Agronegócio 4A'

function ReportHeader({ title, subtitle, filters = [], emittedAt }) {
  const activeFilters = filters.filter((item) => item.value)

  return (
    <header className="mb-4 border-b-2 border-emerald-800 pb-3 text-slate-950">
      <div className="mb-3 flex items-center gap-3">
        <img alt="" className="h-9 w-9" src="/favicon.svg" />
        <div className="grid gap-0.5">
          <strong className="text-sm font-bold text-emerald-900">
            {BRAND_NAME}
          </strong>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
            Relatório do sistema
          </span>
        </div>
      </div>

      <h2 className="m-0 text-2xl font-bold leading-tight">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      {activeFilters.length ? (
        <p className="mt-1 text-sm text-slate-600">
          {activeFilters
            .map((item) => `${item.label}: ${item.value}`)
            .join(' | ')}
        </p>
      ) : null}
      {emittedAt ? (
        <p className="mt-1 text-sm text-slate-600">Emitido em {emittedAt}</p>
      ) : null}
    </header>
  )
}

export default ReportHeader
