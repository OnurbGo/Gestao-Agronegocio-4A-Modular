import { useMemo } from "react";
import FormErrorAlert from "@/shared/components/feedback/FormErrorAlert";
import Modal from "@/shared/components/layout/Modal";
import PaginationControls from "@/shared/components/navigation/PaginationControls";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { Entidade, PaginatedResponse } from "@/shared/types";

type PayrollParticipantsModalProps = {
  entities: Entidade[];
  errorMessage?: string | null;
  loading: boolean;
  meta: PaginatedResponse<Entidade>;
  open: boolean;
  page: number;
  savingId: number | null;
  search: string;
  onClose: () => void;
  onLoadPage: (page: number) => void;
  onSearchChange: (value: string) => void;
  onToggle: (entity: Entidade) => void;
};

function PayrollParticipantsModal({
  entities,
  errorMessage,
  loading,
  meta,
  open,
  savingId,
  search,
  onClose,
  onLoadPage,
  onSearchChange,
  onToggle,
}: PayrollParticipantsModalProps) {
  const filteredEntities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return entities;
    }

    return entities.filter((entity) =>
      [entity.nome, entity.cpf_cnpj].some((value) =>
        String(value || "").toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [entities, search]);

  if (!open) {
    return null;
  }

  return (
    <Modal
      onClose={onClose}
      title="Gerenciar participantes da folha"
      width="lg"
    >
      <div className="grid gap-4">
        <FormErrorAlert message={errorMessage} />
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar pessoa/empresa"
            type="search"
            value={search}
          />
          <Button
            disabled={loading}
            onClick={() => onLoadPage(1)}
            type="button"
            variant="secondary"
          >
            Buscar
          </Button>
        </div>
        <div className="grid gap-2">
          {filteredEntities.map((entity) => (
            <button
              className="flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-white px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={savingId === entity.id_entidade}
              key={entity.id_entidade}
              onClick={() => onToggle(entity)}
              type="button"
            >
              <span className="grid min-w-0 gap-1">
                <strong className="truncate text-sm text-slate-950">
                  {entity.nome}
                </strong>
                <small className="truncate text-xs font-semibold text-slate-500">
                  {entity.cpf_cnpj || "Sem documento"}
                </small>
              </span>
              <Badge
                className="shrink-0"
                variant={entity.participa_folha ? "default" : "secondary"}
              >
                {entity.participa_folha ? "Na folha" : "Fora da folha"}
              </Badge>
            </button>
          ))}
          {!filteredEntities.length ? (
            <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
              {loading
                ? "Carregando cadastros..."
                : "Nenhum cadastro encontrado."}
            </p>
          ) : null}
        </div>
        <PaginationControls
          className="shrink-0 border-t border-emerald-100 pt-3"
          loading={loading}
          meta={meta}
          onPageChange={onLoadPage}
        />
      </div>
    </Modal>
  );
}

export default PayrollParticipantsModal;
