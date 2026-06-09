import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { PaginatedResponse } from "@/shared/types";
import { formatDateBR } from "@/shared/utils/date";
import type { SalaryRecord, VacationRecord } from "@/shared/types";
import { dinheiro } from "../helpers";

type PayrollRecordsOverviewProps = {
  participantId: number | null;
  salaryMeta: PaginatedResponse<SalaryRecord>;
  salaryRecords: SalaryRecord[];
  vacationMeta: PaginatedResponse<VacationRecord>;
  vacationRecords: VacationRecord[];
  onOpenSalaryRecords: () => void;
  onOpenVacationRecords: () => void;
};

function PayrollRecordsOverview({
  participantId,
  salaryMeta,
  salaryRecords,
  vacationMeta,
  vacationRecords,
  onOpenSalaryRecords,
  onOpenVacationRecords,
}: PayrollRecordsOverviewProps) {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <Card className="border-emerald-100">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Registros salariais</CardTitle>
          <Badge>{salaryMeta.total}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button
            className="w-full"
            disabled={!participantId}
            onClick={onOpenSalaryRecords}
            type="button"
            variant="secondary"
          >
            Gerenciar salários
          </Button>
          <div className="grid gap-2">
            {salaryRecords.slice(0, 5).map((record) => (
              <div
                className="grid gap-1 rounded-lg border border-emerald-100 bg-white p-3"
                key={record.id_registro_salarial}
              >
                <strong className="text-sm text-slate-950">
                  {dinheiro(record.salario)}
                </strong>
                <span className="text-xs font-semibold text-slate-600">
                  {formatDateBR(record.inicio_vigencia)} a{" "}
                  {record.fim_vigencia
                    ? formatDateBR(record.fim_vigencia)
                    : "Atual"}
                </span>
              </div>
            ))}
            {!salaryRecords.length ? (
              <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
                Nenhum registro salarial.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-100">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Férias</CardTitle>
          <Badge>{vacationMeta.total}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button
            className="w-full"
            disabled={!participantId}
            onClick={onOpenVacationRecords}
            type="button"
            variant="secondary"
          >
            Gerenciar férias
          </Button>
          <div className="grid gap-2">
            {vacationRecords.slice(0, 5).map((record) => (
              <div
                className="grid gap-1 rounded-lg border border-emerald-100 bg-white p-3"
                key={record.id_ferias}
              >
                <strong className="text-sm text-slate-950">
                  {record.dias_gozados} dias
                </strong>
                <span className="text-xs font-semibold text-slate-600">
                  {formatDateBR(record.inicio_gozado)} a{" "}
                  {formatDateBR(record.fim_gozado)} -{" "}
                  {dinheiro(record.valor_total_ferias)}
                </span>
              </div>
            ))}
            {!vacationRecords.length ? (
              <p className="rounded-lg border border-dashed border-emerald-100 p-4 text-sm font-semibold text-slate-500">
                Nenhum registro de férias.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default PayrollRecordsOverview;
