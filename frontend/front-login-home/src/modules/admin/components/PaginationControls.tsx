import type { PageMeta } from "../types";

type PaginationControlsProps = {
  meta: PageMeta;
  loading: boolean;
  onPageChange: (page: number) => void;
};

function PaginationControls({
  meta,
  loading,
  onPageChange,
}: PaginationControlsProps) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <button
        className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={loading || meta.page <= 1}
        onClick={() => onPageChange(meta.page - 1)}
        type="button"
      >
        Anterior
      </button>
      <span className="whitespace-nowrap text-xs font-bold text-slate-500">
        Pagina {meta.page} de {meta.totalPages}
      </span>
      <button
        className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={loading || meta.page >= meta.totalPages}
        onClick={() => onPageChange(meta.page + 1)}
        type="button"
      >
        Proxima
      </button>
    </div>
  );
}

export default PaginationControls;
