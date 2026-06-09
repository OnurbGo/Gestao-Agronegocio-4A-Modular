import Modal from "@/shared/components/layout/Modal";
import { Button } from "@/shared/components/ui/button";
import { formatDateBR } from "@/shared/utils/date";
import type { PendingSalaryImpact } from "@/shared/types";
import { mesAno } from "../helpers";

type SalaryImpactModalProps = {
  impacto: PendingSalaryImpact | null;
  processing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function SalaryImpactModal({
  impacto,
  processing,
  onCancel,
  onConfirm,
}: SalaryImpactModalProps) {
  if (!impacto) {
    return null;
  }

  return (
    <Modal
      onClose={() => {
        if (!processing) onCancel();
      }}
      title={impacto.titulo}
      width="lg"
    >
      <div className="grid gap-4">
        <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-slate-700">
          {impacto.mensagem}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="grid gap-2 rounded-lg border border-emerald-100 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-950">
              Férias afetadas
            </h3>
            {(impacto.impacto?.ferias || []).length ? (
              <ul className="grid gap-2 text-sm text-slate-700">
                {impacto.impacto.ferias?.map((item) => (
                  <li
                    className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                    key={`ferias-${item.id_ferias}`}
                  >
                    {item.descricao ||
                      `Férias de ${formatDateBR(item.inicio_gozado)} a ${formatDateBR(item.fim_gozado)}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
                Nenhum registro de férias afetado.
              </p>
            )}
          </section>

          <section className="grid gap-2 rounded-lg border border-emerald-100 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-950">
              Folhas afetadas
            </h3>
            {(impacto.impacto?.lancamentos || []).length ? (
              <ul className="grid gap-2 text-sm text-slate-700">
                {impacto.impacto.lancamentos?.map((item) => (
                  <li
                    className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                    key={`folha-${item.ano}-${item.mes}`}
                  >
                    {item.descricao ||
                      `Folha de pagamento ${mesAno(item.ano, item.mes)}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
                Nenhuma folha afetada.
              </p>
            )}
          </section>
        </div>

        {(impacto.impacto?.sem_salario || []).length ? (
          <section className="grid gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-bold text-amber-900">
              Sem salário vigente
            </h3>
            <p className="text-sm font-semibold text-amber-900">
              Os trechos abaixo serão recalculados com valor 0 onde não houver
              salário vigente.
            </p>
            <ul className="grid gap-2 text-sm text-amber-950">
              {impacto.impacto.sem_salario?.map((item, index) => (
                <li
                  className="rounded-md border border-amber-200 bg-white/70 px-3 py-2"
                  key={`${item.tipo}-${item.referencia || index}`}
                >
                  {item.descricao}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            disabled={processing}
            onClick={onCancel}
            type="button"
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button disabled={processing} onClick={onConfirm} type="button">
            {processing ? "Confirmando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SalaryImpactModal;
