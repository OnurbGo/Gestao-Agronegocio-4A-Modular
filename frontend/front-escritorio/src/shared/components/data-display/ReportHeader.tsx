const BRAND_NAME = 'Gestão Agronegócio 4A'

function ReportHeader({ title, subtitle, filters = [], emittedAt }) {
  const activeFilters = filters.filter((item) => item.value)

  return (
    <header className="report-print-header">
      <div className="report-brand">
        <img alt="" src="/favicon.svg" />
        <div>
          <strong>{BRAND_NAME}</strong>
          <span>Relatório do sistema</span>
        </div>
      </div>

      <h2>{title}</h2>
      {subtitle ? <p className="report-print-subtitle">{subtitle}</p> : null}
      {activeFilters.length ? (
        <p className="report-print-filters">
          {activeFilters
            .map((item) => `${item.label}: ${item.value}`)
            .join(' | ')}
        </p>
      ) : null}
      {emittedAt ? (
        <p className="report-print-emitted">Emitido em {emittedAt}</p>
      ) : null}
    </header>
  )
}

export default ReportHeader
