import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import FormErrorAlert from "@/shared/components/feedback/FormErrorAlert";
import Modal from "@/shared/components/layout/Modal";
import PaginationControls from "@/shared/components/navigation/PaginationControls";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type {
  PaginatedResponse,
  SalaryForm,
  SalaryRecord,
} from "@/shared/types";
import { formatDateBR } from "@/shared/utils/date";
import { dinheiro } from "../helpers";
import { BadgeDollarSign } from "lucide-react";

type SalaryRecordsModalProps = {
  editingId: number | null;
  errorMessage?: string | null;
  form: SalaryForm;
  meta: PaginatedResponse<SalaryRecord>;
  open: boolean;
  page: number;
  records: SalaryRecord[];
  setForm: Dispatch<SetStateAction<SalaryForm>>;
  setPage: Dispatch<SetStateAction<number>>;
  onCalculatePercentage: () => void;
  onCancelEdit: () => void;
  onClearError?: () => void;
  onClose: () => void;
  onDelete: (record: SalaryRecord) => void;
  onEdit: (record: SalaryRecord) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

function SalaryRecordsModal({
  editingId,
  errorMessage,
  form,
  meta,
  open,
  records,
  setForm,
  setPage,
  onCalculatePercentage,
  onCancelEdit,
  onClearError,
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
      title={
        <>
          <BadgeDollarSign className="h-5 w-5" />
          Registros salariais
        </>
      }
      width="xl"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <FormErrorAlert message={errorMessage} onDismiss={onClearError} />
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

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-emerald-100 bg-white p-3 pr-2">
          {records.length ? (
            <div className="flex flex-col items-stretch justify-start gap-2">
              {records.map((record) => (
                <div
                  className="flex shrink-0 flex-col gap-3 rounded-lg border border-emerald-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
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

                  <span className="flex flex-wrap gap-2 sm:justify-end">
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
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
                Nenhum registro salarial.
              </p>
            </div>
          )}
        </div>

        <PaginationControls
          className="shrink-0 border-t border-emerald-100 pt-3"
          meta={meta}
          onPageChange={setPage}
        />
      </div>
    </Modal>
  );
}

export default SalaryRecordsModal;
