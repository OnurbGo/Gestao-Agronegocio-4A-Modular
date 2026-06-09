type ReportHeaderProps = {
  emittedAt?: string;
  filters?: Array<{ label: string; value?: string | number | null }>;
  subtitle?: string;
  title: string;
};

const BRAND_NAME = "Gestão Agronegócio 4A";

function ReportHeader({
  title,
  subtitle,
  filters = [],
  emittedAt,
}: ReportHeaderProps) {
  const activeFilters = filters.filter(
    (item) =>
      item.value !== undefined && item.value !== null && item.value !== "",
  );

  return (
    <header className="mb-4 border-b border-slate-200 pb-4 text-slate-950">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <img alt="" className="h-9 w-9" src="/favicon.svg" />
          <div className="grid gap-0.5">
            <strong className="text-sm font-bold text-emerald-900 print:text-slate-800">
              {BRAND_NAME}
            </strong>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
              Relatório do sistema
            </span>
          </div>
        </div>

        {emittedAt ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs font-bold text-slate-700">
            Emitido em
            <br />
            <span className="text-slate-950">{emittedAt}</span>
          </div>
        ) : null}
      </div>

      <h2 className="m-0 text-2xl font-bold leading-tight print:text-xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      ) : null}

      {activeFilters.length ? (
        <dl className="mt-4 grid gap-2 sm:grid-cols-3 print:grid-cols-3">
          {activeFilters.map((filter) => (
            <div
              className="rounded-md border border-slate-200 bg-white px-3 py-2"
              key={filter.label}
            >
              <dt className="text-[11px] font-black uppercase text-slate-500">
                {filter.label}
              </dt>
              <dd className="mt-1 text-sm font-bold text-slate-950">
                {filter.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}

export default ReportHeader;
