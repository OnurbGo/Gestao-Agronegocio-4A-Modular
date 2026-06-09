import { useState } from "react";
import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import FormErrorAlert from "@/shared/components/feedback/FormErrorAlert";
import Modal from "@/shared/components/layout/Modal";
import ConfirmDialog from "@/shared/components/layout/ConfirmDialog";
import PaginationControls from "@/shared/components/navigation/PaginationControls";
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
import type {
  PaginatedResponse,
  VacationForm,
  VacationRecord,
  VacationSummary,
} from "@/shared/types";
import { formatDateBR } from "@/shared/utils/date";
import { dinheiro, numero } from "../helpers";
import { CalendarDays } from "lucide-react";

type VacationRecordsModalProps = {
  editingId: number | null;
  errorMessage?: string | null;
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
  onDelete: (record: VacationRecord) => void | Promise<void>;
  onEdit: (record: VacationRecord) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

function VacationRecordsModal({
  editingId,
  errorMessage,
  form,
  meta,
  open,
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
  const [recordToDelete, setRecordToDelete] = useState<VacationRecord | null>(
    null,
  );

  if (!open) {
    return null;
  }

  function updateField(field: keyof VacationForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function confirmDelete() {
    if (!recordToDelete) {
      return;
    }

    void onDelete(recordToDelete);
    setRecordToDelete(null);
  }

  const totalValorFerias = records.reduce(
    (total, record) => total + numero(record.valor_ferias),
    0,
  );

  const totalValorAbono = records.reduce(
    (total, record) => total + numero(record.valor_abono),
    0,
  );

  const totalValorFeriasComAbono = records.reduce(
    (total, record) => total + numero(record.valor_total_ferias),
    0,
  );

  return (
    <>
      <Modal
        contentClassName="flex min-h-0 flex-col overflow-hidden"
        onClose={onClose}
        title={
          <>
            <CalendarDays className="h-5 w-5 shrink-0" />
            Registro de férias
          </>
        }
        width="xl"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <FormErrorAlert message={errorMessage} />
          <form
            className="grid shrink-0 grid-cols-1 gap-4 rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 sm:grid-cols-2 lg:grid-cols-12"
            onSubmit={onSubmit}
          >
            <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-1 lg:col-span-4">
              Início gozado
              <Input
                className="w-full"
                onChange={(event) =>
                  updateField("inicio_gozado", event.target.value)
                }
                required
                type="date"
                value={form.inicio_gozado}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-1 lg:col-span-4">
              Fim gozado
              <Input
                className="w-full"
                onChange={(event) =>
                  updateField("fim_gozado", event.target.value)
                }
                required
                type="date"
                value={form.fim_gozado}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2 lg:col-span-4">
              Abono opcional
              <Input
                className="w-full"
                min="0"
                onChange={(event) =>
                  updateField("valor_abono", event.target.value)
                }
                step="0.01"
                type="number"
                value={form.valor_abono}
              />
            </label>

            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end lg:col-span-12">
              <Button className="w-full sm:w-auto sm:min-w-56" type="submit">
                {editingId ? "Salvar alterações" : "Adicionar"}
              </Button>

              {editingId ? (
                <Button
                  className="w-full sm:w-auto sm:min-w-40"
                  onClick={onCancelEdit}
                  type="button"
                  variant="secondary"
                >
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>

          <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
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

          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-emerald-100 bg-white">
            <Table
              className="min-w-[820px]"
              wrapperClassName="h-full max-h-full overflow-auto"
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
                {records.length ? (
                  records.map((record) => (
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
                            onClick={() => setRecordToDelete(record)}
                            size="sm"
                            type="button"
                            variant="destructive"
                          >
                            Excluir
                          </Button>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      className="px-3 py-8 text-center text-sm font-semibold text-slate-500"
                      colSpan={7}
                    >
                      Nenhum registro de férias.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter className="sticky bottom-0 z-10 bg-emerald-50">
                <TableRow className="hover:bg-emerald-50">
                  <TableCell className="px-3 py-2" colSpan={2}>
                    <strong>Total de férias gozadas</strong>
                  </TableCell>

                  <TableCell className="px-3 py-2">
                    <strong>{summary.total_dias_gozados || 0} dias</strong>
                  </TableCell>

                  <TableCell className="px-3 py-2">
                    <strong>{dinheiro(totalValorFerias)}</strong>
                  </TableCell>

                  <TableCell className="px-3 py-2">
                    <strong>{dinheiro(totalValorAbono)}</strong>
                  </TableCell>

                  <TableCell className="px-3 py-2">
                    <strong>{dinheiro(totalValorFeriasComAbono)}</strong>
                  </TableCell>

                  <TableCell className="px-3 py-2" />
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <PaginationControls
            className="shrink-0 border-t border-emerald-100 pt-3"
            meta={meta}
            onPageChange={setPage}
          />
        </div>
      </Modal>

      <ConfirmDialog
        confirmLabel="Excluir"
        description="Esta ação não poderá ser desfeita e ficará registrada na auditoria."
        destructive
        onConfirm={confirmDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setRecordToDelete(null);
          }
        }}
        open={Boolean(recordToDelete)}
        title="Confirmar exclusão"
      />
    </>
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
