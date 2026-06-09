import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import Modal from "@/shared/components/layout/Modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { PaginatedResponse } from "@/shared/types";
import { formatDateBR } from "@/shared/utils/date";
import type { VacationForm, VacationRecord, VacationSummary } from "@/shared/types";
import { dinheiro, numero } from "../helpers";

type VacationRecordsModalProps = {
  editingId: number | null;
  form: VacationForm;
  meta: PaginatedResponse<VacationRecord>;
  open: boolean;
  page: number;
  records: VacationRecord[];
  setForm: Dispatch<SetStateAction<VacationForm>>;
  setPage: Dispatch<SetStateAction<number>>;
  summary: VacationSummary;
  onCancelEdit: () => void;
  onClose: () => void;
  onDelete: (record: VacationRecord) => void;
  onEdit: (record: VacationRecord) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

function VacationRecordsModal({
  editingId,
  form,
  meta,
  open,
  page,
  records,
  setForm,
  setPage,
  summary,
  onCancelEdit,
  onClose,
  onDelete,
  onEdit,
  onSubmit,
}: VacationRecordsModalProps) {
  if (!open) {
    return null;
  }

  function updateField(field: keyof VacationForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <Modal
      contentClassName="flex min-h-0 flex-col overflow-y-auto lg:overflow-hidden"
      onClose={onClose}
      title="Registro de férias"
      width="xl"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <form
          className="grid shrink-0 gap-4 rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 md:grid-cols-3 lg:grid-cols-12"
          onSubmit={onSubmit}
        >
          <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
            Início gozado
            <Input
              onChange={(event) =>
                updateField("inicio_gozado", event.target.value)
              }
              required
              type="date"
              value={form.inicio_gozado}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
            Fim gozado
            <Input
              onChange={(event) => updateField("fim_gozado", event.target.value)}
              required
              type="date"
              value={form.fim_gozado}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
            Abono opcional
            <Input
              min="0"
              onChange={(event) => updateField("valor_abono", event.target.value)}
              step="0.01"
              type="number"
              value={form.valor_abono}
            />
          </label>
          <div className="flex flex-col gap-2 md:col-span-3 sm:flex-row sm:justify-end lg:col-span-3 lg:items-end">
            <Button className="sm:min-w-44" type="submit">
              {editingId ? "Salvar alterações" : "Adicionar"}
            </Button>
            {editingId ? (
              <Button
                className="sm:min-w-32"
                onClick={onCancelEdit}
                type="button"
                variant="secondary"
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>

        <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            label="Período aquisitivo"
            value={
              summary.periodo_aquisitivo_inicio
                ? `${formatDateBR(summary.periodo_aquisitivo_inicio)} a ${formatDateBR(summary.periodo_aquisitivo_fim)}`
                : "-"
            }
          />
          <SummaryCard
            label="Anos aquisitivos"
            value={summary.anos_aquisitivos || 0}
          />
          <SummaryCard
            label="Dias adquiridos"
            value={`${summary.dias_adquiridos || 0} dias`}
          />
          <SummaryCard
            label="Dias gozados"
            value={`${summary.total_dias_gozados || 0} dias`}
          />
          <SummaryCard
            label="Saldo"
            value={`${summary.saldo_ferias_dias || 0} dias`}
          />
        </div>

        <div className="min-h-0 lg:flex-1">
          <Table
            className="min-w-[760px]"
            wrapperClassName="max-h-[44vh] rounded-md border border-emerald-100 lg:h-full"
          >
            <TableHeader className="sticky top-0 z-10 bg-emerald-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Início gozado
                </TableHead>
                <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Fim gozado
                </TableHead>
                <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Dias
                </TableHead>
                <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Valor calculado
                </TableHead>
                <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Abono
                </TableHead>
                <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Total
                </TableHead>
                <TableHead className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id_ferias}>
                  <TableCell className="px-3 py-2">
                    {formatDateBR(record.inicio_gozado)}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {formatDateBR(record.fim_gozado)}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {record.dias_gozados} dias
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {dinheiro(record.valor_ferias)}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {dinheiro(record.valor_abono)}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {dinheiro(record.valor_total_ferias)}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <span className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => onEdit(record)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => onDelete(record)}
                        size="sm"
                        type="button"
                        variant="destructive"
                      >
                        Excluir
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="sticky bottom-0 bg-emerald-50">
              <TableRow className="hover:bg-emerald-50">
                <TableCell className="px-3 py-2" colSpan={2}>
                  <strong>Total de férias gozadas</strong>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <strong>{summary.total_dias_gozados || 0} dias</strong>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <strong>
                    {dinheiro(
                      records.reduce(
                        (total, record) => total + numero(record.valor_ferias),
                        0,
                      ),
                    )}
                  </strong>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <strong>
                    {dinheiro(
                      records.reduce(
                        (total, record) => total + numero(record.valor_abono),
                        0,
                      ),
                    )}
                  </strong>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <strong>
                    {dinheiro(
                      records.reduce(
                        (total, record) =>
                          total + numero(record.valor_total_ferias),
                        0,
                      ),
                    )}
                  </strong>
                </TableCell>
                <TableCell className="px-3 py-2" />
              </TableRow>
            </TableFooter>
          </Table>
          {!records.length ? (
            <p className="m-0 p-4 text-sm font-semibold text-slate-500">
              Nenhum registro de férias.
            </p>
          ) : null}
        </div>

        <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-emerald-100 pt-3">
          <Button
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            type="button"
            variant="secondary"
          >
            Anterior
          </Button>
          <span className="whitespace-nowrap text-center text-xs font-black text-slate-600">
            Página {meta.page} de {meta.totalPages}
          </span>
          <Button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((current) => current + 1)}
            type="button"
            variant="secondary"
          >
            Próxima
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
      <span className="text-xs font-black uppercase text-slate-500">
        {label}
      </span>
      <strong className="self-end text-lg text-slate-950">{value}</strong>
    </div>
  );
}

export default VacationRecordsModal;
