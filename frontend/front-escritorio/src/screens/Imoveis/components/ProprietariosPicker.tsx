import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import type { EntidadeResumo } from "@/types";

type ProprietariosPickerProps = {
  entidadesFiltradas: EntidadeResumo[];
  entidadesSelecionadas: EntidadeResumo[];
  proprietarioTermo: string;
  proprietariosIds: number[];
  onRemove: (id: number) => void;
  onSearchChange: (value: string) => void;
  onSelect: (id: number) => void;
};

function ProprietariosPicker({
  entidadesFiltradas,
  entidadesSelecionadas,
  proprietarioTermo,
  proprietariosIds,
  onRemove,
  onSearchChange,
  onSelect,
}: ProprietariosPickerProps) {
  return (
    <div className="grid gap-2 md:col-span-2">
      <p className="m-0 flex flex-wrap items-center gap-2 text-sm font-bold text-emerald-900">
        Entidades vinculadas
        {proprietariosIds.length > 0 ? (
          <Badge variant="secondary">{proprietariosIds.length} selecionado(s)</Badge>
        ) : null}
      </p>
      <div className="grid gap-3 rounded-lg border border-emerald-100 bg-emerald-50/30 p-3">
        <div className="flex flex-wrap gap-2">
          {entidadesSelecionadas.map((entidade) => (
            <span
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-left shadow-sm"
              key={entidade.id_entidade}
            >
              <span className="grid min-w-0 gap-0.5">
                <strong className="truncate text-xs font-bold text-emerald-950">
                  {entidade.nome}
                </strong>
                <small className="truncate text-[11px] font-semibold text-slate-500">
                  {entidade.cpf_cnpj || "Sem CPF/CNPJ"}
                </small>
              </span>
              <Button
                aria-label={`Remover ${entidade.nome}`}
                className="h-7 w-7 rounded-full"
                onClick={() => onRemove(entidade.id_entidade)}
                size="icon"
                type="button"
                variant="secondary"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </span>
          ))}
          {!entidadesSelecionadas.length ? (
            <p className="m-0 text-sm font-semibold text-slate-500">
              Nenhuma entidade selecionada.
            </p>
          ) : null}
        </div>

        <Input
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar entidade por nome ou CPF/CNPJ"
          type="search"
          value={proprietarioTermo}
        />

        <div className="grid max-h-60 gap-2 overflow-auto pr-1">
          {entidadesFiltradas.map((entidade) => {
            const selecionado = proprietariosIds.includes(entidade.id_entidade);

            return (
              <button
                className={cn(
                  "flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50",
                  selecionado ? "border-emerald-700 bg-emerald-50" : "border-emerald-100",
                )}
                key={entidade.id_entidade}
                onClick={() => onSelect(entidade.id_entidade)}
                type="button"
              >
                <span className="grid min-w-0 gap-1">
                  <strong className="truncate text-sm font-bold text-slate-950">
                    {entidade.nome}
                  </strong>
                  <span className="truncate text-xs font-semibold text-slate-500">
                    {entidade.cpf_cnpj || "Sem CPF/CNPJ"}
                  </span>
                </span>
                <Badge variant={selecionado ? "default" : "secondary"}>
                  {selecionado ? "Selecionada" : "Vincular"}
                </Badge>
              </button>
            );
          })}
          {!entidadesFiltradas.length ? (
            <p className="m-0 text-sm font-semibold text-slate-500">
              {proprietarioTermo
                ? "Nenhuma entidade encontrada."
                : "Nenhuma entidade cadastrada."}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ProprietariosPicker;
