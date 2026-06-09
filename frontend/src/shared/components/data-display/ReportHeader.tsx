import { Building2 } from "lucide-react";

type ReportHeaderProps = {
  emittedAt?: string;
  filters?: Array<{
    label: string;
    value?: string | number | null;
  }>;
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
    <header className="mb-6 border-b border-slate-200 pb-5 print:mb-5 print:pb-4">
      <div className="mb-6 flex items-start justify-between gap-4 print:mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 print:h-10 print:w-10">
            <Building2 className="h-6 w-6 print:h-5 print:w-5" />
          </div>

          <div>
            <p className="text-base font-bold text-emerald-800 print:text-sm">
              {BRAND_NAME}
            </p>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Relatório do sistema
            </p>
          </div>
        </div>

        {emittedAt ? (
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold uppercase tracking-wide">Emitido em</p>
            <p>{emittedAt}</p>
          </div>
        ) : null}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-slate-950 print:text-2xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-1 text-base text-slate-600 print:text-sm">
            {subtitle}
          </p>
        ) : null}
      </div>

      {activeFilters.length ? (
        <div className="mt-4 flex flex-wrap gap-2 print:mt-3">
          {activeFilters.map((filter) => (
            <span
              className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-slate-700"
              key={`${filter.label}-${filter.value}`}
            >
              <span className="text-slate-500">{filter.label}:</span>{" "}
              {filter.value}
            </span>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export default ReportHeader;
