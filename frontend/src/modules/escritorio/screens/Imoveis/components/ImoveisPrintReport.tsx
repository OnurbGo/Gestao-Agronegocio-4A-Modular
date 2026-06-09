import ReportHeader from "@/shared/components/data-display/ReportHeader";
import PrintReportLayout from "@/shared/components/data-display/PrintReportLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { ImoveisReportData } from "@/shared/types";
import { formatArea } from "../helpers";

type ImoveisPrintReportProps = {
  reportData: ImoveisReportData;
};

function ImoveisPrintReport({ reportData }: ImoveisPrintReportProps) {
  return (
    <PrintReportLayout>
      <ReportHeader
        emittedAt={reportData.emittedAt}
        filters={reportData.filters}
        subtitle={reportData.subtitle}
        title={reportData.title}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead>Município</TableHead>
            <TableHead>Colônia</TableHead>
            <TableHead>Matrícula</TableHead>
            <TableHead>Área (alq)</TableHead>
            <TableHead>Proprietários</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportData.rows.map((item) => (
            <TableRow key={item.id_imovel}>
              <TableCell>{item.nome || "-"}</TableCell>
              <TableCell>{item.lote || item.n_lote || "-"}</TableCell>
              <TableCell>{item.municipio || item.cidade || "-"}</TableCell>
              <TableCell>{item.colonia || "-"}</TableCell>
              <TableCell>{item.matricula || "-"}</TableCell>
              <TableCell>{formatArea(item.area_total)}</TableCell>
              <TableCell>
                {item.proprietarios
                  ?.map((proprietario) => proprietario.nome)
                  .join(", ") || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <section className="mt-3 grid gap-2 sm:grid-cols-4">
        {reportData.totals.map((item) => (
          <div className="avoid-print-break rounded-md border border-slate-200 bg-slate-50 p-3" key={item.label}>
            <span className="block text-xs font-bold uppercase text-slate-500">
              {item.label}
            </span>
            <strong className="mt-1 block text-sm text-slate-950">{item.value}</strong>
          </div>
        ))}
      </section>
    </PrintReportLayout>
  );
}

export default ImoveisPrintReport;
