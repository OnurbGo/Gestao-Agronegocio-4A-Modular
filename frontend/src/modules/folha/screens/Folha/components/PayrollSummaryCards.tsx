import { formatDateBR } from "@/shared/utils/date";
import type { PayrollParticipant } from "@/shared/types";
import { dinheiro } from "../helpers";

type PayrollTotals = {
  bruto: number;
  final: number;
  finalComFerias: number;
};

type PayrollSummaryCardsProps = {
  detail: PayrollParticipant | null;
  totals: PayrollTotals;
};

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
      <span className="text-xs font-black uppercase text-slate-500">
        {label}
      </span>
      <strong className="self-end break-words text-lg text-slate-950">
        {value}
      </strong>
    </div>
  );
}

function PayrollSummaryCards({ detail, totals }: PayrollSummaryCardsProps) {
  return (
    <section className="grid min-w-0 max-w-full gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <SummaryCard label="Participante" value={detail?.nome || "-"} />
      <SummaryCard label="Salário atual" value={dinheiro(detail?.salario_atual)} />
      <SummaryCard label="Admissão" value={formatDateBR(detail?.data_admissao)} />
      <SummaryCard label="Total bruto" value={dinheiro(totals.bruto)} />
      <SummaryCard label="Total final" value={dinheiro(totals.final)} />
      <SummaryCard
        label="Final + férias"
        value={dinheiro(totals.finalComFerias)}
      />
    </section>
  );
}

export default PayrollSummaryCards;
