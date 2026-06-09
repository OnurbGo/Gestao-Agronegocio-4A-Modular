import ReportHeader from "@/shared/components/data-display/ReportHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { EntidadeReportData } from "@/shared/types";
import { formatCpfCnpj, formatPhone, tipoPessoaLabel } from "../helpers";

type EntidadesPrintReportProps = {
  reportData: EntidadeReportData;
};

function EntidadesPrintReport({ reportData }: EntidadesPrintReportProps) {
  return (
    <section className="print-only-report rounded-lg border border-emerald-100 bg-white p-4">
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
            <TableHead>CPF/CNPJ</TableHead>
            <TableHead>Tipo pessoa</TableHead>
            <TableHead>Vínculos</TableHead>
            <TableHead>Cidade/UF</TableHead>
            <TableHead>Telefone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportData.rows.map((item) => (
            <TableRow key={item.id_entidade}>
              <TableCell>{item.nome || "-"}</TableCell>
              <TableCell>{formatCpfCnpj(item.cpf_cnpj || "") || "-"}</TableCell>
              <TableCell>{tipoPessoaLabel(item.tipo_pessoa) || "-"}</TableCell>
              <TableCell>{item.tipos?.join(", ") || "-"}</TableCell>
              <TableCell>
                {[item.cidade, item.estado].filter(Boolean).join("/") || "-"}
              </TableCell>
              <TableCell>{formatPhone(item.telefone || item.celular || "") || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <section className="mt-3 grid gap-2 sm:grid-cols-4">
        {reportData.totals.map((item) => (
          <div className="rounded-md border border-emerald-100 bg-emerald-50/40 p-3" key={item.label}>
            <span className="block text-xs font-bold uppercase text-slate-500">
              {item.label}
            </span>
            <strong className="mt-1 block text-sm text-slate-950">{item.value}</strong>
          </div>
        ))}
      </section>
    </section>
  );
}

export default EntidadesPrintReport;
