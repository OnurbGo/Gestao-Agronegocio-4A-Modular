import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { meses } from "../constants";
import type { PayrollEditableField, PayrollLine } from "@/shared/types";
import { dinheiro, totalDescontos } from "../helpers";
import MoneyInput from "./MoneyInput";

type PayrollMonthlyEntriesPanelProps = {
  changed: boolean;
  exporting: boolean;
  loading: boolean;
  participantId: number | null;
  rows: PayrollLine[];
  saving: boolean;
  year: number;
  onChange: (month: number, field: PayrollEditableField, value: string) => void;
  onExport: () => void;
  onOpenDiscounts: (month: number) => void;
  onSave: () => void;
  onYearChange: (year: number) => void;
};

const headings = [
  "Mês",
  "Dias",
  "Bruto",
  "Proporcional",
  "INSS",
  "IRRF",
  "INSS adic.",
  "Comissão",
  "Líquido",
  "Descontos",
  "Final",
  "Final + Férias",
];

function PayrollMonthlyEntriesPanel({
  changed,
  exporting,
  loading,
  participantId,
  rows,
  saving,
  year,
  onChange,
  onExport,
  onOpenDiscounts,
  onSave,
  onYearChange,
}: PayrollMonthlyEntriesPanelProps) {
  return (
    <Card className="min-w-0 max-w-full overflow-hidden border-emerald-100">
      <CardHeader className="min-w-0 flex-col items-start justify-between gap-3 lg:flex-row lg:items-end">
        <CardTitle>Lançamentos de {year}</CardTitle>
        <div className="flex w-full min-w-0 flex-wrap items-end gap-2 sm:w-auto sm:justify-end">
          <label className="grid w-28 gap-1.5 text-sm font-bold text-slate-700">
            Ano
            <Input
              max="2100"
              min="2000"
              onChange={(event) => onYearChange(Number(event.target.value))}
              type="number"
              value={year}
            />
          </label>
          <Button
            disabled={!participantId || changed || exporting}
            onClick={onExport}
            title={changed ? "Salve antes de exportar" : "Exportar planilha"}
            type="button"
            variant="secondary"
          >
            {exporting ? "Exportando..." : "Exportar como planilha"}
          </Button>
          <Button
            disabled={!participantId || saving || loading}
            onClick={onSave}
            type="button"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 max-w-full">
        <Table
          className="min-w-[1120px]"
          wrapperClassName="max-w-full overflow-x-auto rounded-md border border-emerald-100"
        >
          <TableHeader className="sticky top-0 z-10 bg-emerald-50">
            <TableRow className="hover:bg-transparent">
              {headings.map((heading) => (
                <TableHead
                  className="bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-slate-600"
                  key={heading}
                >
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.mes}>
                <TableCell className="px-3 py-2 font-semibold">
                  {meses[Number(row.mes) - 1]?.label}
                </TableCell>
                <TableCell className="px-3 py-2">
                  <Input
                    className="h-9 w-20 px-2"
                    max="31"
                    min="0"
                    onChange={(event) =>
                      onChange(row.mes, "dias_trabalhados", event.target.value)
                    }
                    type="number"
                    value={row.dias_trabalhados}
                  />
                </TableCell>
                <TableCell className="px-3 py-2">
                  {dinheiro(row.salario_bruto)}
                </TableCell>
                <TableCell className="px-3 py-2">
                  {dinheiro(row.salario_proporcional)}
                </TableCell>
                <TableCell className="px-3 py-2">
                  <MoneyInput
                    onChange={(value) => onChange(row.mes, "inss", value)}
                    value={row.inss}
                  />
                </TableCell>
                <TableCell className="px-3 py-2">
                  <MoneyInput
                    onChange={(value) => onChange(row.mes, "irrf", value)}
                    value={row.irrf}
                  />
                </TableCell>
                <TableCell className="px-3 py-2">
                  <MoneyInput
                    onChange={(value) =>
                      onChange(row.mes, "inss_adicional", value)
                    }
                    value={row.inss_adicional}
                  />
                </TableCell>
                <TableCell className="px-3 py-2">
                  <MoneyInput
                    onChange={(value) => onChange(row.mes, "comissao", value)}
                    value={row.comissao}
                  />
                </TableCell>
                <TableCell className="px-3 py-2">
                  {dinheiro(row.salario_liquido)}
                </TableCell>
                <TableCell className="px-3 py-2">
                  <div className="flex min-w-36 items-center gap-2">
                    <span className="whitespace-nowrap font-semibold">
                      {dinheiro(totalDescontos(row))}
                    </span>
                    <Button
                      onClick={() => onOpenDiscounts(row.mes)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Editar
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-2">
                  {dinheiro(row.salario_liquido_com_desconto)}
                </TableCell>
                <TableCell className="px-3 py-2">
                  {dinheiro(row.salario_final_com_ferias)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default PayrollMonthlyEntriesPanel;
