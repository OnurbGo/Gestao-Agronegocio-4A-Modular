import { Search } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import type { Imovel, PageMeta } from "../types";

type ImoveisListPanelProps = {
  coloniaFiltro: string;
  imoveis: Imovel[];
  loading: boolean;
  loteFiltro: string;
  meta: PageMeta;
  municipioFiltro: string;
  page: number;
  selectedId: number | null;
  termo: string;
  onColoniaChange: (value: string) => void;
  onLoteChange: (value: string) => void;
  onMunicipioChange: (value: string) => void;
  onNew: () => void;
  onPageChange: (page: number) => void;
  onPrint: () => void;
  onSearch: () => void;
  onSearchChange: (value: string) => void;
  onSelect: (id: number) => void;
};

function ImoveisListPanel({
  coloniaFiltro,
  imoveis,
  loading,
  loteFiltro,
  meta,
  municipioFiltro,
  page,
  selectedId,
  termo,
  onColoniaChange,
  onLoteChange,
  onMunicipioChange,
  onNew,
  onPageChange,
  onPrint,
  onSearch,
  onSearchChange,
  onSelect,
}: ImoveisListPanelProps) {
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
            placeholder="Buscar por nome, município ou matrícula"
            type="search"
            value={termo}
          />
          <Button disabled={loading} onClick={onSearch} type="button" variant="secondary">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </div>
        <div className="grid gap-2">
          <Input
            onChange={(event) => onLoteChange(event.target.value)}
            placeholder="Filtrar por lote"
            type="search"
            value={loteFiltro}
          />
          <Input
            onChange={(event) => onMunicipioChange(event.target.value)}
            placeholder="Filtrar por município"
            type="search"
            value={municipioFiltro}
          />
          <Input
            onChange={(event) => onColoniaChange(event.target.value)}
            placeholder="Filtrar por colônia"
            type="search"
            value={coloniaFiltro}
          />
        </div>
        <Button disabled={loading} onClick={onPrint} type="button" variant="secondary">
          Imprimir relatório
        </Button>
        <Button onClick={onNew} type="button">
          Novo imóvel
        </Button>
        <div className="grid gap-2">
          {imoveis.map((imovel) => (
            <button
              className={cn(
                "grid min-h-20 w-full gap-1 rounded-lg border bg-white px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40",
                imovel.id_imovel === selectedId
                  ? "border-emerald-700 bg-emerald-50"
                  : "border-emerald-100",
              )}
              key={imovel.id_imovel}
              onClick={() => onSelect(imovel.id_imovel)}
              type="button"
            >
              <strong className="truncate text-sm font-bold text-slate-950">
                {imovel.nome}
              </strong>
              <span className="truncate text-xs font-semibold text-slate-600">
                {imovel.nirf ||
                  imovel.incra ||
                  imovel.matricula ||
                  "Sem registro"}
              </span>
              <small className="truncate text-xs font-bold text-emerald-900">
                {imovel.municipio || imovel.cidade || "Sem município"}
              </small>
            </button>
          ))}
          {!imoveis.length ? (
            <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
              {loading ? "Carregando..." : "Nenhum imóvel encontrado."}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Button
            disabled={loading || page <= 1}
            onClick={() => onPageChange(page - 1)}
            type="button"
            variant="secondary"
          >
            Anterior
          </Button>
          <span className="whitespace-nowrap text-center text-xs font-black text-slate-600">
            Página {page} de {meta.totalPages}
          </span>
          <Button
            disabled={loading || page >= meta.totalPages}
            onClick={() => onPageChange(page + 1)}
            type="button"
            variant="secondary"
          >
            Próxima
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ImoveisListPanel;
