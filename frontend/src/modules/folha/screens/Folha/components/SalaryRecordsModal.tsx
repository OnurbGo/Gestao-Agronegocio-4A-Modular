import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import Modal from "@/shared/components/layout/Modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { PaginatedResponse } from "@/shared/types";
import { formatDateBR } from "@/shared/utils/date";
import type { SalaryForm, SalaryRecord } from "@/shared/types";
import { dinheiro } from "../helpers";

type SalaryRecordsModalProps = {
  editingId: number | null;
  form: SalaryForm;
  meta: PaginatedResponse<SalaryRecord>;
  open: boolean;
  page: number;
  records: SalaryRecord[];
  setForm: Dispatch<SetStateAction<SalaryForm>>;
  setPage: Dispatch<SetStateAction<number>>;
  onCalculatePercentage: () => void;
  onCancelEdit: () => void;
  onClose: () => void;
  onDelete: (record: SalaryRecord) => void;
  onEdit: (record: SalaryRecord) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

function SalaryRecordsModal({
  editingId,
  form,
  meta,
  open,
  page,
  records,
  setForm,
  setPage,
  onCalculatePercentage,
  onCancelEdit,
  onClose,
  onDelete,
  onEdit,
  onSubmit,
}: SalaryRecordsModalProps) {
  if (!open) {
    return null;
  }

  function updateField(field: keyof SalaryForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <Modal
      contentClassName="flex min-h-0 flex-col overflow-y-auto lg:overflow-hidden"
      onClose={onClose}
      title="Registros salariais"
      width="xl"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <form
          className="grid shrink-0 gap-4 rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 md:grid-cols-2 lg:grid-cols-12"
          onSubmit={onSubmit}
        >
          <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
            Início
            <Input
              onChange={(event) =>
                updateField("inicio_vigencia", event.target.value)
              }
              required
              type="date"
              value={form.inicio_vigencia}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
            Fim opcional
            <Input
              onChange={(event) =>
                updateField("fim_vigencia", event.target.value)
              }
              type="date"
              value={form.fim_vigencia}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
            Salário
            <Input
              min="0"
              onChange={(event) => updateField("salario", event.target.value)}
              required
              step="0.01"
              type="number"
              value={form.salario}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700 lg:col-span-3">
            Percentual
            <span className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                min="0"
                onChange={(event) =>
                  updateField("percentual", event.target.value)
                }
                step="0.01"
                type="number"
                value={form.percentual}
              />
              <Button
                onClick={onCalculatePercentage}
                type="button"
                variant="secondary"
              >
                Calcular
              </Button>
            </span>
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700 md:col-span-2 lg:col-span-12">
            Observação
            <Input
              onChange={(event) =>
                updateField("observacao", event.target.value)
              }
              value={form.observacao}
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end md:col-span-2 lg:col-span-12">
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

        <div className="grid min-h-0 gap-2 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {records.map((record) => (
            <div
              className="flex flex-col gap-3 rounded-lg border border-emerald-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              key={record.id_registro_salarial}
            >
              <span className="grid min-w-0 gap-1">
                <strong className="text-sm text-slate-950">
                  {dinheiro(record.salario)}
                </strong>
                <span className="text-xs font-semibold text-slate-600">
                  {formatDateBR(record.inicio_vigencia)} a{" "}
                  {record.fim_vigencia
                    ? formatDateBR(record.fim_vigencia)
                    : "Atual"}
                  {record.percentual ? ` - ${record.percentual}%` : ""}
                </span>
              </span>
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
            </div>
          ))}
          {!records.length ? (
            <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
              Nenhum registro salarial.
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

export default SalaryRecordsModal;
