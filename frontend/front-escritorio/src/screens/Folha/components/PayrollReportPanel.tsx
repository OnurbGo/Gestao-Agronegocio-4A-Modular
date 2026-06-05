import ReportHeader from "@/components/data-display/ReportHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTimeBR } from "@/utils/date";
import { meses } from "../constants";
import type { PayrollMonthlyReport } from "@/types";
import { dinheiro } from "../helpers";
import PayrollMonthlyChart from "./PayrollMonthlyChart";

type PayrollReportPanelProps = {
  ano: number;
  mesRelatorio: number;
  relatorio: PayrollMonthlyReport | null;
  onAnoChange: (ano: number) => void;
  onMesRelatorioChange: (mes: number) => void;
  onExport: () => void;
  onPrint: () => void;
};

function PayrollReportPanel({
  ano,
  mesRelatorio,
  relatorio,
  onAnoChange,
  onMesRelatorioChange,
  onExport,
  onPrint,
}: PayrollReportPanelProps) {
  const currentMonth = relatorio?.nome_mes || meses[mesRelatorio - 1]?.label;
  const hasRows = Boolean(relatorio?.itens?.length);

  return (
    <section className="grid gap-4 print:block">
      <Card className="no-print border-emerald-100">
        <CardContent className="grid gap-3 pt-5 sm:grid-cols-[120px_180px_auto_auto] sm:items-end">
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">
            Ano
            <Input
              max="2100"
              min="2000"
              onChange={(event) => onAnoChange(Number(event.target.value))}
              type="number"
              value={ano}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">
            Mês
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              onChange={(event) =>
                onMesRelatorioChange(Number(event.target.value))
              }
              value={mesRelatorio}
            >
              {meses.map((mes) => (
                <option key={mes.valor} value={mes.valor}>
                  {mes.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={!hasRows}
            onClick={onPrint}
            type="button"
            variant="secondary"
          >
            Imprimir relatório
          </Button>
          <Button disabled={!hasRows} onClick={onExport} type="button">
            Exportar planilha
          </Button>
        </CardContent>
      </Card>

      <section className="printable-report rounded-lg border border-emerald-100 bg-white p-4 shadow-sm print:shadow-none">
        <ReportHeader
          emittedAt={formatDateTimeBR(new Date())}
          subtitle="Relatório mensal"
          title={`${currentMonth} / ${ano}`}
        />
        <div className="hidden">
          <span>Relatório mensal</span>
          <h2>
            {currentMonth} / {ano}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
            <span className="text-xs font-black uppercase text-slate-500">
              Lançamentos
            </span>
            <strong className="self-end text-xl text-slate-950">
              {relatorio?.itens?.length || 0}
            </strong>
          </div>
          <div className="grid min-h-20 gap-1 rounded-lg border border-emerald-100 bg-white p-3">
            <span className="text-xs font-black uppercase text-slate-500">
              Total final + férias
            </span>
            <strong className="self-end text-xl text-slate-950">
              {dinheiro(relatorio?.total)}
            </strong>
          </div>
        </div>
        <div className="overflow-auto rounded-md border border-emerald-100">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Participante
                </th>
                <th className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Bruto
                </th>
                <th className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Proporcional
                </th>
                <th className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Líquido
                </th>
                <th className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Final
                </th>
                <th className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600">
                  Final + Férias
                </th>
              </tr>
            </thead>
            <tbody>
              {(relatorio?.itens || []).map((item) => (
                <tr key={item.id_folha_mensal}>
                  <td className="border-t border-emerald-50 px-3 py-2">
                    {item.entidade?.nome}
                  </td>
                  <td className="border-t border-emerald-50 px-3 py-2">
                    {dinheiro(item.salario_bruto)}
                  </td>
                  <td className="border-t border-emerald-50 px-3 py-2">
                    {dinheiro(item.salario_proporcional)}
                  </td>
                  <td className="border-t border-emerald-50 px-3 py-2">
                    {dinheiro(item.salario_liquido)}
                  </td>
                  <td className="border-t border-emerald-50 px-3 py-2">
                    {dinheiro(item.salario_liquido_com_desconto)}
                  </td>
                  <td className="border-t border-emerald-50 px-3 py-2">
                    {dinheiro(item.salario_final_com_ferias)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td
                  className="border-t border-emerald-100 bg-emerald-50 px-3 py-2"
                  colSpan={5}
                >
                  <strong>Total final + férias</strong>
                </td>
                <td className="border-t border-emerald-100 bg-emerald-50 px-3 py-2">
                  <strong>{dinheiro(relatorio?.total)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
          {!hasRows ? (
            <p className="m-0 p-4 text-sm font-semibold text-slate-500">
              Nenhum lançamento no período.
            </p>
          ) : null}
        </div>
        <PayrollMonthlyChart relatorio={relatorio} />
      </section>
    </section>
  );
}

export default PayrollReportPanel;
