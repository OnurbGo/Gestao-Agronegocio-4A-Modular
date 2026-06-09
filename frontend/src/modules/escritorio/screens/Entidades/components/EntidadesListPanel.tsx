import { Search } from "lucide-react";
import PaginationControls from "@/shared/components/navigation/PaginationControls";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import type { Entidade, PageMeta } from "@/shared/types";
import { cn } from "@/shared/utils/cn";
import {
  formatCpfCnpj,
  tipoOptions,
  tipoPessoaOptions,
} from "../helpers";

type EntidadesListPanelProps = {
  entidades: Entidade[];
  loading: boolean;
  meta: PageMeta;
  page: number;
  selectedId: number | null;
  termo: string;
  tipoFiltro: string;
  tipoPessoaFiltro: string;
  onSearchChange: (value: string) => void;
  onTipoChange: (value: string) => void;
  onTipoPessoaChange: (value: string) => void;
  onSearch: () => void;
  onPrint: () => void;
  onNew: () => void;
  onSelect: (id: number) => void;
  onPageChange: (page: number) => void;
};

function EntidadesListPanel({
  entidades,
  loading,
  meta,
  selectedId,
  termo,
  tipoFiltro,
  tipoPessoaFiltro,
  onSearchChange,
  onTipoChange,
  onTipoPessoaChange,
  onSearch,
  onPrint,
  onNew,
  onSelect,
  onPageChange,
}: EntidadesListPanelProps) {
  return (
    <Card className="border-emerald-100">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>Registros</CardTitle>
        <Badge>{meta.total}</Badge>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <Input
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nome ou CPF/CNPJ"
            type="search"
            value={termo}
          />
          <Button disabled={loading} onClick={onSearch} type="button" variant="secondary">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            onChange={(event) => onTipoPessoaChange(event.target.value)}
            value={tipoPessoaFiltro}
          >
            <option value="">Todas as pessoas</option>
            {tipoPessoaOptions.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            onChange={(event) => onTipoChange(event.target.value)}
            value={tipoFiltro}
          >
            <option value="">Todos os tipos</option>
            {tipoOptions.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <Button disabled={loading} onClick={onPrint} type="button" variant="secondary">
          Imprimir relatório
        </Button>
        <Button onClick={onNew} type="button">
          Novo cadastro
        </Button>

        <div className="grid gap-2">
          {entidades.map((entidade) => (
            <button
              className={cn(
                "grid min-h-20 w-full gap-1 rounded-lg border bg-white px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40",
                entidade.id_entidade === selectedId
                  ? "border-emerald-700 bg-emerald-50"
                  : "border-emerald-100",
              )}
              key={entidade.id_entidade}
              onClick={() => onSelect(entidade.id_entidade)}
              type="button"
            >
              <strong className="truncate text-sm font-bold text-slate-950">
                {entidade.nome}
              </strong>
              <span className="truncate text-xs font-semibold text-slate-600">
                {formatCpfCnpj(entidade.cpf_cnpj || "")}
              </span>
              <small className="truncate text-xs font-bold text-emerald-900">
                {entidade.tipos?.join(", ") || "Sem tipo"}
              </small>
            </button>
          ))}
          {!entidades.length ? (
            <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
              {loading ? "Carregando..." : "Nenhum cadastro encontrado."}
            </p>
          ) : null}
        </div>

        <PaginationControls
          loading={loading}
          meta={meta}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}

export default EntidadesListPanel;
