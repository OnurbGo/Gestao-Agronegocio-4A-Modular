import type { Dispatch, SetStateAction } from "react";
import PaginationControls from "@/shared/components/navigation/PaginationControls";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import type { PaginatedResponse, PayrollParticipant } from "@/shared/types";
import { dinheiro } from "../helpers";

type PayrollParticipantsPanelProps = {
  meta: PaginatedResponse<PayrollParticipant>;
  page: number;
  participants: PayrollParticipant[];
  search: string;
  selectedId: number | null;
  setPage: Dispatch<SetStateAction<number>>;
  onManage: () => void;
  onSearchChange: (value: string) => void;
  onSelect: (participant: PayrollParticipant) => void;
};

function PayrollParticipantsPanel({
  meta,
  participants,
  search,
  selectedId,
  setPage,
  onManage,
  onSearchChange,
  onSelect,
}: PayrollParticipantsPanelProps) {
  return (
    <Card className="min-w-0 border-emerald-100">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle>Participantes</CardTitle>
        <Badge>{meta.total}</Badge>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col gap-3">
        <Button onClick={onManage} type="button">
          Gerenciar participantes
        </Button>
        <Input
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar participante"
          type="search"
          value={search}
        />
        <div className="grid gap-2">
          {participants.map((participant) => (
            <button
              className={`grid min-h-20 w-full gap-1 rounded-lg border bg-white px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40 ${
                participant.id_entidade === selectedId
                  ? "border-emerald-700 bg-emerald-50"
                  : "border-emerald-100"
              }`}
              key={participant.id_entidade}
              onClick={() => onSelect(participant)}
              type="button"
            >
              <strong className="truncate text-sm font-bold text-slate-950">
                {participant.nome}
              </strong>
              <span className="truncate text-xs font-semibold text-slate-600">
                {participant.cpf_cnpj}
              </span>
              <small className="truncate text-xs font-bold text-emerald-900">
                {dinheiro(participant.salario_atual)}
              </small>
            </button>
          ))}
          {!participants.length ? (
            <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
              Nenhum participante encontrado.
            </p>
          ) : null}
        </div>
        <PaginationControls meta={meta} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
}

export default PayrollParticipantsPanel;
