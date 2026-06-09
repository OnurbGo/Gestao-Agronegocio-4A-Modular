import type { PageMeta } from "@/shared/types";
import { Button } from "@/shared/components/ui/button";

type PaginationControlsProps = {
  className?: string;
  loading?: boolean;
  meta: PageMeta;
  onPageChange: (page: number) => void;
};

function PaginationControls({
  className = "",
  loading = false,
  meta,
  onPageChange,
}: PaginationControlsProps) {
  const page = Math.max(1, Number(meta.page) || 1);
  const totalPages = Math.max(1, Number(meta.totalPages) || 1);

  return (
    <div
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 ${className}`}
    >
      <Button
        disabled={loading || page <= 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
        variant="secondary"
      >
        Anterior
      </Button>
      <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-2 text-center text-xs font-black text-slate-600">
        Página {page} de {totalPages}
      </span>
      <Button
        disabled={loading || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        type="button"
        variant="secondary"
      >
        Próxima
      </Button>
    </div>
  );
}

export default PaginationControls;
