import type { PageMeta } from "@/types";
import { Button } from "@/components/ui/button";

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
    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <Button
        className="w-full"
        disabled={loading || meta.page <= 1}
        onClick={() => onPageChange(meta.page - 1)}
        type="button"
        variant="outline"
      >
        Anterior
      </Button>
      <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-600">
        Página {meta.page} de {meta.totalPages}
      </span>
      <Button
        className="w-full"
        disabled={loading || meta.page >= meta.totalPages}
        onClick={() => onPageChange(meta.page + 1)}
        type="button"
        variant="outline"
      >
        Próxima
      </Button>
    </div>
  );
}

export default PaginationControls;
